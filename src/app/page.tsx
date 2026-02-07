import Link from "next/link";
import { Heart, Users, Mail, Zap, BarChart3, Shield } from "lucide-react";
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
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link href="/register">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4">
        <section className="py-20 text-center max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
            Donor CRM & Campaign Platform for NGOs
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Collect, manage, and engage your donors with AI-powered campaigns,
            marketing automation, and GDPR-compliant tools. Built for Romanian and international NGOs.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button size="lg">Start Free</Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline">See Features</Button>
            </Link>
          </div>
        </section>

        <section id="features" className="py-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            { icon: Users, title: "Donor CRM", desc: "Full donor profiles with history, tags, segmentation, and search." },
            { icon: Mail, title: "AI Campaigns", desc: "Generate emails and SMS with AI. Multi-channel delivery with tracking." },
            { icon: Zap, title: "Automations", desc: "Visual automation flows triggered by donations, milestones, and time." },
            { icon: Shield, title: "GDPR Compliant", desc: "Consent management, data export, anonymization, and audit logs." },
            { icon: BarChart3, title: "Analytics", desc: "Open rates, click rates, donor growth, and AI-powered insights." },
            { icon: Heart, title: "Mini-Sites", desc: "Donation and subscription forms with built-in consent collection." },
          ].map((f) => (
            <div key={f.title} className="rounded-lg border bg-card p-6 hover:shadow-md transition-shadow">
              <f.icon className="h-10 w-10 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </section>

        <section className="py-16 text-center max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">Plans</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { name: "Basic", price: "Free", features: ["Donor list (view)", "Manual thank-you emails", "GDPR tools"] },
              { name: "Pro", price: "99 RON/mo", features: ["Full CRM", "AI email generator", "Email campaigns", "Basic automations", "Analytics"] },
              { name: "Elite", price: "249 RON/mo", features: ["Everything in Pro", "SMS campaigns", "Advanced automations", "AI optimization", "A/B testing"] },
            ].map((p) => (
              <div key={p.name} className={`rounded-lg border p-6 ${p.name === "Pro" ? "border-primary shadow-lg ring-1 ring-primary" : ""}`}>
                <h3 className="font-bold text-lg">{p.name}</h3>
                <p className="text-2xl font-bold my-3">{p.price}</p>
                <ul className="text-sm text-muted-foreground space-y-2 text-left">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>NGO HUB - Donor CRM & Campaign Platform. GDPR Compliant.</p>
      </footer>
    </div>
  );
}
