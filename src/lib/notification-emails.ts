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

// ─── Invoice Email (Full Binevo-branded invoice with payment link) ───

interface InvoiceEmailItem {
  description: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  vatRate?: number;
  totalNet?: number;
  totalVat?: number;
  totalGross?: number;
}

export function invoiceEmail(params: {
  invoiceNumber: string;
  invoiceSeries?: string;
  // Seller
  sellerName: string;
  sellerCui?: string;
  sellerRegCom?: string;
  sellerAddress?: string;
  sellerCity?: string;
  sellerCounty?: string;
  sellerEmail?: string;
  sellerIban?: string;
  sellerBankName?: string;
  sellerVatPayer?: boolean;
  // Buyer
  buyerName: string;
  buyerCui?: string;
  buyerRegCom?: string;
  buyerAddress?: string;
  buyerCity?: string;
  buyerCounty?: string;
  buyerEmail?: string;
  // Invoice details
  issueDate: Date;
  dueDate?: Date | null;
  paidAt?: Date | null;
  status: string;
  // Items & totals
  items: InvoiceEmailItem[];
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  currency: string;
  // Notes
  notes?: string;
  // Payment link
  paymentUrl?: string;
}): { subject: string; html: string } {
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("ro-RO", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const statusLabel = params.status === "PAID" ? "PLATITA" :
    params.status === "ISSUED" ? "EMISA" :
    params.status === "SENT" ? "TRIMISA" :
    params.status === "OVERDUE" ? "RESTANTA" :
    params.status === "DRAFT" ? "CIORNA" : params.status;

  const statusColor = params.status === "PAID" ? "#059669" :
    params.status === "OVERDUE" ? "#dc2626" :
    params.status === "DRAFT" ? "#6b7280" : "#3b82f6";

  const statusBg = params.status === "PAID" ? "#ecfdf5" :
    params.status === "OVERDUE" ? "#fef2f2" :
    params.status === "DRAFT" ? "#f3f4f6" : "#eff6ff";

  const isPaid = params.status === "PAID" || !!params.paidAt;

  // Build items rows
  const itemRows = params.items.map((item, i) => `
    <tr>
      <td style="padding:12px 10px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b;">${i + 1}</td>
      <td style="padding:12px 10px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#1e293b;">${item.description}</td>
      <td style="padding:12px 10px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b;text-align:center;">${item.unit || "buc"}</td>
      <td style="padding:12px 10px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b;text-align:center;">${item.quantity}</td>
      <td style="padding:12px 10px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#1e293b;text-align:right;">${formatAmount(item.unitPrice)} ${params.currency}</td>
      ${params.sellerVatPayer ? `<td style="padding:12px 10px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b;text-align:center;">${item.vatRate || 0}%</td>` : ""}
      <td style="padding:12px 10px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#1e293b;text-align:right;font-weight:600;">${formatAmount(item.totalGross || item.totalNet || (item.unitPrice * item.quantity))} ${params.currency}</td>
    </tr>
  `).join("");

  // Seller address lines
  const sellerLines: string[] = [];
  if (params.sellerCui) sellerLines.push(`CUI: ${params.sellerCui}`);
  if (params.sellerRegCom) sellerLines.push(`Reg. Com.: ${params.sellerRegCom}`);
  if (params.sellerAddress) sellerLines.push(params.sellerAddress);
  if (params.sellerCity) sellerLines.push(`${params.sellerCity}${params.sellerCounty ? `, ${params.sellerCounty}` : ""}`);
  if (params.sellerEmail) sellerLines.push(`Email: ${params.sellerEmail}`);
  if (params.sellerIban) sellerLines.push(`IBAN: ${params.sellerIban}`);
  if (params.sellerBankName) sellerLines.push(`Banca: ${params.sellerBankName}`);

  // Buyer address lines
  const buyerLines: string[] = [];
  if (params.buyerCui) buyerLines.push(`CUI: ${params.buyerCui}`);
  if (params.buyerRegCom) buyerLines.push(`Reg. Com.: ${params.buyerRegCom}`);
  if (params.buyerAddress) buyerLines.push(params.buyerAddress);
  if (params.buyerCity) buyerLines.push(`${params.buyerCity}${params.buyerCounty ? `, ${params.buyerCounty}` : ""}`);
  if (params.buyerEmail) buyerLines.push(`Email: ${params.buyerEmail}`);

  return {
    subject: `Factura ${params.invoiceNumber} - ${params.buyerName}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 0;">
    <tr><td align="center">
      <table width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header with Binevo branding -->
        <tr>
          <td style="background:linear-gradient(135deg,#1e293b 0%,#334155 100%);padding:28px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <table cellpadding="0" cellspacing="0"><tr>
                    <td style="vertical-align:middle;padding-right:10px;">
                      <svg width="28" height="28" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs><linearGradient id="hg" x1="0" y1="32" x2="64" y2="32" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#22B8FF"/><stop offset="50%" stop-color="#6366F1"/><stop offset="100%" stop-color="#A855F7"/></linearGradient></defs>
                        <path d="M32 56C32 56 8 40 8 22C8 14 14 8 22 8C26.4 8 30.4 10.4 32 14C33.6 10.4 37.6 8 42 8C50 8 56 14 56 22C56 40 32 56 32 56Z" stroke="url(#hg)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                      </svg>
                    </td>
                    <td style="vertical-align:middle;font-size:22px;font-weight:700;color:#ffffff;">Binevo</td>
                  </tr></table>
                </td>
                <td align="right" style="vertical-align:middle;">
                  <span style="display:inline-block;padding:5px 14px;background:${statusBg};color:${statusColor};border-radius:20px;font-size:12px;font-weight:700;letter-spacing:0.5px;">${statusLabel}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Invoice title section -->
        <tr>
          <td style="padding:28px 32px 0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <div style="font-size:26px;font-weight:800;color:#6366f1;letter-spacing:-0.5px;">FACTURA</div>
                  <div style="font-size:16px;font-weight:600;color:#1e293b;margin-top:4px;">${params.invoiceNumber}</div>
                  ${params.invoiceSeries ? `<div style="font-size:13px;color:#94a3b8;">Seria: ${params.invoiceSeries}</div>` : ""}
                </td>
                <td align="right" style="vertical-align:top;">
                  <div style="font-size:13px;color:#64748b;">Data emiterii: <strong style="color:#1e293b;">${formatDate(params.issueDate)}</strong></div>
                  ${params.dueDate ? `<div style="font-size:13px;color:#64748b;margin-top:4px;">Scadenta: <strong style="color:#1e293b;">${formatDate(params.dueDate)}</strong></div>` : ""}
                  ${params.paidAt ? `<div style="font-size:13px;color:#059669;margin-top:4px;">Platita: <strong>${formatDate(params.paidAt)}</strong></div>` : ""}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Separator -->
        <tr><td style="padding:20px 32px 0;"><div style="border-top:1px solid #e2e8f0;"></div></td></tr>

        <!-- Seller / Buyer -->
        <tr>
          <td style="padding:20px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="48%" style="vertical-align:top;">
                  <div style="font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#6366f1;font-weight:700;margin-bottom:10px;">Furnizor</div>
                  <div style="font-size:15px;font-weight:700;color:#1e293b;margin-bottom:4px;">${params.sellerName}</div>
                  ${sellerLines.map(l => `<div style="font-size:13px;color:#475569;line-height:1.7;">${l}</div>`).join("")}
                </td>
                <td width="4%"></td>
                <td width="48%" style="vertical-align:top;">
                  <div style="font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#6366f1;font-weight:700;margin-bottom:10px;">Cumparator</div>
                  <div style="font-size:15px;font-weight:700;color:#1e293b;margin-bottom:4px;">${params.buyerName}</div>
                  ${buyerLines.map(l => `<div style="font-size:13px;color:#475569;line-height:1.7;">${l}</div>`).join("")}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Items table -->
        <tr>
          <td style="padding:0 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              <thead>
                <tr style="background:#f8fafc;">
                  <th style="padding:10px;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;font-weight:600;text-align:left;border-bottom:2px solid #e2e8f0;">Nr.</th>
                  <th style="padding:10px;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;font-weight:600;text-align:left;border-bottom:2px solid #e2e8f0;">Descriere</th>
                  <th style="padding:10px;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;font-weight:600;text-align:center;border-bottom:2px solid #e2e8f0;">UM</th>
                  <th style="padding:10px;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;font-weight:600;text-align:center;border-bottom:2px solid #e2e8f0;">Cant.</th>
                  <th style="padding:10px;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;font-weight:600;text-align:right;border-bottom:2px solid #e2e8f0;">Pret unitar</th>
                  ${params.sellerVatPayer ? `<th style="padding:10px;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;font-weight:600;text-align:center;border-bottom:2px solid #e2e8f0;">TVA %</th>` : ""}
                  <th style="padding:10px;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;font-weight:600;text-align:right;border-bottom:2px solid #e2e8f0;">Valoare</th>
                </tr>
              </thead>
              <tbody>
                ${itemRows}
              </tbody>
            </table>
          </td>
        </tr>

        <!-- Totals -->
        <tr>
          <td style="padding:16px 32px 0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="55%"></td>
                <td width="45%">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:6px 0;font-size:13px;color:#64748b;">Subtotal (fara TVA):</td>
                      <td style="padding:6px 0;font-size:13px;color:#1e293b;text-align:right;">${formatAmount(params.subtotal)} ${params.currency}</td>
                    </tr>
                    ${params.sellerVatPayer ? `
                    <tr>
                      <td style="padding:6px 0;font-size:13px;color:#64748b;">TVA:</td>
                      <td style="padding:6px 0;font-size:13px;color:#1e293b;text-align:right;">${formatAmount(params.vatAmount)} ${params.currency}</td>
                    </tr>` : ""}
                    <tr>
                      <td style="padding:12px 0 6px;font-size:18px;font-weight:800;color:#1e293b;border-top:2px solid #6366f1;">TOTAL:</td>
                      <td style="padding:12px 0 6px;font-size:18px;font-weight:800;color:#6366f1;text-align:right;border-top:2px solid #6366f1;">${formatAmount(params.totalAmount)} ${params.currency}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        ${!isPaid && params.paymentUrl ? `
        <!-- Payment CTA -->
        <tr>
          <td style="padding:24px 32px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#eff6ff 0%,#f0f0ff 100%);border:1px solid #c7d2fe;border-radius:10px;">
              <tr>
                <td style="padding:24px;text-align:center;">
                  <div style="font-size:15px;font-weight:700;color:#4338ca;margin-bottom:6px;">Plateste online rapid si sigur</div>
                  <div style="font-size:13px;color:#6366f1;margin-bottom:16px;">Puteti achita aceasta factura prin card bancar sau transfer bancar.</div>
                  <a href="${params.paymentUrl}" style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;font-size:16px;letter-spacing:0.3px;">Plateste ${formatAmount(params.totalAmount)} ${params.currency}</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>` : ""}

        ${isPaid ? `
        <!-- Paid badge -->
        <tr>
          <td style="padding:24px 32px 0;text-align:center;">
            <div style="display:inline-block;padding:10px 32px;background:#ecfdf5;border:1px solid #6ee7b7;border-radius:8px;">
              <span style="font-size:16px;font-weight:700;color:#059669;">&#10003; FACTURA ACHITATA</span>
            </div>
          </td>
        </tr>` : ""}

        ${params.notes ? `
        <!-- Notes -->
        <tr>
          <td style="padding:20px 32px 0;">
            <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;font-weight:600;margin-bottom:6px;">Observatii</div>
            <div style="font-size:13px;color:#64748b;line-height:1.6;">${params.notes}</div>
          </td>
        </tr>` : ""}

        <!-- Footer -->
        <tr>
          <td style="padding:28px 32px 0;">
            <div style="border-top:1px solid #e2e8f0;padding-top:20px;padding-bottom:24px;text-align:center;">
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>
                <td style="vertical-align:middle;padding-right:8px;">
                  <svg width="18" height="18" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs><linearGradient id="hg2" x1="0" y1="32" x2="64" y2="32" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#22B8FF"/><stop offset="50%" stop-color="#6366F1"/><stop offset="100%" stop-color="#A855F7"/></linearGradient></defs>
                    <path d="M32 56C32 56 8 40 8 22C8 14 14 8 22 8C26.4 8 30.4 10.4 32 14C33.6 10.4 37.6 8 42 8C50 8 56 14 56 22C56 40 32 56 32 56Z" stroke="url(#hg2)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                  </svg>
                </td>
                <td style="vertical-align:middle;font-size:14px;font-weight:600;color:#6366f1;">Binevo</td>
              </tr></table>
              <p style="margin:8px 0 0;font-size:12px;color:#94a3b8;">Platforma de management pentru ONG-uri din Romania</p>
              <p style="margin:4px 0 0;font-size:11px;color:#cbd5e1;">Acest email a fost trimis automat. Pentru intrebari: <a href="mailto:billing@binevo.ro" style="color:#6366f1;text-decoration:none;">billing@binevo.ro</a></p>
            </div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
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
