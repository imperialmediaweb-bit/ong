import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Termeni si Conditii | Binevo",
  description: "Termenii si conditiile de utilizare a platformei Binevo.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 mb-8">
          <ArrowLeft className="h-4 w-4" />
          Inapoi la pagina principala
        </Link>

        <h1 className="text-3xl font-bold tracking-tight mb-2">Termeni si Conditii</h1>
        <p className="text-muted-foreground mb-8">Ultima actualizare: Februarie 2026</p>

        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Informatii despre operator</h2>
            <p className="text-slate-700 leading-relaxed">
              Platforma Binevo (accesibila la adresa binevo.ro) este operata de <strong>LEGIO WEB DEVELOPMENT TOOLS S.R.L.</strong>,
              societate comerciala inregistrata in Romania, denumita in continuare &quot;Operatorul&quot;, &quot;noi&quot; sau &quot;Binevo&quot;.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Acceptarea termenilor</h2>
            <p className="text-slate-700 leading-relaxed">
              Prin accesarea si utilizarea platformei Binevo, acceptati acesti Termeni si Conditii in integralitate.
              Daca nu sunteti de acord cu oricare dintre prevederile de mai jos, va rugam sa nu utilizati platforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Descrierea serviciului</h2>
            <p className="text-slate-700 leading-relaxed">
              Binevo este o platforma SaaS (Software as a Service) dedicata organizatiilor non-profit (ONG-uri) din Romania,
              care ofera urmatoarele servicii:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2 mt-2">
              <li>Creare de mini-site (pagina web) pentru ONG cu formulare de donatii, newsletter, voluntariat</li>
              <li>Gestionarea donatorilor (CRM) cu criptare a datelor personale</li>
              <li>Procesarea donatiilor online prin Stripe, PayPal, Netopia, transfer bancar si Revolut</li>
              <li>Campanii de email si SMS marketing cu template-uri predefinite</li>
              <li>Automatizari de comunicare (fluxuri automate de mesaje)</li>
              <li>Generare de continut cu Inteligenta Artificiala (AI)</li>
              <li>Formular 230 pentru redirectionarea a 3.5% din impozitul pe venit</li>
              <li>Contracte de sponsorizare digitale</li>
              <li>Analitice si rapoarte de performanta</li>
              <li>Monitorizare mentiuni in presa si social media</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Inregistrarea si contul</h2>
            <p className="text-slate-700 leading-relaxed">
              Pentru a utiliza serviciile Binevo, trebuie sa va creati un cont si sa furnizati informatii corecte si complete
              despre organizatia dumneavoastra. Sunteti responsabil pentru securitatea contului si a parolei.
              Ne rezervam dreptul de a suspenda sau sterge conturile care furnizeaza informatii false.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Planuri si preturi</h2>
            <p className="text-slate-700 leading-relaxed">Binevo ofera trei planuri de abonament:</p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2 mt-2">
              <li><strong>GRATUIT</strong> - Mini-site complet, donatii online (comision 5%), pana la 50 donatori, Formular 230, contracte sponsorizare</li>
              <li><strong>PROFESIONAL (149 RON/luna)</strong> - Email si SMS marketing, AI, automatizari, CRM avansat, pana la 3.000 donatori, comision 2%</li>
              <li><strong>ELITE (349 RON/luna)</strong> - Toate functionalitatile, donatori nelimitati, comision 0%, Sponsor CRM, LinkedIn Prospecting, monitorizare mentiuni</li>
            </ul>
            <p className="text-slate-700 leading-relaxed mt-3">
              Creditele de email si SMS se achizitioneaza separat. Preturile sunt exprimate in RON si includ TVA acolo unde este aplicabil.
              Ne rezervam dreptul de a modifica preturile cu un preaviz de 30 de zile.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Comisioane donatii</h2>
            <p className="text-slate-700 leading-relaxed">
              Binevo retine un comision procentual din fiecare donatie procesata prin platforma, conform planului ales.
              Acest comision se deduce automat inainte de transferarea fondurilor catre ONG.
              Comisioanele procesatorilor de plati (Stripe, PayPal, Netopia) se adauga separat si sunt suportate de ONG.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Obligatiile utilizatorului (ONG)</h2>
            <ul className="list-disc pl-6 text-slate-700 space-y-2 mt-2">
              <li>Sa utilizeze platforma doar in scopuri legale si conforme cu statutul organizatiei</li>
              <li>Sa detina consimtamantul explicit al donatorilor pentru comunicarile prin email/SMS</li>
              <li>Sa respecte legislatia GDPR si Directiva ePrivacy in toate comunicarile</li>
              <li>Sa nu trimita continut spam, inselator sau fraudulos</li>
              <li>Sa mentina informatiile organizatiei actualizate si corecte</li>
              <li>Sa nu incerce sa acceseze neautorizat sistemele sau datele altor utilizatori</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Proprietate intelectuala</h2>
            <p className="text-slate-700 leading-relaxed">
              Platforma Binevo, inclusiv codul sursa, designul, logo-urile si continutul sunt proprietatea
              LEGIO WEB DEVELOPMENT TOOLS S.R.L. Continutul generat de utilizatori (texte campanii, date donatori)
              ramane proprietatea ONG-ului respectiv.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Limitarea raspunderii</h2>
            <p className="text-slate-700 leading-relaxed">
              Binevo ofera serviciul &quot;ca atare&quot; (as is). Nu garantam disponibilitatea 100% a platformei.
              Nu suntem responsabili pentru pierderile financiare rezultate din indisponibilitatea temporara a serviciului,
              erori ale procesatorilor de plati terte sau continutul generat de AI.
              Raspunderea noastra totala este limitata la suma platita de utilizator in ultimele 12 luni.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Suspendare si reziliere</h2>
            <p className="text-slate-700 leading-relaxed">
              Ne rezervam dreptul de a suspenda sau inchide conturile care incalca acesti termeni, politica anti-spam
              sau legislatia in vigoare. In caz de reziliere, datele vor fi pastrate 30 de zile, dupa care vor fi sterse definitiv.
              Utilizatorul poate solicita exportul datelor inainte de stergere.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. Modificari ale termenilor</h2>
            <p className="text-slate-700 leading-relaxed">
              Ne rezervam dreptul de a modifica acesti termeni. Utilizatorii vor fi notificati prin email cu cel putin 30 de zile inainte
              de intrarea in vigoare a modificarilor. Continuarea utilizarii platformei dupa notificare constituie acceptarea noilor termeni.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">12. Legea aplicabila</h2>
            <p className="text-slate-700 leading-relaxed">
              Acesti termeni sunt guvernati de legislatia romana. Orice litigiu va fi solutionat de instantele competente din Romania.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">13. Contact</h2>
            <p className="text-slate-700 leading-relaxed">
              Pentru intrebari legate de acesti termeni:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-1 mt-2">
              <li>Operator: <strong>LEGIO WEB DEVELOPMENT TOOLS S.R.L.</strong></li>
              <li>Email: <strong>legal@binevo.ro</strong></li>
              <li>Website: <strong>binevo.ro</strong></li>
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
