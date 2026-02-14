import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Shield, Lock, Eye, Download, Trash2, UserX } from "lucide-react";

export const metadata: Metadata = {
  title: "GDPR - Protectia Datelor | Binevo",
  description: "Informatii despre conformitatea GDPR a platformei Binevo si drepturile utilizatorilor.",
};

export default function GdprPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 mb-8">
          <ArrowLeft className="h-4 w-4" />
          Inapoi la pagina principala
        </Link>

        <h1 className="text-3xl font-bold tracking-tight mb-2">GDPR - Protectia Datelor Personale</h1>
        <p className="text-muted-foreground mb-8">Conform Regulamentului (UE) 2016/679</p>

        {/* Quick overview cards */}
        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          <div className="bg-white rounded-xl p-5 border shadow-sm">
            <Shield className="h-8 w-8 text-indigo-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Criptare AES-256</h3>
            <p className="text-sm text-gray-500">Datele sensibile ale donatorilor sunt criptate end-to-end</p>
          </div>
          <div className="bg-white rounded-xl p-5 border shadow-sm">
            <Lock className="h-8 w-8 text-green-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Consimtamant explicit</h3>
            <p className="text-sm text-gray-500">Fiecare prelucrare necesita acordul explicit al persoanei vizate</p>
          </div>
          <div className="bg-white rounded-xl p-5 border shadow-sm">
            <Download className="h-8 w-8 text-blue-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Export date</h3>
            <p className="text-sm text-gray-500">Oricand poti exporta toate datele in format CSV sau JSON</p>
          </div>
          <div className="bg-white rounded-xl p-5 border shadow-sm">
            <Trash2 className="h-8 w-8 text-red-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Dreptul la stergere</h3>
            <p className="text-sm text-gray-500">Stergerea completa a datelor la cerere, fara intrebari</p>
          </div>
        </div>

        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Operator de date</h2>
            <p className="text-slate-700 leading-relaxed">
              <strong>LEGIO WEB DEVELOPMENT TOOLS S.R.L.</strong> opereaza platforma Binevo si se angajeaza sa respecte
              toate prevederile Regulamentului General privind Protectia Datelor (GDPR).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Roluri si responsabilitati</h2>
            <div className="bg-white rounded-lg border p-4 mt-3">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-semibold text-gray-900">Context</th>
                    <th className="text-left py-2 font-semibold text-gray-900">Operator</th>
                    <th className="text-left py-2 font-semibold text-gray-900">Imputernicit</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700">
                  <tr className="border-b">
                    <td className="py-2">Date ONG-uri (conturi, facturi)</td>
                    <td className="py-2">Binevo (LEGIO)</td>
                    <td className="py-2">-</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Date donatori</td>
                    <td className="py-2">ONG-ul respectiv</td>
                    <td className="py-2">Binevo (LEGIO)</td>
                  </tr>
                  <tr>
                    <td className="py-2">Date vizitatori site</td>
                    <td className="py-2">Binevo (LEGIO)</td>
                    <td className="py-2">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Temeiul legal al prelucrarii</h2>
            <ul className="list-disc pl-6 text-slate-700 space-y-2 mt-2">
              <li><strong>Consimtamant</strong> (Art. 6(1)(a)) - pentru comunicari de marketing (email/SMS)</li>
              <li><strong>Executarea contractului</strong> (Art. 6(1)(b)) - pentru furnizarea serviciului</li>
              <li><strong>Obligatie legala</strong> (Art. 6(1)(c)) - pentru facturare si raportari fiscale</li>
              <li><strong>Interes legitim</strong> (Art. 6(1)(f)) - pentru securitate si prevenirea fraudei</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Drepturile persoanelor vizate</h2>
            <div className="space-y-4 mt-3">
              <div className="flex items-start gap-3 bg-white rounded-lg border p-4">
                <Eye className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Dreptul de acces (Art. 15)</p>
                  <p className="text-sm text-gray-500 mt-1">Puteti solicita o copie a tuturor datelor personale pe care le detinem despre dumneavoastra.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-white rounded-lg border p-4">
                <Download className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Dreptul la portabilitate (Art. 20)</p>
                  <p className="text-sm text-gray-500 mt-1">Puteti exporta datele in format CSV/JSON direct din dashboard.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-white rounded-lg border p-4">
                <Trash2 className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Dreptul la stergere (Art. 17)</p>
                  <p className="text-sm text-gray-500 mt-1">Puteti solicita stergerea completa a datelor cu anonimizare ireversibila.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-white rounded-lg border p-4">
                <UserX className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Dreptul la opozitie (Art. 21)</p>
                  <p className="text-sm text-gray-500 mt-1">Va puteti opune prelucrarii datelor in orice moment prin dezabonare sau contact direct.</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Masuri tehnice si organizatorice</h2>
            <ul className="list-disc pl-6 text-slate-700 space-y-2 mt-2">
              <li>Criptare AES-256-GCM pentru date sensibile (email, telefon donatori)</li>
              <li>Parole hash-uite cu bcrypt (factor de cost 12)</li>
              <li>Autentificare JWT cu expirare automata</li>
              <li>RBAC (Role-Based Access Control) cu 4 niveluri</li>
              <li>Audit log complet cu IP, timestamp, utilizator, actiune</li>
              <li>Backup-uri zilnice criptate</li>
              <li>Hosting in UE (conformitate GDPR)</li>
              <li>Evaluari periodice de impact asupra protectiei datelor (DPIA)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Transferuri internationale</h2>
            <p className="text-slate-700 leading-relaxed">
              Datele pot fi transferate catre furnizori din SUA (Stripe, OpenAI, SendGrid, Twilio) pe baza
              clauzelor contractuale standard (SCC) sau a deciziilor de adecvare ale Comisiei Europene.
              Toate transferurile respecta capitolul V al GDPR.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Incidente de securitate</h2>
            <p className="text-slate-700 leading-relaxed">
              In cazul unei incalcari a securitatii datelor, vom notifica ANSPDCP in termen de 72 de ore
              si vom informa persoanele vizate afectate fara intarziere nejustificata, conform Art. 33-34 GDPR.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Contact</h2>
            <p className="text-slate-700 leading-relaxed">
              Pentru exercitarea drepturilor sau intrebari despre protectia datelor:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-1 mt-2">
              <li>Operator: <strong>LEGIO WEB DEVELOPMENT TOOLS S.R.L.</strong></li>
              <li>Email DPO: <strong>privacy@binevo.ro</strong></li>
              <li>Autoritate de supraveghere: <strong>ANSPDCP</strong> - anspdcp.ro</li>
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
