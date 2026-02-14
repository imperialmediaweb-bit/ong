import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Politica de Confidentialitate | Binevo",
  description: "Politica de confidentialitate a platformei Binevo - cum protejam datele dumneavoastra.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 mb-8">
          <ArrowLeft className="h-4 w-4" />
          Inapoi la pagina principala
        </Link>

        <h1 className="text-3xl font-bold tracking-tight mb-2">Politica de Confidentialitate</h1>
        <p className="text-muted-foreground mb-8">Ultima actualizare: Februarie 2026</p>

        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Operatorul de date</h2>
            <p className="text-slate-700 leading-relaxed">
              <strong>LEGIO WEB DEVELOPMENT TOOLS S.R.L.</strong> este operatorul de date cu caracter personal
              colectate prin platforma Binevo (binevo.ro). Ne angajam sa protejam confidentialitatea datelor
              dumneavoastra in conformitate cu Regulamentul General privind Protectia Datelor (GDPR - UE 2016/679).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Ce date colectam</h2>
            <h3 className="text-lg font-medium mb-2 mt-4">2.1 Date ale ONG-urilor (utilizatori platforma)</h3>
            <ul className="list-disc pl-6 text-slate-700 space-y-1 mt-2">
              <li>Nume organizatie, CUI, adresa, date contact</li>
              <li>Nume, email si parola reprezentant/utilizator</li>
              <li>Informatii de facturare</li>
              <li>Documente de verificare (acte constitutive, certificate fiscale)</li>
              <li>Date de navigare (IP, cookies, activitate in platforma)</li>
            </ul>

            <h3 className="text-lg font-medium mb-2 mt-4">2.2 Date ale donatorilor (gestionate de ONG-uri)</h3>
            <ul className="list-disc pl-6 text-slate-700 space-y-1 mt-2">
              <li>Nume, email, telefon (criptate cu AES-256-GCM)</li>
              <li>Istoric donatii</li>
              <li>Preferinte de comunicare si consimtamant</li>
              <li>Adresa (pentru Formular 230)</li>
            </ul>
            <p className="text-slate-700 leading-relaxed mt-3">
              <strong>Important:</strong> Pentru datele donatorilor, ONG-ul este operatorul de date iar Binevo este
              imputernicitul care proceseaza datele in numele ONG-ului. Fiecare ONG raspunde de obtinerea consimtamantului
              donatorilor sai.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Scopul prelucrarii datelor</h2>
            <ul className="list-disc pl-6 text-slate-700 space-y-2 mt-2">
              <li><strong>Furnizarea serviciului</strong> - crearea si gestionarea conturilor, procesarea donatiilor, trimiterea campaniilor</li>
              <li><strong>Comunicare</strong> - notificari despre cont, facturi, modificari de serviciu</li>
              <li><strong>Imbunatatirea serviciului</strong> - analitice anonimizate despre utilizarea platformei</li>
              <li><strong>Obligatii legale</strong> - conformitate fiscala, raportari catre autoritati</li>
              <li><strong>Securitate</strong> - prevenirea fraudei, audit log pentru trasabilitate</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Cum protejam datele</h2>
            <ul className="list-disc pl-6 text-slate-700 space-y-2 mt-2">
              <li>Criptare AES-256-GCM pentru datele sensibile ale donatorilor (email, telefon)</li>
              <li>Conexiuni HTTPS criptate (TLS 1.3)</li>
              <li>Parole stocate cu hash bcrypt (cost factor 12)</li>
              <li>Autentificare bazata pe token JWT cu expirare</li>
              <li>Audit log complet pentru toate actiunile sensibile</li>
              <li>Acces bazat pe roluri (RBAC) cu 4 niveluri: Super Admin, Admin ONG, Staff, Viewer</li>
              <li>Backup-uri criptate zilnice ale bazei de date</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Partajarea datelor cu terte parti</h2>
            <p className="text-slate-700 leading-relaxed">Datele pot fi partajate cu:</p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2 mt-2">
              <li><strong>Procesatori de plati</strong> - Stripe, PayPal, Netopia (pentru procesarea donatiilor)</li>
              <li><strong>Servicii de email</strong> - SendGrid, Mailgun (pentru trimiterea campaniilor)</li>
              <li><strong>Servicii SMS</strong> - Twilio, Telnyx (pentru trimiterea SMS-urilor)</li>
              <li><strong>Servicii AI</strong> - OpenAI, Google, Anthropic (pentru generare continut - fara date personale ale donatorilor)</li>
              <li><strong>Autoritati</strong> - ANAF (pentru e-Factura), autoritati judiciare (la cerere legala)</li>
            </ul>
            <p className="text-slate-700 leading-relaxed mt-3">
              Nu vindem si nu inchiriem datele personale catre terte parti in scopuri de marketing.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Drepturile dumneavoastra (GDPR)</h2>
            <p className="text-slate-700 leading-relaxed">Aveti urmatoarele drepturi:</p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2 mt-2">
              <li><strong>Dreptul de acces</strong> - sa solicitati o copie a datelor dumneavoastra</li>
              <li><strong>Dreptul la rectificare</strong> - sa corectati datele incorecte</li>
              <li><strong>Dreptul la stergere</strong> - sa solicitati stergerea datelor (&quot;dreptul de a fi uitat&quot;)</li>
              <li><strong>Dreptul la portabilitate</strong> - sa primiti datele intr-un format structurat (CSV/JSON)</li>
              <li><strong>Dreptul la opozitie</strong> - sa va opuneti prelucrarii in anumite scopuri</li>
              <li><strong>Dreptul de retragere a consimtamantului</strong> - in orice moment</li>
            </ul>
            <p className="text-slate-700 leading-relaxed mt-3">
              ONG-urile pot exercita aceste drepturi direct din dashboard (sectiunea Confidentialitate).
              Donatorii pot contacta ONG-ul care le gestioneaza datele sau pot scrie la <strong>privacy@binevo.ro</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Cookies</h2>
            <p className="text-slate-700 leading-relaxed">
              Folosim doar cookies esentiale pentru functionarea platformei (autentificare, sesiune).
              Nu folosim cookies de tracking sau publicitate.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Perioada de pastrare</h2>
            <ul className="list-disc pl-6 text-slate-700 space-y-2 mt-2">
              <li>Date cont ONG: pe durata utilizarii + 30 zile dupa stergere</li>
              <li>Date donatori: conform politicii ONG-ului respectiv</li>
              <li>Audit log: conform planului (60 zile PRO, nelimitat ELITE)</li>
              <li>Facturi si date fiscale: 10 ani (obligatie legala)</li>
              <li>Date anonimizate: pot fi pastrate indefinit</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Contact DPO</h2>
            <p className="text-slate-700 leading-relaxed">
              Pentru orice intrebari legate de protectia datelor:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-1 mt-2">
              <li>Operator: <strong>LEGIO WEB DEVELOPMENT TOOLS S.R.L.</strong></li>
              <li>Email: <strong>privacy@binevo.ro</strong></li>
              <li>Autoritate de supraveghere: <strong>ANSPDCP</strong> (Autoritatea Nationala de Supraveghere a Prelucrarii Datelor cu Caracter Personal) - <strong>anspdcp.ro</strong></li>
            </ul>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} LEGIO WEB DEVELOPMENT TOOLS S.R.L. - Binevo</p>
        </div>
      </div>
    </div>
  );
}
