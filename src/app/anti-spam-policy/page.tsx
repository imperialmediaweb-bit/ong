import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politica Anti-Spam | Binevo",
  description: "Politica anti-spam a platformei Binevo pentru trimiterea de emailuri si SMS-uri.",
};

export default function AntiSpamPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Politica Anti-Spam</h1>
        <p className="text-muted-foreground mb-8">Ultima actualizare: Februarie 2026</p>

        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Introducere</h2>
            <p className="text-slate-700 leading-relaxed">
              Binevo este o platforma tehnica ce permite organizatiilor non-profit (ONG-uri) sa comunice cu donatorii si sustinatorii lor
              prin email si SMS. Aceasta politica anti-spam stabileste regulile si obligatiile legate de trimiterea de mesaje prin platforma noastra.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Cine este expeditorul?</h2>
            <p className="text-slate-700 leading-relaxed">
              <strong>Expeditorul mesajelor este exclusiv organizatia (ONG-ul)</strong> care utilizeaza platforma Binevo.
              Binevo actioneaza doar ca furnizor de servicii tehnice de trimitere (Email Service Provider) si nu este parte
              in relatia de comunicare intre ONG si destinatarii mesajelor.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Consimtamantul destinatarilor</h2>
            <p className="text-slate-700 leading-relaxed">
              Fiecare ONG care utilizeaza Binevo se obliga sa:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2 mt-2">
              <li>Obtina consimtamantul explicit (opt-in) al fiecarui destinatar inainte de a-i trimite mesaje.</li>
              <li>Pastreze dovezi ale consimtamantului (data, sursa, IP-ul de la care a fost acordat).</li>
              <li>Nu adauge persoane in liste de trimitere fara acordul lor.</li>
              <li>Respecte legislatia GDPR (Regulamentul UE 2016/679) si Directiva ePrivacy.</li>
            </ul>
            <p className="text-slate-700 leading-relaxed mt-3">
              Listele colectate prin formulare de pe site (newsletter, donatii) au deja consimtamantul utilizatorului
              acordat in momentul completarii formularului, cu conditia ca formularul sa contina informatii clare
              despre prelucrarea datelor.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Confirmare la fiecare campanie</h2>
            <p className="text-slate-700 leading-relaxed">
              Inainte de a trimite orice campanie, ONG-ul trebuie sa confirme printr-un checkbox ca detine
              consimtamantul destinatarilor. Aceasta confirmare este inregistrata in baza de date ca dovada legala,
              impreuna cu:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-1 mt-2">
              <li>ID-ul utilizatorului care a confirmat</li>
              <li>Adresa IP</li>
              <li>Data si ora confirmarii</li>
              <li>Textul exact al confirmarii</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Mecanism de dezabonare</h2>
            <p className="text-slate-700 leading-relaxed">
              Fiecare mesaj trimis prin Binevo contine automat un link de dezabonare (unsubscribe).
              Cererile de dezabonare sunt procesate imediat si adresa respectiva este adaugata pe o lista
              globala de blocari pentru a preveni trimiterea viitoare de mesaje.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Lista globala de blocari (Blacklist)</h2>
            <p className="text-slate-700 leading-relaxed">
              Binevo mentine o lista globala de adrese de email si numere de telefon blocate.
              Adresele sunt adaugate automat in urma:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-1 mt-2">
              <li>Dezabonarii (unsubscribe)</li>
              <li>Bounce-urilor permanente (adrese invalide)</li>
              <li>Reclamatiilor de spam</li>
              <li>Solicitarilor manuale</li>
            </ul>
            <p className="text-slate-700 leading-relaxed mt-2">
              Adresele blocate nu vor primi mesaje de la niciun ONG de pe platforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Limite de trimitere</h2>
            <p className="text-slate-700 leading-relaxed">
              Pentru a preveni abuzurile, fiecare ONG are limite zilnice de trimitere care cresc gradual
              pe masura ce organizatia demonstreaza bune practici (rate scazute de bounce si reclamatii):
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-1 mt-2">
              <li>Limita initiala: 500 emailuri / zi si 200 SMS-uri / zi</li>
              <li>Limitele pot fi crescute la cerere, dupa verificarea istoricului de trimitere</li>
              <li>Limitele se reseteaza zilnic la ora 00:00 UTC</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Continut interzis</h2>
            <p className="text-slate-700 leading-relaxed">
              Urmatoarele tipuri de continut sunt strict interzise:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-1 mt-2">
              <li>Mesaje nesolicitate (spam)</li>
              <li>Continut inselator sau fraudulos</li>
              <li>Promovare de produse sau servicii comerciale deghizate in comunicari ale ONG-ului</li>
              <li>Continut care incalca legislatia in vigoare</li>
              <li>Phishing sau tentative de colectare frauduloasa de date</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Sanctiuni</h2>
            <p className="text-slate-700 leading-relaxed">
              Incalcarea acestei politici poate duce la:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-1 mt-2">
              <li>Avertisment si solicitare de remediere</li>
              <li>Reducerea limitelor zilnice de trimitere</li>
              <li>Suspendarea temporara a functionalitatii de trimitere</li>
              <li>Suspendarea sau inchiderea contului</li>
              <li>Pierderea creditelor nefolosite, fara drept la rambursare</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Raportare abuz</h2>
            <p className="text-slate-700 leading-relaxed">
              Daca primiti mesaje nesolicitate trimise prin platforma Binevo, va rugam sa ne contactati la
              adresa <strong>abuse@binevo.ro</strong> cu detalii despre mesajul primit.
              Vom investiga si vom lua masurile necesare in termen de 48 de ore.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. Contact</h2>
            <p className="text-slate-700 leading-relaxed">
              Pentru intrebari legate de aceasta politica, ne puteti contacta la:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-1 mt-2">
              <li>Email: <strong>legal@binevo.ro</strong></li>
              <li>Adresa: Conform datelor de pe site</li>
            </ul>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>Binevo - Platforma pentru ONG-uri din Romania</p>
        </div>
      </div>
    </div>
  );
}
