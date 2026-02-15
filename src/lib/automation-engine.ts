import prisma from "./db";
import { sendEmail, generateUnsubscribeUrl } from "./email";
import { sendSms, formatPhoneNumber } from "./sms";
import { AutomationTrigger, AutomationAction } from "@prisma/client";
import { createAuditLog } from "./audit";

interface TriggerContext {
  ngoId: string;
  donorId?: string;
  campaignId?: string;
  metadata?: any;
}

export async function fireAutomationTrigger(
  trigger: AutomationTrigger,
  context: TriggerContext
): Promise<void> {
  const automations = await prisma.automation.findMany({
    where: {
      ngoId: context.ngoId,
      trigger,
      isActive: true,
    },
    include: {
      steps: { orderBy: { order: "asc" } },
      ngo: true,
    },
  });

  for (const automation of automations) {
    // Check trigger config conditions
    if (!checkTriggerConditions(automation.triggerConfig as any, context)) {
      continue;
    }

    // Create execution record
    const execution = await prisma.automationExecution.create({
      data: {
        automationId: automation.id,
        donorId: context.donorId,
        status: "running",
        data: context.metadata ? (context.metadata as any) : undefined,
      },
    });

    // Execute steps asynchronously
    executeSteps(automation, execution.id, context).catch((error) => {
      console.error(`Automation ${automation.id} execution error:`, error);
      prisma.automationExecution.update({
        where: { id: execution.id },
        data: { status: "failed", error: error.message, completedAt: new Date() },
      }).catch(console.error);
    });
  }
}

function checkTriggerConditions(
  config: Record<string, unknown> | null,
  context: TriggerContext
): boolean {
  if (!config) return true;

  // Check campaign-specific triggers
  if (config.campaignId && config.campaignId !== context.campaignId) {
    return false;
  }

  return true;
}

async function executeSteps(
  automation: any,
  executionId: string,
  context: TriggerContext
): Promise<void> {
  const steps = automation.steps;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];

    // Update execution progress
    await prisma.automationExecution.update({
      where: { id: executionId },
      data: { currentStep: i },
    });

    // Handle delay
    if (step.delayMinutes > 0) {
      // For production: use a job queue (Bull/BullMQ) instead of setTimeout
      // For now, we record the delay and skip immediate execution
      if (step.delayMinutes > 5) {
        // Store scheduled execution for long delays
        await prisma.automationExecution.update({
          where: { id: executionId },
          data: {
            status: "waiting",
            data: { ...((context.metadata || {}) as any), nextStep: i, resumeAt: new Date(Date.now() + step.delayMinutes * 60000).toISOString() },
          },
        });
        return; // Will be resumed by cron job
      }
      await new Promise((resolve) => setTimeout(resolve, step.delayMinutes * 60000));
    }

    // Execute action
    await executeAction(step.action, step.config as any, context, automation.ngo);
  }

  // Mark as completed
  await prisma.automationExecution.update({
    where: { id: executionId },
    data: { status: "completed", completedAt: new Date() },
  });
}

async function executeAction(
  action: AutomationAction,
  config: Record<string, unknown>,
  context: TriggerContext,
  ngo: any
): Promise<void> {
  const donor = context.donorId
    ? await prisma.donor.findUnique({ where: { id: context.donorId } })
    : null;

  switch (action) {
    case "SEND_EMAIL":
      if (donor?.email && donor.emailConsent) {
        const unsubUrl = generateUnsubscribeUrl(donor.id, ngo.slug);
        await sendEmail(
          {
            to: donor.email,
            subject: (config.subject as string) || "Update from " + ngo.name,
            html: (config.body as string) || (config.template as string) || "<p>Thank you for your support!</p>",
            from: ngo.senderEmail || undefined,
            fromName: ngo.senderName || ngo.name,
            unsubscribeUrl: unsubUrl,
          },
          undefined
        );
      }
      break;

    case "SEND_SMS":
      if (donor?.phone && donor.smsConsent) {
        await sendSms(
          {
            to: formatPhoneNumber(donor.phone),
            body: (config.body as string) || "Thank you for your support!",
            senderId: ngo.smsSenderId || undefined,
          },
          {
            accountSid: ngo.twilioAccountSid || undefined,
            authToken: ngo.twilioAuthToken || undefined,
            phoneNumber: ngo.twilioPhoneNumber || undefined,
            telnyxApiKey: ngo.telnyxApiKey || undefined,
            telnyxPhoneNumber: ngo.telnyxPhoneNumber || undefined,
          }
        );
      }
      break;

    case "ADD_TAG":
      if (donor && config.tagId) {
        await prisma.donorTagAssignment.upsert({
          where: {
            donorId_tagId: {
              donorId: donor.id,
              tagId: config.tagId as string,
            },
          },
          update: {},
          create: {
            donorId: donor.id,
            tagId: config.tagId as string,
          },
        });
      }
      break;

    case "REMOVE_TAG":
      if (donor && config.tagId) {
        await prisma.donorTagAssignment.deleteMany({
          where: {
            donorId: donor.id,
            tagId: config.tagId as string,
          },
        });
      }
      break;

    case "NOTIFY_ADMIN":
      // Send notification to NGO admins
      const admins = await prisma.user.findMany({
        where: { ngoId: context.ngoId, role: { in: ["NGO_ADMIN", "SUPER_ADMIN"] } },
      });
      for (const admin of admins) {
        if (admin.email) {
          await sendEmail({
            to: admin.email,
            subject: (config.subject as string) || "Automation Notification",
            html: (config.body as string) || `<p>Automation triggered for ${ngo.name}.</p>`,
          });
        }
      }
      break;

    case "AI_SUGGESTION":
      // Log the suggestion for the admin to review
      await createAuditLog({
        ngoId: context.ngoId,
        action: "AI_SUGGESTION",
        entityType: "Automation",
        details: { suggestion: config.prompt || "AI content suggestion triggered", donorId: donor?.id },
      });
      break;

    case "WAIT":
      // Handled by delay logic above
      break;

    case "CONDITION":
      // Evaluate condition - for now just log
      break;
  }
}

// Cron job handler for resuming delayed automations
export async function resumeDelayedAutomations(): Promise<void> {
  const waiting = await prisma.automationExecution.findMany({
    where: { status: "waiting" },
    include: {
      automation: {
        include: {
          steps: { orderBy: { order: "asc" } },
          ngo: true,
        },
      },
    },
  });

  const now = new Date();

  for (const execution of waiting) {
    const data = execution.data as any;
    if (!data?.resumeAt) continue;

    const resumeAt = new Date(data.resumeAt);
    if (resumeAt > now) continue;

    // Resume execution from the stored step
    const context: TriggerContext = {
      ngoId: execution.automation.ngoId,
      donorId: execution.donorId || undefined,
      metadata: data,
    };

    await prisma.automationExecution.update({
      where: { id: execution.id },
      data: { status: "running" },
    });

    const remainingSteps = execution.automation.steps.slice(data.nextStep);
    for (const step of remainingSteps) {
      await executeAction(
        step.action,
        step.config as any,
        context,
        execution.automation.ngo
      );
    }

    await prisma.automationExecution.update({
      where: { id: execution.id },
      data: { status: "completed", completedAt: new Date() },
    });
  }
}
