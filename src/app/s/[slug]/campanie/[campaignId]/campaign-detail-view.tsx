"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Heart,
  Target,
  Share2,
  Copy,
  CheckCircle2,
  ArrowLeft,
  Clock,
  CreditCard,
  Loader2,
  Check,
  TrendingUp,
  CalendarDays,
  Megaphone,
} from "lucide-react";

interface CampaignUpdate {
  id: string;
  date: string;
  text: string;
}

interface CampaignData {
  id: string;
  title: string;
  description: string;
  goalAmount: number;
  raisedAmount: number;
  imageUrl: string;
  isActive: boolean;
  updates?: CampaignUpdate[];
}

interface Props {
  campaign: CampaignData;
  ngoName: string;
  ngoSlug: string;
  ngoLogoUrl: string | null;
  primaryColor: string;
  accentColor: string;
  consentTexts: Record<string, string>;
}

function hexToRgb(hex: string): string {
  const cleaned = hex.replace("#", "");
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

const AMOUNTS = [25, 50, 100, 250, 500];

interface PaymentMethodInfo {
  id: string;
  label: string;
  available: boolean;
}

export function CampaignDetailView({
  campaign,
  ngoName,
  ngoSlug,
  ngoLogoUrl,
  primaryColor,
  accentColor,
  consentTexts,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"despre" | "actualizari">("despre");

  // Donation form state
  const [amount, setAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState("");
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [emailConsent, setEmailConsent] = useState(false);
  const [smsConsent, setSmsConsent] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodInfo[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>("direct");

  const primaryRgb = hexToRgb(primaryColor);
  const progress = campaign.goalAmount > 0
    ? Math.min(100, Math.round(((campaign.raisedAmount || 0) / campaign.goalAmount) * 100))
    : 0;

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const sortedUpdates = campaign.updates
    ? [...campaign.updates].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  useEffect(() => {
    const fetchMethods = async () => {
      try {
        const res = await fetch(`/api/donate/methods/${ngoSlug}`);
        if (res.ok) {
          const data = await res.json();
          const methods: PaymentMethodInfo[] = (data.methods || []).filter(
            (m: any) => m.id === "card" || m.id === "paypal"
          );
          setPaymentMethods(methods);
        }
      } catch {
        // fallback to direct donation
      }
    };
    fetchMethods();
  }, [ngoSlug]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleShareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: campaign.title,
          text: `Sustine campania "${campaign.title}" de la ${ngoName}`,
          url: shareUrl,
        });
      } catch {
        // User cancelled
      }
    } else {
      handleCopyLink();
    }
  };

  const handleDonationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!privacyConsent) {
      setError("Trebuie sa accepti politica de confidentialitate");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const finalAmount = customAmount ? parseFloat(customAmount) : amount;

      if (selectedMethod === "paypal") {
        const res = await fetch("/api/donate/paypal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ngoSlug,
            amount: finalAmount,
            donorEmail: donorEmail || undefined,
            donorName: donorName || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Eroare la crearea platii PayPal");
          return;
        }
        if (data.approveUrl) {
          window.location.href = data.approveUrl;
          return;
        }
        setSuccess(true);
        return;
      }

      if (selectedMethod === "card") {
        const res = await fetch("/api/donate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ngoSlug,
            amount: finalAmount,
            donorEmail: donorEmail || undefined,
            donorName: donorName || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Eroare la crearea platii cu cardul");
          return;
        }
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
          return;
        }
        setSuccess(true);
        return;
      }

      // Direct minisite donation
      const res = await fetch(`/api/minisite/${ngoSlug}/donate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalAmount,
          name: donorName,
          email: donorEmail,
          phone: donorPhone,
          emailConsent,
          smsConsent,
          privacyConsent,
          isRecurring,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Donatia a esuat");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Ceva nu a functionat. Te rugam sa incerci din nou.");
    } finally {
      setLoading(false);
    }
  };

  const hasOnlineMethods = paymentMethods.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href={`/s/${ngoSlug}#campanii`}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Inapoi la {ngoName}
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border hover:bg-gray-50 transition-colors"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Copiat!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copiaza link
                </>
              )}
            </button>
            <button
              onClick={handleShareNative}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-white transition-colors"
              style={{ backgroundColor: primaryColor }}
            >
              <Share2 className="h-4 w-4" />
              Distribuie
            </button>
          </div>
        </div>
      </header>

      {/* Hero Image */}
      {campaign.imageUrl && (
        <div className="relative w-full aspect-[2/1] sm:aspect-[21/9] max-h-[520px] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={campaign.imageUrl}
            alt={campaign.title}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 max-w-6xl mx-auto">
            <div className="flex items-center gap-2 text-white/80 text-sm mb-2">
              {ngoLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ngoLogoUrl} alt={ngoName} className="h-6 w-6 rounded-full object-cover" />
              ) : (
                <Heart className="h-4 w-4" />
              )}
              <span className="font-medium">{ngoName}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
              {campaign.title}
            </h1>
          </div>
        </div>
      )}

      {/* Header without image */}
      {!campaign.imageUrl && (
        <div
          className="relative w-full py-12 sm:py-16"
          style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-8">
            <div className="flex items-center gap-2 text-white/80 text-sm mb-3">
              {ngoLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ngoLogoUrl} alt={ngoName} className="h-6 w-6 rounded-full object-cover" />
              ) : (
                <Heart className="h-4 w-4" />
              )}
              <span className="font-medium">{ngoName}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
              {campaign.title}
            </h1>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Campaign Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Card */}
            {campaign.goalAmount > 0 && (
              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-3xl font-bold" style={{ color: primaryColor }}>
                      {Number(campaign.raisedAmount || 0).toLocaleString("ro-RO")} RON
                    </p>
                    <p className="text-sm text-gray-500">
                      strans din {Number(campaign.goalAmount).toLocaleString("ro-RO")} RON
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      {progress}%
                    </p>
                    <p className="text-sm text-gray-500">din obiectiv</p>
                  </div>
                </div>

                <div className="w-full bg-gray-100 rounded-full h-4 mb-4 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${progress}%`,
                      background: `linear-gradient(90deg, ${primaryColor}, ${accentColor})`,
                    }}
                  />
                </div>

                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <Target className="h-4 w-4" style={{ color: primaryColor }} />
                    Obiectiv: {Number(campaign.goalAmount).toLocaleString("ro-RO")} RON
                  </span>
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    {progress}% atins
                  </span>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="border-b">
              <div className="flex gap-1">
                <button
                  onClick={() => setActiveTab("despre")}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "despre"
                      ? "text-gray-900"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                  style={activeTab === "despre" ? { borderColor: primaryColor, color: primaryColor } : {}}
                >
                  Despre campanie
                </button>
                {sortedUpdates.length > 0 && (
                  <button
                    onClick={() => setActiveTab("actualizari")}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === "actualizari"
                        ? "text-gray-900"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                    style={activeTab === "actualizari" ? { borderColor: primaryColor, color: primaryColor } : {}}
                  >
                    Actualizari ({sortedUpdates.length})
                  </button>
                )}
              </div>
            </div>

            {/* Tab: Description */}
            {activeTab === "despre" && (
              <div className="space-y-6">
                {campaign.description && (
                  <div className="rounded-2xl border bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Megaphone className="h-5 w-5" style={{ color: primaryColor }} />
                      Despre aceasta campanie
                    </h2>
                    <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {campaign.description}
                    </div>
                  </div>
                )}

                {/* Latest update preview */}
                {sortedUpdates.length > 0 && (
                  <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                    <div className="p-6 pb-3">
                      <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Megaphone className="h-5 w-5 text-orange-500" />
                        Ultima actualizare
                      </h2>
                    </div>
                    <div className="px-6 pb-6">
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {new Date(sortedUpdates[0].date).toLocaleDateString("ro-RO", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{sortedUpdates[0].text}</p>
                      {sortedUpdates.length > 1 && (
                        <button
                          onClick={() => setActiveTab("actualizari")}
                          className="mt-3 text-sm font-medium hover:underline"
                          style={{ color: primaryColor }}
                        >
                          Vezi toate cele {sortedUpdates.length} actualizari
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Updates */}
            {activeTab === "actualizari" && (
              <div className="space-y-4">
                {sortedUpdates.map((update, index) => (
                  <div key={update.id} className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-full text-white text-xs font-bold shrink-0"
                          style={{ backgroundColor: primaryColor }}
                        >
                          {sortedUpdates.length - index}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {new Date(update.date).toLocaleDateString("ro-RO", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </div>
                      </div>
                      <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
                        {update.text}
                      </p>
                    </div>
                  </div>
                ))}

                {sortedUpdates.length === 0 && (
                  <div className="rounded-2xl border bg-white p-8 shadow-sm text-center">
                    <Megaphone className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Nu sunt actualizari inca.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Donation Sidebar */}
          <div className="space-y-6">
            {/* Donation Form */}
            <div className="rounded-2xl border bg-white p-6 shadow-sm sticky top-20">
              {success ? (
                <div className="py-8 text-center">
                  <div
                    className="mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-4"
                    style={{ backgroundColor: `rgba(${primaryRgb}, 0.1)` }}
                  >
                    <Check className="h-7 w-7" style={{ color: primaryColor }} />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Multumim!</h3>
                  <p className="text-sm text-gray-500">
                    Sprijinul tau de {customAmount || amount} RON inseamna foarte mult pentru {ngoName}.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleDonationSubmit} className="space-y-5">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-1">
                      <Heart className="h-5 w-5" style={{ color: primaryColor }} />
                      Doneaza acum
                    </h3>
                    <p className="text-sm text-gray-500">
                      Sustine campania &ldquo;{campaign.title}&rdquo;
                    </p>
                  </div>

                  {error && (
                    <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>
                  )}

                  {/* Payment method selection */}
                  {hasOnlineMethods && (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">Metoda de plata</label>
                      <div className={`grid gap-2 ${paymentMethods.length >= 2 ? "grid-cols-3" : "grid-cols-2"}`}>
                        <button
                          type="button"
                          onClick={() => setSelectedMethod("direct")}
                          className={`flex items-center justify-center gap-1 p-2.5 rounded-lg border text-xs font-medium transition-colors ${
                            selectedMethod === "direct"
                              ? "text-white border-transparent"
                              : "bg-white hover:bg-gray-50 border-gray-200"
                          }`}
                          style={selectedMethod === "direct" ? { backgroundColor: primaryColor } : {}}
                        >
                          <Heart className="h-3.5 w-3.5" />
                          Donatie
                        </button>
                        {paymentMethods.map((method) => (
                          <button
                            key={method.id}
                            type="button"
                            onClick={() => setSelectedMethod(method.id)}
                            className={`flex items-center justify-center gap-1 p-2.5 rounded-lg border text-xs font-medium transition-colors ${
                              selectedMethod === method.id
                                ? "text-white border-transparent"
                                : "bg-white hover:bg-gray-50 border-gray-200"
                            }`}
                            style={selectedMethod === method.id ? { backgroundColor: primaryColor } : {}}
                          >
                            {method.id === "card" && <CreditCard className="h-3.5 w-3.5" />}
                            {method.id === "paypal" && <span className="font-bold">P</span>}
                            {method.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Amount selection */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Selecteaza suma (RON)</label>
                    <div className="grid grid-cols-5 gap-1.5 mb-2">
                      {AMOUNTS.map((a) => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => { setAmount(a); setCustomAmount(""); }}
                          className={`py-2 rounded-lg border text-sm font-medium transition-colors ${
                            amount === a && !customAmount
                              ? "text-white border-transparent"
                              : "bg-white hover:bg-gray-50 border-gray-200"
                          }`}
                          style={amount === a && !customAmount ? { backgroundColor: primaryColor } : {}}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      placeholder="Alta suma"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      min="1"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                      style={{ ["--tw-ring-color" as any]: primaryColor }}
                    />
                  </div>

                  {selectedMethod === "direct" && (
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={isRecurring}
                        onChange={(e) => setIsRecurring(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      Vreau sa donez lunar
                    </label>
                  )}

                  {/* Donor info */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nume (optional)</label>
                      <input
                        value={donorName}
                        onChange={(e) => setDonorName(e.target.value)}
                        placeholder="Numele tau"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email (optional)</label>
                      <input
                        type="email"
                        value={donorEmail}
                        onChange={(e) => setDonorEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                      />
                    </div>
                    {selectedMethod === "direct" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Telefon (optional)</label>
                        <input
                          type="tel"
                          value={donorPhone}
                          onChange={(e) => setDonorPhone(e.target.value)}
                          placeholder="+40 7xx xxx xxx"
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                        />
                      </div>
                    )}
                  </div>

                  {/* Consents */}
                  <div className="space-y-2.5 border-t pt-4">
                    {selectedMethod === "direct" && (
                      <>
                        <label className="flex items-start gap-2 text-xs leading-snug">
                          <input
                            type="checkbox"
                            checked={emailConsent}
                            onChange={(e) => setEmailConsent(e.target.checked)}
                            className="mt-0.5 rounded border-gray-300"
                          />
                          <span className="text-gray-600">
                            {consentTexts.EMAIL_MARKETING || "Sunt de acord sa primesc actualizari prin email despre impactul donatiei mele"}
                          </span>
                        </label>
                        <label className="flex items-start gap-2 text-xs leading-snug">
                          <input
                            type="checkbox"
                            checked={smsConsent}
                            onChange={(e) => setSmsConsent(e.target.checked)}
                            className="mt-0.5 rounded border-gray-300"
                          />
                          <span className="text-gray-600">
                            {consentTexts.SMS_MARKETING || "Sunt de acord sa primesc notificari SMS (optional)"}
                          </span>
                        </label>
                      </>
                    )}
                    <label className="flex items-start gap-2 text-xs leading-snug">
                      <input
                        type="checkbox"
                        checked={privacyConsent}
                        onChange={(e) => setPrivacyConsent(e.target.checked)}
                        className="mt-0.5 rounded border-gray-300"
                      />
                      <span className="text-gray-600">
                        {consentTexts.PRIVACY_POLICY || "Sunt de acord cu Politica de Confidentialitate si Termenii de Utilizare"} *
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold text-white shadow-md transition-all duration-300 hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                      boxShadow: `0 4px 14px rgba(${primaryRgb}, 0.25)`,
                    }}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Se proceseaza...
                      </>
                    ) : selectedMethod === "paypal" ? (
                      <>
                        <Heart className="h-4 w-4" />
                        Plateste {customAmount || amount} RON cu PayPal
                      </>
                    ) : selectedMethod === "card" ? (
                      <>
                        <CreditCard className="h-4 w-4" />
                        Plateste {customAmount || amount} RON cu cardul
                      </>
                    ) : (
                      <>
                        <Heart className="h-4 w-4" />
                        Doneaza {customAmount || amount} RON
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Share Section */}
              <div className="mt-6 pt-6 border-t">
                <p className="text-sm font-medium mb-3">Distribuie campania</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyLink}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-xs rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                        Copiat!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copiaza link
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleShareNative}
                    className="inline-flex items-center justify-center gap-2 px-3 py-2 text-xs rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Social share links */}
                <div className="flex gap-2 mt-3">
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 text-xs rounded-lg bg-[#1877F2] text-white hover:bg-[#1877F2]/90 transition-colors"
                  >
                    Facebook
                  </a>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`${campaign.title} - ${shareUrl}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 text-xs rounded-lg bg-[#25D366] text-white hover:bg-[#25D366]/90 transition-colors"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>

            {/* NGO Info Card */}
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Organizator
              </h3>
              <div className="flex items-center gap-3 mb-3">
                {ngoLogoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={ngoLogoUrl}
                    alt={ngoName}
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                ) : (
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold"
                    style={{ backgroundColor: `rgba(${primaryRgb}, 0.1)`, color: primaryColor }}
                  >
                    {ngoName
                      .split(" ")
                      .map((w: string) => w[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                )}
                <p className="font-medium text-gray-900">{ngoName}</p>
              </div>
              <Link
                href={`/s/${ngoSlug}`}
                className="inline-flex items-center justify-center gap-1 w-full px-3 py-2 text-sm rounded-lg border hover:bg-gray-50 transition-colors"
              >
                Pagina ONG
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>
            Pagina de campanie pe{" "}
            <Link href="/" className="font-medium hover:underline" style={{ color: primaryColor }}>
              Binevo
            </Link>{" "}
            &mdash; Platforma CRM pentru ONG-uri
          </p>
        </div>
      </footer>
    </div>
  );
}
