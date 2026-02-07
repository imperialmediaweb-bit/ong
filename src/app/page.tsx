import Link from "next/link";
import { Heart, Users, Mail, Zap, BarChart3, Shield, Globe, Lock, Smartphone, TrendingUp, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold">NGO HUB</span>
        </div>
        <div className="flex gap-3">
          <Link href="/login">
            <Button variant="ghost">Autentificare</Button>
          </Link>
          <Link href="/register">
            <Button>Creeaza cont</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4">
        {/* Hero */}
        <section className="py-20 text-center max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
            Platforma CRM si Campanii pentru ONG-uri
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Colecteaza, gestioneaza si comunica cu donatorii tai prin campanii email si SMS
            generate cu AI, automatizari inteligente si instrumente conforme GDPR.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/register">
              <Button size="lg">Incepe gratuit</Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline">Descopera functiile</Button>
            </Link>
          </div>
        </section>

        {/* Stats */}
        <section className="py-8 max-w-4xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { value: "100%", label: "Conform GDPR" },
              { value: "AI", label: "Generator de continut" },
              { value: "Email + SMS", label: "Multi-canal" },
              { value: "0 RON", label: "Plan de start" },
            ].map((s) => (
              <div key={s.label} className="p-4">
                <p className="text-2xl font-bold text-primary">{s.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-16 max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Functionalitati complete</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Tot ce ai nevoie pentru a gestiona relatia cu donatorii si a creste impactul ONG-ului tau.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Users, title: "CRM Donatori", desc: "Profiluri complete cu istoric donatii, tag-uri, segmentare avansata, cautare si filtrare." },
              { icon: Mail, title: "Campanii cu AI", desc: "Genereaza email-uri si SMS-uri cu inteligenta artificiala. Livrare multi-canal cu tracking." },
              { icon: Zap, title: "Automatizari", desc: "Fluxuri automate declansate de donatii, obiective atinse sau perioade de inactivitate." },
              { icon: Shield, title: "Conformitate GDPR", desc: "Gestionare consimtamant, export date, anonimizare si jurnal de audit complet." },
              { icon: BarChart3, title: "Analitica si Rapoarte", desc: "Rate de deschidere, click, crestere donatori si sugestii AI pentru optimizare." },
              { icon: Heart, title: "Mini-Site Donatii", desc: "Formulare de donatie si abonare cu colectare automata a consimtamantului." },
              { icon: Smartphone, title: "SMS Marketing", desc: "Campanii SMS cu suport STOP, lista opt-out si sender ID personalizat." },
              { icon: Globe, title: "Bilingv RO/EN", desc: "Continut generat si tradus automat in romana si engleza cu AI." },
              { icon: Lock, title: "Securitate Avansata", desc: "Criptare AES-256 pentru date personale, RBAC pe roluri si audit log." },
            ].map((f) => (
              <div key={f.title} className="rounded-lg border bg-card p-6 hover:shadow-md transition-shadow">
                <f.icon className="h-10 w-10 text-primary mb-4" />
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Cum functioneaza?</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Inregistreaza-te", desc: "Creeaza un cont gratuit si configureaza profilul ONG-ului tau in cateva minute." },
              { step: "2", title: "Colecteaza donatori", desc: "Foloseste mini-site-ul sau formularele integrate pentru a colecta date cu consimtamant." },
              { step: "3", title: "Comunica si creste", desc: "Lanseaza campanii email/SMS cu AI si automatizeaza comunicarea cu donatorii." },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-4">
                  {s.step}
                </div>
                <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Plans */}
        <section id="plans" className="py-16 text-center max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Planuri si preturi</h2>
          <p className="text-muted-foreground mb-10">Alege planul potrivit pentru ONG-ul tau. Upgrade oricand.</p>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                name: "Basic",
                price: "Gratuit",
                period: "",
                features: [
                  "Lista donatori (vizualizare)",
                  "Email-uri manuale de multumire",
                  "Instrumente GDPR",
                  "Mini-site donatii",
                  "1 utilizator",
                ],
                cta: "Incepe gratuit",
                highlight: false,
              },
              {
                name: "Pro",
                price: "99 RON",
                period: "/luna",
                features: [
                  "CRM complet cu segmentare",
                  "Generator AI email",
                  "Campanii email nelimitate",
                  "Automatizari de baza",
                  "Analitica si rapoarte",
                  "Export CSV",
                  "5 utilizatori",
                ],
                cta: "Activeaza Pro",
                highlight: true,
              },
              {
                name: "Elite",
                price: "249 RON",
                period: "/luna",
                features: [
                  "Tot ce include Pro",
                  "Campanii SMS",
                  "Automatizari avansate",
                  "Optimizare AI continut",
                  "A/B testing",
                  "Traducere automata RO/EN",
                  "Utilizatori nelimitati",
                ],
                cta: "Activeaza Elite",
                highlight: false,
              },
            ].map((p) => (
              <div
                key={p.name}
                className={`rounded-lg border p-6 flex flex-col ${
                  p.highlight ? "border-primary shadow-lg ring-1 ring-primary" : ""
                }`}
              >
                {p.highlight && (
                  <span className="text-xs font-semibold text-primary mb-2">Cel mai popular</span>
                )}
                <h3 className="font-bold text-lg">{p.name}</h3>
                <p className="text-3xl font-bold my-3">
                  {p.price}
                  {p.period && <span className="text-base font-normal text-muted-foreground">{p.period}</span>}
                </p>
                <ul className="text-sm text-muted-foreground space-y-2.5 text-left flex-1 mb-6">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register">
                  <Button className="w-full" variant={p.highlight ? "default" : "outline"}>
                    {p.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 text-center max-w-2xl mx-auto">
          <div className="rounded-2xl bg-primary/5 border p-10">
            <TrendingUp className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-3">Pregatit sa cresti impactul ONG-ului tau?</h2>
            <p className="text-muted-foreground mb-6">
              Inregistreaza-te gratuit si incepe sa gestionezi donatorii si campaniile in mod profesionist.
            </p>
            <Link href="/register">
              <Button size="lg">Creeaza cont gratuit</Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-primary" />
            <span>NGO HUB - Platforma CRM pentru ONG-uri</span>
          </div>
          <div className="flex gap-6">
            <span>Conform GDPR</span>
            <span>Securitate AES-256</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
