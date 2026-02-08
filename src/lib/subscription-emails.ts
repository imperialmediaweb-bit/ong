/**
 * Email templates for subscription lifecycle notifications
 * All templates in Romanian
 */

const baseStyle = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 600px;
  margin: 0 auto;
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0,0,0,0.07);
`;

const headerStyle = `
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  padding: 32px 24px;
  text-align: center;
  color: white;
`;

const bodyStyle = `
  padding: 32px 24px;
  color: #374151;
  line-height: 1.6;
`;

const buttonStyle = `
  display: inline-block;
  padding: 14px 32px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  margin: 16px 0;
`;

const footerStyle = `
  padding: 20px 24px;
  background: #f9fafb;
  text-align: center;
  font-size: 12px;
  color: #9ca3af;
  border-top: 1px solid #e5e7eb;
`;

const planBadgeColors: Record<string, string> = {
  BASIC: "#64748b",
  PRO: "#3b82f6",
  ELITE: "#8b5cf6",
};

function planBadge(plan: string): string {
  const color = planBadgeColors[plan] || "#6366f1";
  return `<span style="display:inline-block;padding:4px 16px;background:${color};color:white;border-radius:20px;font-weight:600;font-size:14px;">${plan}</span>`;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function wrapTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:20px;background:#f3f4f6;">
  <div style="${baseStyle}">
    ${content}
    <div style="${footerStyle}">
      <p>NGO HUB - Platforma de management pentru ONG-uri din Romania</p>
      <p>Acest email a fost trimis automat. Va rugam sa nu raspundeti la acest mesaj.</p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Subscription Assigned ────────────────────────────────────────

export function subscriptionAssignedEmail(params: {
  ngoName: string;
  plan: string;
  expiresAt?: Date | null;
  assignedBy: string;
  dashboardUrl: string;
}): { subject: string; html: string } {
  const expiryText = params.expiresAt
    ? `<p><strong>Data expirarii:</strong> ${formatDate(params.expiresAt)}</p>`
    : `<p><strong>Durata:</strong> Nelimitata</p>`;

  return {
    subject: `Abonament ${params.plan} activat - ${params.ngoName}`,
    html: wrapTemplate(`
      <div style="${headerStyle}">
        <h1 style="margin:0;font-size:24px;">Abonament Activat!</h1>
        <p style="margin:8px 0 0;opacity:0.9;">Planul dumneavoastra a fost actualizat</p>
      </div>
      <div style="${bodyStyle}">
        <p>Buna ziua,</p>
        <p>Va informam ca abonamentul pentru <strong>${params.ngoName}</strong> a fost actualizat cu succes.</p>

        <div style="background:#f0f0ff;border-radius:8px;padding:20px;margin:20px 0;text-align:center;">
          <p style="margin:0 0 8px;color:#6b7280;font-size:14px;">Plan nou</p>
          ${planBadge(params.plan)}
          ${expiryText}
        </div>

        <h3 style="color:#1f2937;">Ce include planul ${params.plan}?</h3>
        ${getPlanFeaturesHtml(params.plan)}

        <div style="text-align:center;margin:24px 0;">
          <a href="${params.dashboardUrl}" style="${buttonStyle}">Acceseaza Dashboard-ul</a>
        </div>

        <p style="font-size:13px;color:#9ca3af;">Abonament atribuit de: ${params.assignedBy}</p>
      </div>
    `),
  };
}

// ─── Subscription Expiring Warning ────────────────────────────────

export function subscriptionExpiringEmail(params: {
  ngoName: string;
  plan: string;
  expiresAt: Date;
  daysLeft: number;
  dashboardUrl: string;
}): { subject: string; html: string } {
  const urgencyColor = params.daysLeft <= 3 ? "#dc2626" : params.daysLeft <= 7 ? "#f59e0b" : "#6366f1";

  return {
    subject: `Abonamentul expira in ${params.daysLeft} zile - ${params.ngoName}`,
    html: wrapTemplate(`
      <div style="${headerStyle.replace('#6366f1', urgencyColor).replace('#8b5cf6', urgencyColor)}">
        <h1 style="margin:0;font-size:24px;">Abonament pe cale de expirare</h1>
        <p style="margin:8px 0 0;opacity:0.9;">Mai aveti ${params.daysLeft} zile ramase</p>
      </div>
      <div style="${bodyStyle}">
        <p>Buna ziua,</p>
        <p>Va informam ca abonamentul <strong>${params.plan}</strong> pentru <strong>${params.ngoName}</strong> expira pe <strong>${formatDate(params.expiresAt)}</strong>.</p>

        <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:20px;margin:20px 0;">
          <p style="margin:0;color:#92400e;font-weight:600;">
            Atentie: Mai aveti ${params.daysLeft} zile din abonamentul ${params.plan}
          </p>
          <p style="margin:8px 0 0;color:#92400e;font-size:14px;">
            Dupa expirare, contul va fi trecut automat pe planul BASIC cu functionalitati limitate.
          </p>
        </div>

        <h3 style="color:#1f2937;">Ce pierdeti daca nu reinnoiti:</h3>
        ${getDowngradeWarningHtml(params.plan)}

        <div style="text-align:center;margin:24px 0;">
          <a href="${params.dashboardUrl}" style="${buttonStyle}">Reinnoieste Abonamentul</a>
        </div>

        <p style="font-size:14px;color:#6b7280;">Contactati-ne la <a href="mailto:contact@ngohub.ro" style="color:#6366f1;">contact@ngohub.ro</a> pentru intrebari.</p>
      </div>
    `),
  };
}

// ─── Subscription Expired ────────────────────────────────────────

export function subscriptionExpiredEmail(params: {
  ngoName: string;
  previousPlan: string;
  dashboardUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `Abonamentul ${params.previousPlan} a expirat - ${params.ngoName}`,
    html: wrapTemplate(`
      <div style="${headerStyle.replace('#6366f1', '#dc2626').replace('#8b5cf6', '#ef4444')}">
        <h1 style="margin:0;font-size:24px;">Abonament Expirat</h1>
        <p style="margin:8px 0 0;opacity:0.9;">Contul a fost trecut pe planul BASIC</p>
      </div>
      <div style="${bodyStyle}">
        <p>Buna ziua,</p>
        <p>Abonamentul <strong>${params.previousPlan}</strong> pentru <strong>${params.ngoName}</strong> a expirat.</p>

        <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:20px;margin:20px 0;">
          <p style="margin:0;color:#991b1b;font-weight:600;">
            Contul a fost trecut pe planul BASIC
          </p>
          <p style="margin:8px 0 0;color:#991b1b;font-size:14px;">
            Datele dumneavoastra sunt in siguranta, dar accesul la functiile avansate a fost dezactivat.
          </p>
        </div>

        <h3 style="color:#1f2937;">Functii dezactivate:</h3>
        ${getDowngradeWarningHtml(params.previousPlan)}

        <div style="text-align:center;margin:24px 0;">
          <a href="${params.dashboardUrl}" style="${buttonStyle.replace('#6366f1', '#dc2626').replace('#8b5cf6', '#ef4444')}">Reinnoieste Acum</a>
        </div>

        <p style="font-size:14px;color:#6b7280;">Contactati-ne la <a href="mailto:contact@ngohub.ro" style="color:#6366f1;">contact@ngohub.ro</a> pentru reinnoire.</p>
      </div>
    `),
  };
}

// ─── Subscription Renewed ────────────────────────────────────────

export function subscriptionRenewedEmail(params: {
  ngoName: string;
  plan: string;
  nextExpiresAt?: Date | null;
  dashboardUrl: string;
}): { subject: string; html: string } {
  const expiryText = params.nextExpiresAt
    ? `<p>Urmatoarea data de expirare: <strong>${formatDate(params.nextExpiresAt)}</strong></p>`
    : `<p>Abonament fara data de expirare.</p>`;

  return {
    subject: `Abonament ${params.plan} reinnoit cu succes - ${params.ngoName}`,
    html: wrapTemplate(`
      <div style="${headerStyle.replace('#6366f1', '#059669').replace('#8b5cf6', '#10b981')}">
        <h1 style="margin:0;font-size:24px;">Abonament Reinnoit!</h1>
        <p style="margin:8px 0 0;opacity:0.9;">Totul este in ordine</p>
      </div>
      <div style="${bodyStyle}">
        <p>Buna ziua,</p>
        <p>Abonamentul <strong>${params.plan}</strong> pentru <strong>${params.ngoName}</strong> a fost reinnoit cu succes.</p>

        <div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:8px;padding:20px;margin:20px 0;text-align:center;">
          <p style="margin:0 0 8px;font-size:14px;color:#065f46;">Plan activ</p>
          ${planBadge(params.plan)}
          <div style="margin-top:12px;color:#065f46;font-size:14px;">
            ${expiryText}
          </div>
        </div>

        <div style="text-align:center;margin:24px 0;">
          <a href="${params.dashboardUrl}" style="${buttonStyle.replace('#6366f1', '#059669').replace('#8b5cf6', '#10b981')}">Acceseaza Dashboard-ul</a>
        </div>
      </div>
    `),
  };
}

// ─── Payment Reminder ─────────────────────────────────────────────

export function paymentReminderEmail(params: {
  ngoName: string;
  plan: string;
  amount: number;
  currency: string;
  dueDate: Date;
  paymentUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `Factura de plata - Abonament ${params.plan} - ${params.ngoName}`,
    html: wrapTemplate(`
      <div style="${headerStyle}">
        <h1 style="margin:0;font-size:24px;">Factura de Plata</h1>
        <p style="margin:8px 0 0;opacity:0.9;">Abonament ${params.plan}</p>
      </div>
      <div style="${bodyStyle}">
        <p>Buna ziua,</p>
        <p>Aceasta este o notificare de plata pentru abonamentul <strong>${params.plan}</strong> al <strong>${params.ngoName}</strong>.</p>

        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#6b7280;">Plan:</td><td style="padding:8px 0;text-align:right;font-weight:600;">${params.plan}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280;">Suma:</td><td style="padding:8px 0;text-align:right;font-weight:600;font-size:20px;color:#6366f1;">${params.amount} ${params.currency}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280;">Scadenta:</td><td style="padding:8px 0;text-align:right;font-weight:600;">${formatDate(params.dueDate)}</td></tr>
          </table>
        </div>

        <div style="text-align:center;margin:24px 0;">
          <a href="${params.paymentUrl}" style="${buttonStyle}">Plateste Acum</a>
        </div>
      </div>
    `),
  };
}

// ─── Payment Failed ───────────────────────────────────────────────

export function paymentFailedEmail(params: {
  ngoName: string;
  plan: string;
  dashboardUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `Plata esuata pentru abonamentul ${params.plan} - ${params.ngoName}`,
    html: wrapTemplate(`
      <div style="${headerStyle.replace('#6366f1', '#dc2626').replace('#8b5cf6', '#ef4444')}">
        <h1 style="margin:0;font-size:24px;">Plata Esuata</h1>
        <p style="margin:8px 0 0;opacity:0.9;">Actualizati metoda de plata</p>
      </div>
      <div style="${bodyStyle}">
        <p>Buna ziua,</p>
        <p>Plata recurenta pentru abonamentul <strong>${params.plan}</strong> al <strong>${params.ngoName}</strong> a esuat.</p>

        <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:20px;margin:20px 0;">
          <p style="margin:0;color:#991b1b;font-weight:600;">Ce trebuie sa faceti:</p>
          <ol style="color:#991b1b;font-size:14px;margin:8px 0 0;">
            <li>Accesati dashboard-ul</li>
            <li>Mergeti la Setari > Abonament</li>
            <li>Actualizati metoda de plata</li>
          </ol>
        </div>

        <p style="font-size:14px;color:#6b7280;">
          Daca plata esueaza de 3 ori consecutiv, abonamentul va fi suspendat automat.
        </p>

        <div style="text-align:center;margin:24px 0;">
          <a href="${params.dashboardUrl}" style="${buttonStyle.replace('#6366f1', '#dc2626').replace('#8b5cf6', '#ef4444')}">Actualizeaza Plata</a>
        </div>
      </div>
    `),
  };
}

// ─── Helper: Plan features HTML ──────────────────────────────────

function getPlanFeaturesHtml(plan: string): string {
  const features: Record<string, string[]> = {
    BASIC: [
      "100 donatori",
      "Mini-site personalizabil",
      "GDPR tools de baza",
      "Vizualizare donatori",
    ],
    PRO: [
      "1.000 donatori",
      "Campanii email cu AI",
      "Generator continut AI",
      "Automatizari de baza",
      "Analitica detaliata",
      "Export CSV/Excel",
      "Suport prioritar",
    ],
    ELITE: [
      "Donatori nelimitati",
      "Campanii Email + SMS",
      "Automatizari avansate",
      "A/B Testing campanii",
      "Super Agent AI complet",
      "Optimizare AI avansata",
      "Suport dedicat 24/7",
      "Stripe Connect - plati directe",
    ],
  };

  const items = features[plan] || features.BASIC;
  return `<ul style="list-style:none;padding:0;margin:0;">${items
    .map(
      (f) =>
        `<li style="padding:6px 0;border-bottom:1px solid #f3f4f6;"><span style="color:#22c55e;margin-right:8px;">&#10003;</span>${f}</li>`
    )
    .join("")}</ul>`;
}

// ─── Helper: Downgrade warning HTML ──────────────────────────────

function getDowngradeWarningHtml(fromPlan: string): string {
  const lostFeatures: Record<string, string[]> = {
    PRO: [
      "Campanii email cu AI",
      "Generator continut AI",
      "Automatizari",
      "Analitica detaliata",
      "Export CSV/Excel",
      "Limita donatori scade la 100",
    ],
    ELITE: [
      "Campanii SMS",
      "Automatizari avansate",
      "A/B Testing",
      "Super Agent AI",
      "Optimizare AI",
      "Suport dedicat",
      "Stripe Connect",
      "Limita donatori scade la 100",
    ],
  };

  const items = lostFeatures[fromPlan] || lostFeatures.ELITE;
  return `<ul style="list-style:none;padding:0;margin:0;">${items
    .map(
      (f) =>
        `<li style="padding:6px 0;border-bottom:1px solid #f3f4f6;"><span style="color:#dc2626;margin-right:8px;">&#10007;</span>${f}</li>`
    )
    .join("")}</ul>`;
}
