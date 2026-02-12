/**
 * Platform Notification Email Templates
 * Templates for: welcome, registration, verification, donation, invoice
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

const headerStyle = (gradient: string) => `
  background: linear-gradient(135deg, ${gradient});
  padding: 32px 24px;
  text-align: center;
  color: white;
`;

const bodyStyle = `
  padding: 32px 24px;
  color: #374151;
  line-height: 1.6;
`;

const buttonStyle = (gradient: string) => `
  display: inline-block;
  padding: 14px 32px;
  background: linear-gradient(135deg, ${gradient});
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

function wrapTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:20px;background:#f3f4f6;">
  <div style="${baseStyle}">
    ${content}
    <div style="${footerStyle}">
      <p>Binevo - Platforma de management pentru ONG-uri din Romania</p>
      <p>Acest email a fost trimis automat. Va rugam sa nu raspundeti la acest mesaj.</p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Welcome Email (New User Registration) ──────────────────────

export function welcomeEmail(params: {
  userName: string;
  userEmail: string;
  loginUrl: string;
}): { subject: string; html: string } {
  return {
    subject: "Bine ai venit pe Binevo!",
    html: wrapTemplate(`
      <div style="${headerStyle('#6366f1 0%, #8b5cf6 100%')}">
        <h1 style="margin:0;font-size:24px;">Bine ai venit!</h1>
        <p style="margin:8px 0 0;opacity:0.9;">Contul tau a fost creat cu succes</p>
      </div>
      <div style="${bodyStyle}">
        <p>Salut, <strong>${params.userName || params.userEmail}</strong>!</p>
        <p>Contul tau pe platforma Binevo a fost creat cu succes. Esti gata sa incepi sa digitalizezi activitatea ONG-ului tau.</p>

        <div style="background:#f0f0ff;border-radius:8px;padding:20px;margin:20px 0;">
          <h3 style="margin:0 0 12px;color:#4f46e5;">Primii pasi:</h3>
          <ol style="margin:0;padding-left:20px;color:#374151;">
            <li style="padding:4px 0;">Completeaza profilul ONG-ului tau</li>
            <li style="padding:4px 0;">Configureaza mini-site-ul public</li>
            <li style="padding:4px 0;">Importa sau adauga donatorii existenti</li>
            <li style="padding:4px 0;">Trimite prima campanie de comunicare</li>
          </ol>
        </div>

        <div style="text-align:center;margin:24px 0;">
          <a href="${params.loginUrl}" style="${buttonStyle('#6366f1 0%, #8b5cf6 100%')}">Acceseaza Contul</a>
        </div>

        <p style="font-size:13px;color:#9ca3af;">Daca ai intrebari, contacteaza-ne la <a href="mailto:support@binevo.ro" style="color:#6366f1;">support@binevo.ro</a></p>
      </div>
    `),
  };
}

// ─── New NGO Registration (Admin Notification) ──────────────────

export function newNgoRegistrationEmail(params: {
  ngoName: string;
  adminEmail: string;
  registeredBy: string;
  adminUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `ONG nou inregistrat: ${params.ngoName}`,
    html: wrapTemplate(`
      <div style="${headerStyle('#059669 0%, #10b981 100%')}">
        <h1 style="margin:0;font-size:24px;">ONG Nou Inregistrat</h1>
        <p style="margin:8px 0 0;opacity:0.9;">Necesita verificare</p>
      </div>
      <div style="${bodyStyle}">
        <p>Un nou ONG s-a inregistrat pe platforma Binevo:</p>

        <div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:8px;padding:20px;margin:20px 0;">
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:8px 0;color:#6b7280;width:140px;">Nume ONG:</td>
              <td style="padding:8px 0;font-weight:600;">${params.ngoName}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#6b7280;">Inregistrat de:</td>
              <td style="padding:8px 0;">${params.registeredBy}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#6b7280;">Email admin:</td>
              <td style="padding:8px 0;">${params.adminEmail}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#6b7280;">Data:</td>
              <td style="padding:8px 0;">${new Date().toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
            </tr>
          </table>
        </div>

        <div style="text-align:center;margin:24px 0;">
          <a href="${params.adminUrl}" style="${buttonStyle('#059669 0%, #10b981 100%')}">Verifica ONG-ul</a>
        </div>
      </div>
    `),
  };
}

// ─── Verification Status Change ─────────────────────────────────

export function verificationStatusEmail(params: {
  ngoName: string;
  status: "APPROVED" | "REJECTED";
  reason?: string;
  dashboardUrl: string;
}): { subject: string; html: string } {
  const isApproved = params.status === "APPROVED";

  return {
    subject: isApproved
      ? `ONG-ul ${params.ngoName} a fost verificat cu succes!`
      : `Verificarea ONG-ului ${params.ngoName} a fost respinsa`,
    html: wrapTemplate(`
      <div style="${headerStyle(isApproved ? '#059669 0%, #10b981 100%' : '#dc2626 0%, #ef4444 100%')}">
        <h1 style="margin:0;font-size:24px;">${isApproved ? "Verificare Aprobata!" : "Verificare Respinsa"}</h1>
        <p style="margin:8px 0 0;opacity:0.9;">${params.ngoName}</p>
      </div>
      <div style="${bodyStyle}">
        <p>Buna ziua,</p>
        ${isApproved ? `
          <p>Felicitari! ONG-ul <strong>${params.ngoName}</strong> a fost verificat cu succes pe platforma Binevo.</p>
          <div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:8px;padding:20px;margin:20px 0;text-align:center;">
            <p style="margin:0;font-size:32px;">&#10003;</p>
            <p style="margin:8px 0 0;color:#065f46;font-weight:600;">ONG Verificat</p>
            <p style="margin:4px 0 0;color:#065f46;font-size:14px;">Badge-ul de verificare este acum vizibil pe profilul public</p>
          </div>
        ` : `
          <p>Din pacate, cererea de verificare pentru <strong>${params.ngoName}</strong> a fost respinsa.</p>
          <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:20px;margin:20px 0;">
            <p style="margin:0;color:#991b1b;font-weight:600;">Motiv respingere:</p>
            <p style="margin:8px 0 0;color:#991b1b;">${params.reason || "Nu au fost furnizate motivele."}</p>
          </div>
          <p>Puteti retrimite documentele corectate din dashboard.</p>
        `}

        <div style="text-align:center;margin:24px 0;">
          <a href="${params.dashboardUrl}" style="${buttonStyle(isApproved ? '#059669 0%, #10b981 100%' : '#6366f1 0%, #8b5cf6 100%')}">${isApproved ? "Acceseaza Dashboard" : "Retrimite Documentele"}</a>
        </div>
      </div>
    `),
  };
}

// ─── Donation Confirmation ──────────────────────────────────────

export function donationConfirmationEmail(params: {
  donorName: string;
  ngoName: string;
  amount: number;
  currency: string;
  isRecurring?: boolean;
  receiptUrl?: string;
}): { subject: string; html: string } {
  return {
    subject: `Multumim pentru donatia ta catre ${params.ngoName}!`,
    html: wrapTemplate(`
      <div style="${headerStyle('#059669 0%, #10b981 100%')}">
        <h1 style="margin:0;font-size:24px;">Multumim!</h1>
        <p style="margin:8px 0 0;opacity:0.9;">Donatia ta face diferenta</p>
      </div>
      <div style="${bodyStyle}">
        <p>Salut, <strong>${params.donorName || "Donator"}</strong>!</p>
        <p>Iti multumim din suflet pentru generozitatea ta! Donatia a fost procesata cu succes.</p>

        <div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:8px;padding:24px;margin:20px 0;text-align:center;">
          <p style="margin:0;font-size:14px;color:#065f46;">Suma donata</p>
          <p style="margin:4px 0;font-size:36px;font-weight:700;color:#059669;">${params.amount} ${params.currency}</p>
          <p style="margin:0;color:#065f46;">catre <strong>${params.ngoName}</strong></p>
          ${params.isRecurring ? '<p style="margin:8px 0 0;"><span style="background:#059669;color:white;padding:2px 10px;border-radius:12px;font-size:12px;">Donatie recurenta</span></p>' : ""}
        </div>

        ${params.receiptUrl ? `
          <div style="text-align:center;margin:24px 0;">
            <a href="${params.receiptUrl}" style="${buttonStyle('#059669 0%, #10b981 100%')}">Descarca Chitanta</a>
          </div>
        ` : ""}

        <p style="font-size:14px;color:#6b7280;">
          Aceasta confirmare serveste drept dovada a donatiei. Pastreaza acest email pentru evidenta fiscala.
        </p>
      </div>
    `),
  };
}

// ─── Invoice Email ──────────────────────────────────────────────

export function invoiceEmail(params: {
  ngoName: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  plan: string;
  period: string;
  dueDate?: Date;
  paidAt?: Date;
  invoiceUrl?: string;
}): { subject: string; html: string } {
  return {
    subject: `Factura ${params.invoiceNumber} - ${params.ngoName}`,
    html: wrapTemplate(`
      <div style="${headerStyle('#6366f1 0%, #8b5cf6 100%')}">
        <h1 style="margin:0;font-size:24px;">Factura</h1>
        <p style="margin:8px 0 0;opacity:0.9;">${params.invoiceNumber}</p>
      </div>
      <div style="${bodyStyle}">
        <p>Buna ziua,</p>
        <p>Atasam factura pentru abonamentul <strong>${params.plan}</strong> al <strong>${params.ngoName}</strong>.</p>

        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0;">
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#6b7280;">Nr. factura:</td>
              <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600;">${params.invoiceNumber}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#6b7280;">Plan:</td>
              <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600;">${params.plan}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#6b7280;">Perioada:</td>
              <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;text-align:right;">${params.period}</td>
            </tr>
            ${params.paidAt ? `
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#6b7280;">Data plata:</td>
              <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;text-align:right;">${new Date(params.paidAt).toLocaleDateString("ro-RO")}</td>
            </tr>
            ` : ""}
            <tr>
              <td style="padding:12px 0;color:#6b7280;font-size:16px;">Total:</td>
              <td style="padding:12px 0;text-align:right;font-weight:700;font-size:24px;color:#6366f1;">${params.amount} ${params.currency}</td>
            </tr>
          </table>
        </div>

        ${params.paidAt
          ? '<div style="text-align:center;margin:16px 0;"><span style="background:#059669;color:white;padding:6px 20px;border-radius:20px;font-weight:600;">ACHITATA</span></div>'
          : params.dueDate
            ? `<div style="text-align:center;margin:16px 0;"><span style="background:#f59e0b;color:white;padding:6px 20px;border-radius:20px;font-weight:600;">Scadenta: ${new Date(params.dueDate).toLocaleDateString("ro-RO")}</span></div>`
            : ""
        }

        ${params.invoiceUrl ? `
          <div style="text-align:center;margin:24px 0;">
            <a href="${params.invoiceUrl}" style="${buttonStyle('#6366f1 0%, #8b5cf6 100%')}">Descarca Factura PDF</a>
          </div>
        ` : ""}

        <p style="font-size:13px;color:#9ca3af;">
          Aceasta factura a fost generata automat de platforma Binevo.
          Pentru intrebari contactati-ne la <a href="mailto:billing@binevo.ro" style="color:#6366f1;">billing@binevo.ro</a>
        </p>
      </div>
    `),
  };
}

// ─── Password Reset ─────────────────────────────────────────────

export function passwordResetEmail(params: {
  userName: string;
  resetUrl: string;
  expiresIn: string;
}): { subject: string; html: string } {
  return {
    subject: "Resetare parola - Binevo",
    html: wrapTemplate(`
      <div style="${headerStyle('#6366f1 0%, #8b5cf6 100%')}">
        <h1 style="margin:0;font-size:24px;">Resetare Parola</h1>
        <p style="margin:8px 0 0;opacity:0.9;">S-a solicitat resetarea parolei</p>
      </div>
      <div style="${bodyStyle}">
        <p>Salut, <strong>${params.userName}</strong>!</p>
        <p>Am primit o cerere de resetare a parolei pentru contul tau Binevo.</p>

        <div style="text-align:center;margin:24px 0;">
          <a href="${params.resetUrl}" style="${buttonStyle('#6366f1 0%, #8b5cf6 100%')}">Reseteaza Parola</a>
        </div>

        <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:16px;margin:20px 0;">
          <p style="margin:0;color:#92400e;font-size:14px;">
            Acest link expira in <strong>${params.expiresIn}</strong>. Daca nu ai solicitat resetarea parolei, ignora acest email.
          </p>
        </div>

        <p style="font-size:13px;color:#9ca3af;">Din motive de securitate, nu partajati acest link cu nimeni.</p>
      </div>
    `),
  };
}
