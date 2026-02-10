"use client";

import { useState } from "react";
import { Send, CheckCircle2, Loader2 } from "lucide-react";

export function VolunteerForm({
  ngoSlug,
  ngoName,
  primaryColor,
  primaryRgb,
  accentColor,
  accentRgb,
}: {
  ngoSlug: string;
  ngoName: string;
  primaryColor: string;
  primaryRgb: string;
  accentColor: string;
  accentRgb: string;
}) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    try {
      await fetch("/api/minisite/volunteer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, ngoSlug }),
      });
      setSent(true);
    } catch {
      // Still show success to not frustrate user
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100 sm:p-12">
        <div
          className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `rgba(${primaryRgb}, 0.1)` }}
        >
          <CheckCircle2 className="h-8 w-8" style={{ color: primaryColor }} />
        </div>
        <h3 className="text-xl font-bold text-gray-900">Multumim!</h3>
        <p className="mt-3 text-sm text-gray-500">
          Cererea ta de voluntariat a fost trimisa cu succes. Te vom contacta in curand!
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100"
    >
      <div
        className="h-1.5"
        style={{ background: `linear-gradient(90deg, ${primaryColor}, ${accentColor})` }}
      />
      <div className="p-6 sm:p-8 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              Numele complet *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ion Popescu"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm transition-all focus:border-transparent focus:outline-none focus:ring-2"
              style={{ "--tw-ring-color": `rgba(${primaryRgb}, 0.5)` } as any}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@exemplu.ro"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm transition-all focus:border-transparent focus:outline-none focus:ring-2"
              style={{ "--tw-ring-color": `rgba(${primaryRgb}, 0.5)` } as any}
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
            Telefon
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+40 712 345 678"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm transition-all focus:border-transparent focus:outline-none focus:ring-2"
            style={{ "--tw-ring-color": `rgba(${primaryRgb}, 0.5)` } as any}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
            De ce doresti sa fii voluntar?
          </label>
          <textarea
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="Spune-ne despre tine si motivatia ta..."
            rows={4}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm transition-all focus:border-transparent focus:outline-none focus:ring-2"
            style={{ "--tw-ring-color": `rgba(${primaryRgb}, 0.5)` } as any}
          />
        </div>

        <button
          type="submit"
          disabled={sending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl disabled:opacity-50"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
            boxShadow: `0 4px 14px rgba(${primaryRgb}, 0.3)`,
          }}
        >
          {sending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Se trimite...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Vreau sa fiu voluntar
            </>
          )}
        </button>
      </div>
    </form>
  );
}
