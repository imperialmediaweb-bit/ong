/**
 * Pre-built Email & SMS Templates + Credit Packages
 */

export interface EmailTemplateData {
  id: string;
  name: string;
  category: string;
  subject: string;
  htmlBody: string;
  preview: string; // short description
}

export interface SmsTemplateData {
  id: string;
  name: string;
  category: string;
  body: string;
  preview: string;
}

export interface CreditPackage {
  id: string;
  name: string;
  channel: "EMAIL" | "SMS" | "BOTH";
  emailCredits: number;
  smsCredits: number;
  price: number;
  popular?: boolean;
  description: string;
}

// ─── Credit Packages ────────────────────────────────────────────

// ─── Cost Breakdown (per unit, fara TVA) ────────────────────────
//
// SendGrid (Email):
//   Essentials: $19.95/luna = ~92 RON / 50.000 emails = ~0.005 RON/email
//   Overages: $0.00133/email = ~0.006 RON/email
//   Cost mediu cu overhead: ~0.005 RON/email
//
// Twilio (SMS Romania):
//   $0.0737/SMS = ~0.34 RON/SMS
//   Alternative mai ieftine: Infobip $0.06 (~0.28 RON), Telnyx $0.004 (~0.02 RON)
//
// Preturile includ marja platforma (35-90%) + TVA se adauga la facturare
// ────────────────────────────────────────────────────────────────

export const CREDIT_PACKAGES: CreditPackage[] = [
  // ── Email Packages ──────────────────────────────────────────
  // Cost: ~0.005 RON/email
  {
    id: "email-starter",
    name: "Email Starter",
    channel: "EMAIL",
    emailCredits: 500,
    smsCredits: 0,
    price: 29,
    // Cost: 2.5 RON | Marja: 91% | ~5.8 bani/email
    description: "500 emailuri - ideal pentru ONG-uri mici",
  },
  {
    id: "email-pro",
    name: "Email Pro",
    channel: "EMAIL",
    emailCredits: 2000,
    smsCredits: 0,
    price: 59,
    popular: true,
    // Cost: 10 RON | Marja: 83% | ~2.95 bani/email
    description: "2.000 emailuri - cel mai popular pachet",
  },
  {
    id: "email-enterprise",
    name: "Email Enterprise",
    channel: "EMAIL",
    emailCredits: 10000,
    smsCredits: 0,
    price: 179,
    // Cost: 50 RON | Marja: 72% | ~1.79 bani/email
    description: "10.000 emailuri - pentru campanii mari",
  },
  // ── SMS Packages ────────────────────────────────────────────
  // Cost: ~0.34 RON/SMS (Twilio Romania)
  // NOTA: Pachetele SMS sunt momentan indisponibile.
  // ONG-urile trebuie sa configureze propriul API Twilio/Telnyx.
  {
    id: "sms-starter",
    name: "SMS Starter",
    channel: "SMS",
    emailCredits: 0,
    smsCredits: 100,
    price: 69,
    // Cost: 34 RON | Marja: 51% | 0.69 RON/SMS
    description: "100 SMS-uri - pentru notificari rapide",
  },
  {
    id: "sms-pro",
    name: "SMS Pro",
    channel: "SMS",
    emailCredits: 0,
    smsCredits: 500,
    price: 279,
    popular: true,
    // Cost: 170 RON | Marja: 39% | 0.558 RON/SMS
    description: "500 SMS-uri - campanii SMS complete",
  },
  // ── Combo Packages ──────────────────────────────────────────
  {
    id: "combo-start",
    name: "Pachet Complet Start",
    channel: "BOTH",
    emailCredits: 1000,
    smsCredits: 100,
    price: 79,
    // Cost: 5 + 34 = 39 RON | Marja: 51%
    description: "1.000 emailuri + 100 SMS-uri",
  },
  {
    id: "combo-pro",
    name: "Pachet Complet Pro",
    channel: "BOTH",
    emailCredits: 5000,
    smsCredits: 500,
    price: 299,
    popular: true,
    // Cost: 25 + 170 = 195 RON | Marja: 35%
    description: "5.000 emailuri + 500 SMS-uri - cel mai bun raport",
  },
];

// ─── Email Template HTML Generator ──────────────────────────────

function wrapHtml(content: string, bgColor = "#f3f4f6"): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:${bgColor};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${bgColor};padding:20px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
${content}
</table>
<table width="600" cellpadding="0" cellspacing="0">
<tr><td style="padding:20px;text-align:center;color:#9ca3af;font-size:12px;">
<p style="margin:0;">{{ngo.name}} | Acest email a fost trimis catre {{donor.email}}</p>
<p style="margin:8px 0 0;"><a href="{{unsubscribe_url}}" style="color:#9ca3af;">Dezabonare</a></p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

// ─── Pre-built Email Templates ──────────────────────────────────

export const SYSTEM_EMAIL_TEMPLATES: EmailTemplateData[] = [
  {
    id: "tpl-thank-you",
    name: "Multumire Donatie",
    category: "thank_you",
    subject: "Multumim din suflet, {{donor.name}}! 💜",
    preview: "Template elegant de multumire pentru donatii",
    htmlBody: wrapHtml(`
<tr><td style="background:linear-gradient(135deg,#7c3aed,#a855f7);padding:40px 30px;text-align:center;">
<h1 style="color:#ffffff;font-size:28px;margin:0;font-weight:700;">Multumim din suflet! 💜</h1>
<p style="color:#e9d5ff;font-size:16px;margin:12px 0 0;">Donatia ta face diferenta</p>
</td></tr>
<tr><td style="padding:30px;">
<p style="font-size:16px;color:#374151;line-height:1.6;margin:0 0 16px;">Draga <strong>{{donor.name}}</strong>,</p>
<p style="font-size:16px;color:#374151;line-height:1.6;margin:0 0 16px;">Iti multumim pentru generozitatea ta! Donatia ta ne ajuta sa continuam misiunea noastra si sa facem lumea un loc mai bun.</p>
<div style="background:#f5f3ff;border-left:4px solid #7c3aed;padding:16px 20px;border-radius:0 8px 8px 0;margin:20px 0;">
<p style="color:#6d28d9;font-size:14px;margin:0;font-weight:600;">Impactul tau</p>
<p style="color:#374151;font-size:15px;margin:8px 0 0;line-height:1.5;">Fiecare contributie conteaza si ne aduce mai aproape de obiectivele noastre. Impreuna construim un viitor mai bun.</p>
</div>
<p style="font-size:16px;color:#374151;line-height:1.6;margin:16px 0;">Cu recunostinta,<br><strong>Echipa {{ngo.name}}</strong></p>
</td></tr>`),
  },
  {
    id: "tpl-newsletter",
    name: "Newsletter Modern",
    category: "newsletter",
    subject: "Noutati de la {{ngo.name}} 📰",
    preview: "Newsletter curat si modern cu sectiuni",
    htmlBody: wrapHtml(`
<tr><td style="background:linear-gradient(135deg,#2563eb,#3b82f6);padding:40px 30px;text-align:center;">
<h1 style="color:#ffffff;font-size:26px;margin:0;font-weight:700;">Newsletter {{ngo.name}}</h1>
<p style="color:#bfdbfe;font-size:14px;margin:10px 0 0;">Ultimele noutati si activitati</p>
</td></tr>
<tr><td style="padding:30px;">
<p style="font-size:16px;color:#374151;line-height:1.6;margin:0 0 20px;">Buna, <strong>{{donor.name}}</strong>! Iata ce am realizat recent:</p>

<div style="border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:0 0 16px;">
<h3 style="color:#1e40af;font-size:18px;margin:0 0 8px;">📌 Stire principala</h3>
<p style="color:#4b5563;font-size:14px;line-height:1.5;margin:0;">Scrie aici despre cea mai importanta realizare sau eveniment recent al organizatiei.</p>
</div>

<div style="border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:0 0 16px;">
<h3 style="color:#1e40af;font-size:18px;margin:0 0 8px;">🎯 Progres campanie</h3>
<p style="color:#4b5563;font-size:14px;line-height:1.5;margin:0;">Actualizeaza donatorii cu progresul campaniei curente - cifre, beneficiari, obiective atinse.</p>
</div>

<div style="border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:0 0 16px;">
<h3 style="color:#1e40af;font-size:18px;margin:0 0 8px;">📅 Urmatorul eveniment</h3>
<p style="color:#4b5563;font-size:14px;line-height:1.5;margin:0;">Descrie urmatorul eveniment planificat si cum pot participa donatorii.</p>
</div>

<div style="text-align:center;margin:24px 0 0;">
<a href="#" style="display:inline-block;background:#2563eb;color:#ffffff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Afla mai multe</a>
</div>
</td></tr>`, "#eef2ff"),
  },
  {
    id: "tpl-emergency",
    name: "Apel Urgent",
    category: "emergency",
    subject: "⚠️ Apel urgent - Avem nevoie de ajutorul tau!",
    preview: "Template de urgenta cu CTA puternic",
    htmlBody: wrapHtml(`
<tr><td style="background:linear-gradient(135deg,#dc2626,#ef4444);padding:40px 30px;text-align:center;">
<h1 style="color:#ffffff;font-size:28px;margin:0;font-weight:700;">⚠️ Apel Urgent</h1>
<p style="color:#fecaca;font-size:16px;margin:12px 0 0;">Avem nevoie de sprijinul tau acum</p>
</td></tr>
<tr><td style="padding:30px;">
<p style="font-size:16px;color:#374151;line-height:1.6;margin:0 0 16px;">Draga <strong>{{donor.name}}</strong>,</p>
<p style="font-size:16px;color:#374151;line-height:1.6;margin:0 0 16px;">Ne confruntam cu o situatie urgenta si avem nevoie de sprijinul tau. Fiecare minut conteaza.</p>

<div style="background:#fef2f2;border:2px solid #fca5a5;border-radius:10px;padding:24px;margin:20px 0;text-align:center;">
<p style="color:#991b1b;font-size:20px;font-weight:700;margin:0 0 8px;">Obiectiv: X.XXX RON</p>
<p style="color:#dc2626;font-size:14px;margin:0;">Termen: [data limita]</p>
</div>

<p style="font-size:16px;color:#374151;line-height:1.6;margin:0 0 20px;">Descrie situatia aici - ce s-a intamplat, cine are nevoie de ajutor, ce se va intampla cu fondurile.</p>

<div style="text-align:center;margin:24px 0;">
<a href="#" style="display:inline-block;background:#dc2626;color:#ffffff;padding:14px 40px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;box-shadow:0 4px 12px rgba(220,38,38,0.3);">Doneaza acum</a>
</div>

<p style="font-size:14px;color:#6b7280;text-align:center;margin:16px 0 0;">Orice suma conteaza. Multumim ca faci diferenta! 🙏</p>
</td></tr>`),
  },
  {
    id: "tpl-reactivation",
    name: "Reactivare Donatori",
    category: "reactivation",
    subject: "Ne este dor de tine, {{donor.name}}! 🌟",
    preview: "Template cald pentru reactivarea donatorilor inactivi",
    htmlBody: wrapHtml(`
<tr><td style="background:linear-gradient(135deg,#059669,#10b981);padding:40px 30px;text-align:center;">
<h1 style="color:#ffffff;font-size:26px;margin:0;font-weight:700;">Ne-a fost dor de tine! 🌟</h1>
<p style="color:#a7f3d0;font-size:15px;margin:10px 0 0;">Ai facut parte din comunitatea noastra</p>
</td></tr>
<tr><td style="padding:30px;">
<p style="font-size:16px;color:#374151;line-height:1.6;margin:0 0 16px;">Draga <strong>{{donor.name}}</strong>,</p>
<p style="font-size:16px;color:#374151;line-height:1.6;margin:0 0 16px;">A trecut ceva timp de cand nu ne-am mai auzit. Vrem sa stii ca generozitatea ta a contat enorm si impactul pe care l-ai avut ramane.</p>

<div style="background:#ecfdf5;border-radius:10px;padding:24px;margin:20px 0;">
<h3 style="color:#065f46;font-size:16px;margin:0 0 12px;">Ce am realizat impreuna:</h3>
<ul style="color:#374151;font-size:14px;line-height:1.8;margin:0;padding:0 0 0 20px;">
<li>Realizare 1 - descrie impactul</li>
<li>Realizare 2 - numere concrete</li>
<li>Realizare 3 - beneficiari ajutati</li>
</ul>
</div>

<p style="font-size:16px;color:#374151;line-height:1.6;margin:0 0 20px;">Ne-ar bucura enorm sa te avem din nou alaturi. Chiar si cea mai mica contributie face o diferenta uriasa.</p>

<div style="text-align:center;margin:24px 0;">
<a href="#" style="display:inline-block;background:#059669;color:#ffffff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Revino in comunitate</a>
</div>
</td></tr>`),
  },
  {
    id: "tpl-event",
    name: "Invitatie Eveniment",
    category: "event",
    subject: "Te invitam la {{ngo.name}}! 🎉",
    preview: "Invitatie eleganta la eveniment cu detalii",
    htmlBody: wrapHtml(`
<tr><td style="background:linear-gradient(135deg,#d97706,#f59e0b);padding:40px 30px;text-align:center;">
<h1 style="color:#ffffff;font-size:26px;margin:0;font-weight:700;">🎉 Esti invitat!</h1>
<p style="color:#fef3c7;font-size:15px;margin:10px 0 0;">Un eveniment special te asteapta</p>
</td></tr>
<tr><td style="padding:30px;">
<p style="font-size:16px;color:#374151;line-height:1.6;margin:0 0 16px;">Draga <strong>{{donor.name}}</strong>,</p>
<p style="font-size:16px;color:#374151;line-height:1.6;margin:0 0 20px;">Avem bucuria sa te invitam la un eveniment special organizat de {{ngo.name}}.</p>

<div style="background:#fffbeb;border:2px solid #fbbf24;border-radius:10px;padding:24px;margin:0 0 20px;">
<h3 style="color:#92400e;font-size:18px;margin:0 0 16px;text-align:center;">📅 Detalii Eveniment</h3>
<table width="100%" style="font-size:14px;color:#374151;">
<tr><td style="padding:6px 0;font-weight:600;width:100px;">Titlu:</td><td style="padding:6px 0;">[Numele evenimentului]</td></tr>
<tr><td style="padding:6px 0;font-weight:600;">Data:</td><td style="padding:6px 0;">[Data si ora]</td></tr>
<tr><td style="padding:6px 0;font-weight:600;">Locatie:</td><td style="padding:6px 0;">[Adresa sau link online]</td></tr>
<tr><td style="padding:6px 0;font-weight:600;">Durata:</td><td style="padding:6px 0;">[Durata estimata]</td></tr>
</table>
</div>

<p style="font-size:16px;color:#374151;line-height:1.6;margin:0 0 20px;">Descrie programul evenimentului, ce pot astepta participantii, speaker-i invitati etc.</p>

<div style="text-align:center;margin:24px 0;">
<a href="#" style="display:inline-block;background:#d97706;color:#ffffff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Confirma participarea</a>
</div>
</td></tr>`),
  },
  {
    id: "tpl-impact",
    name: "Raport de Impact",
    category: "impact_report",
    subject: "Raport de impact {{ngo.name}} - Vezi ce am realizat! 📊",
    preview: "Raport vizual cu cifre si realizari",
    htmlBody: wrapHtml(`
<tr><td style="background:linear-gradient(135deg,#4f46e5,#6366f1);padding:40px 30px;text-align:center;">
<h1 style="color:#ffffff;font-size:26px;margin:0;font-weight:700;">📊 Raport de Impact</h1>
<p style="color:#c7d2fe;font-size:15px;margin:10px 0 0;">Iata ce am realizat impreuna</p>
</td></tr>
<tr><td style="padding:30px;">
<p style="font-size:16px;color:#374151;line-height:1.6;margin:0 0 20px;">Draga <strong>{{donor.name}}</strong>, iti prezentam realizarile din aceasta perioada:</p>

<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
<tr>
<td width="33%" style="padding:8px;text-align:center;">
<div style="background:#eef2ff;border-radius:10px;padding:20px 10px;">
<p style="color:#4f46e5;font-size:28px;font-weight:700;margin:0;">XXX</p>
<p style="color:#6b7280;font-size:12px;margin:4px 0 0;">Beneficiari ajutati</p>
</div>
</td>
<td width="33%" style="padding:8px;text-align:center;">
<div style="background:#ecfdf5;border-radius:10px;padding:20px 10px;">
<p style="color:#059669;font-size:28px;font-weight:700;margin:0;">XX.XXX</p>
<p style="color:#6b7280;font-size:12px;margin:4px 0 0;">RON stransi</p>
</div>
</td>
<td width="33%" style="padding:8px;text-align:center;">
<div style="background:#fef3c7;border-radius:10px;padding:20px 10px;">
<p style="color:#d97706;font-size:28px;font-weight:700;margin:0;">XX</p>
<p style="color:#6b7280;font-size:12px;margin:4px 0 0;">Proiecte active</p>
</div>
</td>
</tr>
</table>

<div style="border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:0 0 16px;">
<h3 style="color:#4f46e5;font-size:16px;margin:0 0 8px;">🏆 Realizarea lunii</h3>
<p style="color:#4b5563;font-size:14px;line-height:1.5;margin:0;">Descrie cea mai importanta realizare din aceasta luna sau trimestru.</p>
</div>

<div style="border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:0 0 16px;">
<h3 style="color:#059669;font-size:16px;margin:0 0 8px;">🎯 Urmatoarele obiective</h3>
<p style="color:#4b5563;font-size:14px;line-height:1.5;margin:0;">Descrie planurile viitoare si cum pot contribui donatorii.</p>
</div>

<p style="font-size:16px;color:#374151;line-height:1.6;margin:16px 0;">Multumim ca esti parte din povestea noastra!<br><strong>Echipa {{ngo.name}}</strong></p>
</td></tr>`, "#eef2ff"),
  },
];

// ─── Pre-built SMS Templates ────────────────────────────────────

export const SYSTEM_SMS_TEMPLATES: SmsTemplateData[] = [
  {
    id: "sms-thank-you",
    name: "Multumire Donatie",
    category: "thank_you",
    body: "Multumim, {{donor.name}}! Donatia ta catre {{ngo.name}} a fost primita cu succes. Generozitatea ta face diferenta! 💜",
    preview: "Multumire scurta pentru donatie primita",
  },
  {
    id: "sms-reminder",
    name: "Reminder Eveniment",
    category: "reminder",
    body: "Salut {{donor.name}}! Te asteptam maine la evenimentul {{ngo.name}}. Nu uita sa confirmi prezenta. Detalii: [link]",
    preview: "Reminder pentru eveniment upcoming",
  },
  {
    id: "sms-emergency",
    name: "Apel Urgent SMS",
    category: "emergency",
    body: "{{donor.name}}, {{ngo.name}} are nevoie urgenta de ajutorul tau! Fiecare contributie conteaza acum. Doneaza rapid: [link]",
    preview: "Apel urgent scurt pentru campanie de urgenta",
  },
  {
    id: "sms-update",
    name: "Update Campanie",
    category: "update",
    body: "Vesti bune de la {{ngo.name}}! Am atins X% din obiectivul campaniei. Multumim, {{donor.name}}! Afla mai multe: [link]",
    preview: "Update scurt despre progresul campaniei",
  },
  {
    id: "sms-reactivation",
    name: "Reactivare",
    category: "reactivation",
    body: "Salut {{donor.name}}! Ne-a fost dor de tine. {{ngo.name}} are nevoie de sprijinul tau. Hai inapoi in comunitate: [link] 🌟",
    preview: "Mesaj de reactivare pentru donatori inactivi",
  },
];
