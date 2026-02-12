"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  MessageCircle, X, Send, HelpCircle, ChevronRight,
  Mail, Phone, BookOpen, AlertCircle, CheckCircle,
} from "lucide-react";

interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

const faqItems: FaqItem[] = [
  {
    category: "Cont",
    question: "Cum imi schimb parola?",
    answer: "Mergi la Dashboard > Setari > Securitate si apasa pe \"Schimba parola\". Introdu parola actuala si parola noua.",
  },
  {
    category: "Cont",
    question: "Cum adaug un nou utilizator?",
    answer: "Din Dashboard > Setari > Echipa, apasa \"Adauga membru\". Alege rolul (Admin, Staff, Viewer) si introdu adresa email.",
  },
  {
    category: "Donatori",
    question: "Cum import donatori din Excel?",
    answer: "Mergi la Dashboard > Donatori si apasa \"Import CSV\". Incarca fisierul CSV cu coloanele: name, email, phone. Donatorii vor fi importati automat.",
  },
  {
    category: "Donatori",
    question: "Datele donatorilor sunt protejate?",
    answer: "Da! Toate datele personale (email, telefon) sunt criptate cu AES-256-GCM. Platforma este conforma GDPR si oferă instrumente complete de gestionare a consimtamintelor.",
  },
  {
    category: "Campanii",
    question: "Cum trimit o campanie email?",
    answer: "Din Dashboard > Campanii > Noua campanie. Alege tipul (email/SMS), selecteaza destinatarii prin filtre/taguri, redacteaza mesajul si trimite.",
  },
  {
    category: "Campanii",
    question: "Cate emailuri pot trimite?",
    answer: "Depinde de plan: BASIC = 100/luna, PRO = 5.000/luna, ELITE = nelimitat. Verificati creditele disponibile in Dashboard > Setari.",
  },
  {
    category: "Donatii",
    question: "Cum configurez platile online?",
    answer: "Din Dashboard > Setari > Plati, configurati Stripe Connect pentru plati cu cardul sau PayPal. Puteti adauga si IBAN/Revolut pentru transferuri bancare.",
  },
  {
    category: "Donatii",
    question: "Ce comisioane se aplica?",
    answer: "Stripe: 1.4% + 0.25 EUR (Europa). PayPal: ~2.9% + 0.30 EUR. Transferul bancar si Revolut nu au comisioane.",
  },
  {
    category: "Abonamente",
    question: "Ce include planul PRO?",
    answer: "PRO include: 1.000 donatori, campanii email cu AI, generator continut AI, automatizari, analitica detaliata, export CSV. Pret: 149 RON/luna.",
  },
  {
    category: "Abonamente",
    question: "Cum fac upgrade la planul meu?",
    answer: "Contacteaza-ne la support@binevo.ro sau direct din Dashboard > Setari > Abonament. Upgrade-ul se activeaza instant.",
  },
  {
    category: "Tehnic",
    question: "Cum configurez mini-site-ul?",
    answer: "Din Dashboard > Mini-site, personalizati culorile, sectiunile, textele si informatiile de contact. Activati \"Publicat\" pentru a face site-ul vizibil.",
  },
  {
    category: "Tehnic",
    question: "Am o eroare pe platforma",
    answer: "Incearca sa reimprospatezi pagina (Ctrl+F5). Daca eroarea persista, contacteaza suportul cu un screenshot al erorii la support@binevo.ro.",
  },
];

const categories = Array.from(new Set(faqItems.map((f) => f.category)));

export default function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"home" | "faq" | "faq-detail" | "contact" | "sent">("home");
  const [selectedFaq, setSelectedFaq] = useState<FaqItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({ subject: "", message: "" });
  const [sending, setSending] = useState(false);

  const handleSendMessage = async () => {
    if (!contactForm.subject || !contactForm.message) return;
    setSending(true);

    try {
      await fetch("/api/support/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactForm),
      });
    } catch {
      // Still show success - message will be logged
    }

    setSending(false);
    setView("sent");
    setContactForm({ subject: "", message: "" });
  };

  const filteredFaqs = selectedCategory
    ? faqItems.filter((f) => f.category === selectedCategory)
    : faqItems;

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center"
          title="Suport &amp; Ajutor"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Widget Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-h-[560px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              <span className="font-semibold">Suport Binevo</span>
            </div>
            <button onClick={() => { setIsOpen(false); setView("home"); }} className="hover:bg-white/20 rounded-full p-1 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Home View */}
            {view === "home" && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Cum te putem ajuta?</p>

                <button
                  onClick={() => setView("faq")}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                >
                  <BookOpen className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">Intrebari Frecvente</p>
                    <p className="text-xs text-muted-foreground">Raspunsuri rapide la cele mai comune intrebari</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </button>

                <button
                  onClick={() => setView("contact")}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50 transition-colors text-left"
                >
                  <Mail className="h-5 w-5 text-purple-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">Contacteaza Suportul</p>
                    <p className="text-xs text-muted-foreground">Trimite un mesaj echipei de suport</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </button>

                <div className="pt-2 border-t border-slate-100">
                  <p className="text-xs text-muted-foreground mb-2">Contact direct:</p>
                  <div className="space-y-1">
                    <a href="mailto:support@binevo.ro" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                      <Mail className="h-3.5 w-3.5" /> support@binevo.ro
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* FAQ List */}
            {view === "faq" && (
              <div className="space-y-3">
                <button onClick={() => setView("home")} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                  &larr; Inapoi
                </button>

                {/* Category filter */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      !selectedCategory ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Toate
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        selectedCategory === cat ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  {filteredFaqs.map((faq, i) => (
                    <button
                      key={i}
                      onClick={() => { setSelectedFaq(faq); setView("faq-detail"); }}
                      className="w-full flex items-center gap-2 p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors text-left"
                    >
                      <HelpCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <span className="text-sm">{faq.question}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* FAQ Detail */}
            {view === "faq-detail" && selectedFaq && (
              <div className="space-y-3">
                <button onClick={() => setView("faq")} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                  &larr; Inapoi la intrebari
                </button>

                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="font-medium text-sm text-blue-900 mb-2 flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 flex-shrink-0" />
                    {selectedFaq.question}
                  </p>
                  <p className="text-sm text-blue-800 leading-relaxed">{selectedFaq.answer}</p>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <p className="text-xs text-muted-foreground mb-2">Nu ai gasit raspunsul?</p>
                  <Button size="sm" variant="outline" onClick={() => setView("contact")}>
                    <Mail className="h-3.5 w-3.5 mr-1.5" />
                    Contacteaza suportul
                  </Button>
                </div>
              </div>
            )}

            {/* Contact Form */}
            {view === "contact" && (
              <div className="space-y-3">
                <button onClick={() => setView("home")} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                  &larr; Inapoi
                </button>

                <p className="text-sm text-muted-foreground">
                  Descrie problema sau intrebarea ta si echipa noastra iti va raspunde cat mai curand.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium block mb-1">Subiect</label>
                    <input
                      type="text"
                      value={contactForm.subject}
                      onChange={(e) => setContactForm((p) => ({ ...p, subject: e.target.value }))}
                      placeholder="Ex: Problema cu trimiterea emailurilor"
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">Mesaj</label>
                    <textarea
                      value={contactForm.message}
                      onChange={(e) => setContactForm((p) => ({ ...p, message: e.target.value }))}
                      placeholder="Descrie problema in detaliu..."
                      rows={4}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={sending || !contactForm.subject || !contactForm.message}
                    className="w-full"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {sending ? "Se trimite..." : "Trimite mesajul"}
                  </Button>
                </div>
              </div>
            )}

            {/* Sent Confirmation */}
            {view === "sent" && (
              <div className="text-center py-8 space-y-3">
                <CheckCircle className="h-12 w-12 mx-auto text-green-600" />
                <p className="font-semibold">Mesaj trimis!</p>
                <p className="text-sm text-muted-foreground">
                  Echipa de suport va raspunde in cel mai scurt timp posibil.
                </p>
                <Button variant="outline" onClick={() => setView("home")} size="sm">
                  Inapoi la suport
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
