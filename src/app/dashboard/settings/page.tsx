"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { PageHelp } from "@/components/ui/page-help";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building,
  Mail,
  Users,
  Save,
  Loader2,
  CheckCircle2,
  Globe,
  UserPlus,
  Trash2,
  CreditCard,
  ExternalLink,
  Palette,
  Wallet,
  Banknote,
  AlertTriangle,
  ArrowUpRight,
  Upload,
  Heart,
  Pipette,
  Check,
  Plus,
  Info,
} from "lucide-react";

interface ProfileSettings {
  ngoName: string;
  description: string;
  logoUrl: string;
  website: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Administrator" },
  { value: "MANAGER", label: "Manager" },
  { value: "MEMBER", label: "Membru" },
  { value: "VIEWER", label: "Vizualizator" },
];

const roleBadgeVariant = (role: string) => {
  switch (role) {
    case "ADMIN":
      return "destructive" as const;
    case "MANAGER":
      return "default" as const;
    case "MEMBER":
      return "secondary" as const;
    case "VIEWER":
      return "outline" as const;
    default:
      return "secondary" as const;
  }
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Profile
  const [profile, setProfile] = useState<ProfileSettings>({
    ngoName: "",
    description: "",
    logoUrl: "",
    website: "",
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [logoUploading, setLogoUploading] = useState(false);
  const logoFileRef = useRef<HTMLInputElement>(null);

  // Team
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");
  const [inviteLoading, setInviteLoading] = useState(false);

  // Mini-site
  const [minisite, setMinisite] = useState({
    heroTitle: "",
    heroDescription: "",
    primaryColor: "#6366f1",
    accentColor: "#f59e0b",
    showNewsletter: true,
    showDonation: true,
    showUpdates: true,
    customCss: "",
  });
  const [minisiteLoading, setMinisiteLoading] = useState(true);
  const [ngoSlug, setNgoSlug] = useState("");

  // Subscription
  const [subscription, setSubscription] = useState({
    plan: "BASIC",
    status: "active",
    currentPeriodEnd: null as string | null,
    expiresAt: null as string | null,
    hasStripe: false,
  });
  const [subLoading, setSubLoading] = useState(true);

  // Payment (Stripe Connect + PayPal + Bank/Revolut)
  const [payment, setPayment] = useState({
    stripeConnectId: "",
    stripeConnectStatus: "pending",
    stripeConnectOnboarded: false,
    stripeChargesEnabled: false,
    stripePayoutsEnabled: false,
    stripeLastSyncAt: null as string | null,
    paypalEmail: "",
    paypalClientId: "",
    paypalClientSecret: "",
    paypalMerchantId: "",
    paypalEnabled: false,
    bankName: "",
    ibanRon: "",
    ibanEur: "",
    revolutTag: "",
    revolutPhone: "",
    revolutLink: "",
  });
  const [paymentLoading, setPaymentLoading] = useState(true);
  const [connectLoading, setConnectLoading] = useState(false);
  const [editingPaypal, setEditingPaypal] = useState(false);
  const [newPaypalClientId, setNewPaypalClientId] = useState("");
  const [newPaypalClientSecret, setNewPaypalClientSecret] = useState("");

  // Multiple IBANs
  const [ibanAccounts, setIbanAccounts] = useState<Array<{ currency: string; iban: string; bankName: string }>>([]);

  // Fetch profile settings
  const fetchProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const res = await fetch("/api/settings/profile");
      if (!res.ok) throw new Error("Failed to fetch profile settings");
      const data = await res.json();
      setProfile(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  // Fetch team
  const fetchTeam = useCallback(async () => {
    setTeamLoading(true);
    try {
      const res = await fetch("/api/settings/team");
      if (!res.ok) throw new Error("Failed to fetch team members");
      const data = await res.json();
      setTeam(data.members || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTeamLoading(false);
    }
  }, []);

  // Fetch mini-site config
  const fetchMinisite = useCallback(async () => {
    setMinisiteLoading(true);
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.minisite) {
          setMinisite({
            heroTitle: data.minisite.heroTitle || "",
            heroDescription: data.minisite.heroDescription || "",
            primaryColor: data.minisite.primaryColor || "#6366f1",
            accentColor: data.minisite.accentColor || "#f59e0b",
            showNewsletter: data.minisite.showNewsletter !== false,
            showDonation: data.minisite.showDonation !== false,
            showUpdates: data.minisite.showUpdates !== false,
            customCss: data.minisite.customCss || "",
          });
        }
        if (data.slug) setNgoSlug(data.slug);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setMinisiteLoading(false);
    }
  }, []);

  // Fetch subscription
  const fetchSubscription = useCallback(async () => {
    setSubLoading(true);
    try {
      const res = await fetch("/api/subscription");
      if (res.ok) {
        const data = await res.json();
        setSubscription({
          plan: data.plan || "BASIC",
          status: data.status || "active",
          currentPeriodEnd: data.currentPeriodEnd || null,
          expiresAt: data.expiresAt || null,
          hasStripe: data.hasStripe || false,
        });
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setSubLoading(false);
    }
  }, []);

  // Fetch payment settings
  const fetchPayment = useCallback(async () => {
    setPaymentLoading(true);
    try {
      const res = await fetch("/api/settings/payment");
      if (res.ok) {
        const data = await res.json();
        setPayment({
          stripeConnectId: data.stripeConnectId || "",
          stripeConnectStatus: data.stripeConnectStatus || "pending",
          stripeConnectOnboarded: data.stripeConnectOnboarded || false,
          stripeChargesEnabled: data.stripeChargesEnabled || false,
          stripePayoutsEnabled: data.stripePayoutsEnabled || false,
          stripeLastSyncAt: data.stripeLastSyncAt || null,
          paypalEmail: data.paypalEmail || "",
          paypalClientId: data.paypalClientId || "",
          paypalClientSecret: data.paypalClientSecret || "",
          paypalMerchantId: data.paypalMerchantId || "",
          paypalEnabled: data.paypalEnabled || false,
          bankName: data.bankName || "",
          ibanRon: data.ibanRon || "",
          ibanEur: data.ibanEur || "",
          revolutTag: data.revolutTag || "",
          revolutPhone: data.revolutPhone || "",
          revolutLink: data.revolutLink || "",
        });
        // Load multiple IBANs
        if (data.ibanAccounts && Array.isArray(data.ibanAccounts)) {
          setIbanAccounts(data.ibanAccounts);
        } else {
          // Migrate from old ibanRon/ibanEur fields
          const migrated: Array<{ currency: string; iban: string; bankName: string }> = [];
          if (data.ibanRon) migrated.push({ currency: "RON", iban: data.ibanRon, bankName: data.bankName || "" });
          if (data.ibanEur) migrated.push({ currency: "EUR", iban: data.ibanEur, bankName: data.bankName || "" });
          if (migrated.length === 0) migrated.push({ currency: "RON", iban: "", bankName: "" });
          setIbanAccounts(migrated);
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setPaymentLoading(false);
    }
  }, []);

  useEffect(() => {
    switch (activeTab) {
      case "profile":
        fetchProfile();
        break;
      case "team":
        fetchTeam();
        break;
      case "minisite":
        fetchMinisite();
        break;
      case "subscription":
        fetchSubscription();
        break;
      case "payment":
        fetchPayment();
        break;
    }
  }, [activeTab, fetchProfile, fetchTeam, fetchMinisite, fetchSubscription, fetchPayment]);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleSaveProfile = async () => {
    clearMessages();
    setSaving(true);
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (!res.ok) throw new Error("Failed to save profile settings");
      setSuccess("Setarile profilului au fost salvate cu succes.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    clearMessages();
    setLogoUploading(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);
      const res = await fetch("/api/upload/logo", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Eroare la incarcarea logo-ului");
      }
      const data = await res.json();
      setProfile({ ...profile, logoUrl: data.logoUrl });
      setSuccess("Logo-ul a fost incarcat cu succes.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLogoUploading(false);
      if (logoFileRef.current) logoFileRef.current.value = "";
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviteLoading(true);
    clearMessages();
    try {
      const res = await fetch("/api/settings/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send invitation");
      }
      setSuccess("Invitatia a fost trimisa cu succes.");
      setInviteOpen(false);
      setInviteEmail("");
      setInviteRole("MEMBER");
      fetchTeam();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Esti sigur ca vrei sa stergi acest membru din echipa?")) return;
    clearMessages();
    try {
      const res = await fetch(`/api/settings/team/${memberId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove team member");
      fetchTeam();
      setSuccess("Membru echipa sters.");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSaveMinisite = async () => {
    clearMessages();
    setSaving(true);
    try {
      const res = await fetch("/api/settings/minisite", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(minisite),
      });
      if (!res.ok) throw new Error("Failed to save mini-site settings");
      setSuccess("Setarile mini-site au fost salvate cu succes.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleStartOnboarding = async () => {
    clearMessages();
    setConnectLoading(true);
    try {
      const res = await fetch("/api/connect/onboard", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Eroare la initierea onboarding-ului");
      }
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setConnectLoading(false);
    }
  };

  const handleStripeDashboard = async () => {
    clearMessages();
    setConnectLoading(true);
    try {
      const res = await fetch("/api/connect/dashboard", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Eroare la accesarea dashboard-ului Stripe");
      }
      const data = await res.json();
      if (data.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setConnectLoading(false);
    }
  };

  const handleSavePayment = async () => {
    clearMessages();
    setSaving(true);
    try {
      // Extract first RON/EUR iban for backward compatibility
      const ronAccount = ibanAccounts.find(a => a.currency === "RON");
      const eurAccount = ibanAccounts.find(a => a.currency === "EUR");
      const payload: any = {
        bankName: ibanAccounts[0]?.bankName || payment.bankName,
        ibanRon: ronAccount?.iban || "",
        ibanEur: eurAccount?.iban || "",
        ibanAccounts: ibanAccounts.filter(a => a.iban.trim() !== ""),
        revolutTag: payment.revolutTag,
        revolutPhone: payment.revolutPhone,
        revolutLink: payment.revolutLink,
        paypalEmail: payment.paypalEmail,
        paypalMerchantId: payment.paypalMerchantId,
        paypalEnabled: payment.paypalEnabled,
      };
      if (editingPaypal) {
        if (newPaypalClientId) payload.paypalClientId = newPaypalClientId;
        if (newPaypalClientSecret) payload.paypalClientSecret = newPaypalClientSecret;
      }
      const res = await fetch("/api/settings/payment", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Eroare la salvarea setarilor");
      }
      setSuccess("Setarile de plata au fost salvate cu succes.");
      setEditingPaypal(false);
      setNewPaypalClientId("");
      setNewPaypalClientSecret("");
      fetchPayment();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const PLAN_ORDER: Record<string, number> = { BASIC: 0, PRO: 1, ELITE: 2 };

  const handleChangePlan = async (plan: string) => {
    clearMessages();
    const currentPlanOrder = PLAN_ORDER[subscription.plan] ?? 0;
    const newPlanOrder = PLAN_ORDER[plan] ?? 0;
    const isUpgrade = newPlanOrder > currentPlanOrder;

    // For upgrades, redirect to checkout page directly
    if (isUpgrade) {
      window.location.href = `/checkout?plan=${plan}`;
      return;
    }

    // For downgrades, confirm and call API
    if (!confirm(`Esti sigur ca vrei sa faci downgrade la planul ${plan}? Vei pierde acces la unele functionalitati.`)) {
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      if (!res.ok) throw new Error("Eroare la schimbarea planului");
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setSuccess(`Planul a fost schimbat la ${plan}.`);
      fetchSubscription();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Setari</h1>
        <p className="text-muted-foreground">
          Gestioneaza organizatia, integrarile si echipa.
        </p>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="py-4 flex items-center justify-between">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>Inchide</Button>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card className="border-green-500">
          <CardContent className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <p className="text-sm">{success}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSuccess(null)}>Inchide</Button>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); clearMessages(); }}>
        <TabsList className="grid w-full grid-cols-5 overflow-x-auto">
          <TabsTrigger value="profile" className="gap-1 text-xs">
            <Building className="h-3 w-3" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="minisite" className="gap-1 text-xs">
            <Palette className="h-3 w-3" />
            Culori
          </TabsTrigger>
          <TabsTrigger value="payment" className="gap-1 text-xs">
            <Wallet className="h-3 w-3" />
            Plati
          </TabsTrigger>
          <TabsTrigger value="subscription" className="gap-1 text-xs">
            <CreditCard className="h-3 w-3" />
            Abonament
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-1 text-xs">
            <Users className="h-3 w-3" />
            Echipa
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Profilul organizatiei
              </CardTitle>
              <CardDescription>
                Informatii de baza despre ONG-ul tau afisate pe platforma.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {profileLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="ngoName">Numele organizatiei</Label>
                    <Input
                      id="ngoName"
                      placeholder="Numele organizatiei tale"
                      value={profile.ngoName}
                      onChange={(e) => setProfile({ ...profile, ngoName: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Descriere</Label>
                    <Textarea
                      id="description"
                      placeholder="Scurta descriere a organizatiei tale..."
                      value={profile.description}
                      onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                      className="min-h-[100px]"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Logo organizatie</Label>
                    <div className="flex items-start gap-4">
                      <div className="flex h-20 w-20 items-center justify-center rounded-xl border-2 border-dashed bg-muted shrink-0 overflow-hidden">
                        {profile.logoUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={profile.logoUrl}
                            alt="Logo"
                            className="h-full w-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="flex flex-col items-center text-muted-foreground">
                            <Heart className="h-6 w-6 text-indigo-400" />
                            <span className="text-[10px] mt-1">Fara logo</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => logoFileRef.current?.click()}
                            disabled={logoUploading}
                          >
                            {logoUploading ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Upload className="mr-2 h-4 w-4" />
                            )}
                            Incarca logo
                          </Button>
                          {profile.logoUrl && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setProfile({ ...profile, logoUrl: "" })}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="mr-1 h-3 w-3" />
                              Sterge
                            </Button>
                          )}
                        </div>
                        <input
                          ref={logoFileRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/svg+xml"
                          className="hidden"
                          onChange={handleLogoUpload}
                        />
                        <p className="text-xs text-muted-foreground">
                          JPG, PNG, WebP sau SVG. Max 5MB.
                        </p>
                        <div className="flex gap-2 items-center">
                          <span className="text-xs text-muted-foreground">sau URL:</span>
                          <Input
                            id="logoUrl"
                            placeholder="https://example.com/logo.png"
                            value={profile.logoUrl}
                            onChange={(e) => setProfile({ ...profile, logoUrl: e.target.value })}
                            className="flex-1 h-8 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="website">Site web</Label>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                      <Input
                        id="website"
                        placeholder="https://your-ngo.org"
                        value={profile.website}
                        onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="border-t pt-6">
              <Button onClick={handleSaveProfile} disabled={saving || profileLoading}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Salveaza profilul
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Mini-site Colors Tab */}
        <TabsContent value="minisite">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Culorile site-ului tau
              </CardTitle>
              <CardDescription>
                Alege culorile potrivite pentru mini-site-ul ONG-ului tau. Culoarea principala e folosita pentru butoane, header si linkuri. Culoarea accent e pentru elemente importante (donatii, CTA).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {minisiteLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {/* Color palette suggestions */}
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Palete de culori sugerate</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        { name: "Albastru clasic", primary: "#2563eb", accent: "#f59e0b" },
                        { name: "Verde natura", primary: "#059669", accent: "#f97316" },
                        { name: "Indigo modern", primary: "#6366f1", accent: "#f59e0b" },
                        { name: "Rosu cald", primary: "#dc2626", accent: "#2563eb" },
                        { name: "Violet regal", primary: "#7c3aed", accent: "#10b981" },
                        { name: "Turcoaz fresh", primary: "#0891b2", accent: "#e11d48" },
                        { name: "Portocaliu energie", primary: "#ea580c", accent: "#6366f1" },
                        { name: "Roz empatie", primary: "#db2777", accent: "#0891b2" },
                        { name: "Albastru inchis", primary: "#1e40af", accent: "#fbbf24" },
                      ].map((palette) => {
                        const isSelected = minisite.primaryColor === palette.primary && minisite.accentColor === palette.accent;
                        return (
                          <button
                            key={palette.name}
                            type="button"
                            onClick={() => setMinisite({ ...minisite, primaryColor: palette.primary, accentColor: palette.accent })}
                            className={`relative flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-all hover:shadow-md ${
                              isSelected ? "border-indigo-500 bg-indigo-50 shadow-md" : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            {isSelected && (
                              <div className="absolute -top-1.5 -right-1.5 rounded-full bg-indigo-500 p-0.5">
                                <Check className="h-3 w-3 text-white" />
                              </div>
                            )}
                            <div className="flex gap-1 shrink-0">
                              <div className="h-8 w-8 rounded-lg shadow-inner" style={{ backgroundColor: palette.primary }} />
                              <div className="h-8 w-8 rounded-lg shadow-inner" style={{ backgroundColor: palette.accent }} />
                            </div>
                            <span className="text-xs font-medium leading-tight">{palette.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom color pickers */}
                  <div className="grid sm:grid-cols-2 gap-6 pt-2">
                    <div className="space-y-3">
                      <Label className="flex items-center gap-2">
                        <Pipette className="h-4 w-4" />
                        Culoare principala
                      </Label>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <input
                            type="color"
                            value={minisite.primaryColor}
                            onChange={(e) => setMinisite({ ...minisite, primaryColor: e.target.value })}
                            className="h-12 w-12 cursor-pointer rounded-lg border-2 border-gray-200 p-0.5"
                          />
                        </div>
                        <div className="flex-1">
                          <Input
                            value={minisite.primaryColor}
                            onChange={(e) => setMinisite({ ...minisite, primaryColor: e.target.value })}
                            placeholder="#6366f1"
                            className="font-mono text-sm"
                          />
                        </div>
                      </div>
                      {/* Preview */}
                      <div className="rounded-lg border p-3 space-y-2">
                        <div className="h-8 rounded-md flex items-center justify-center text-white text-xs font-medium" style={{ backgroundColor: minisite.primaryColor }}>
                          Buton principal
                        </div>
                        <div className="h-6 rounded flex items-center px-2 text-xs font-medium" style={{ backgroundColor: `${minisite.primaryColor}15`, color: minisite.primaryColor }}>
                          Text evidentieat
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="flex items-center gap-2">
                        <Pipette className="h-4 w-4" />
                        Culoare accent
                      </Label>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <input
                            type="color"
                            value={minisite.accentColor}
                            onChange={(e) => setMinisite({ ...minisite, accentColor: e.target.value })}
                            className="h-12 w-12 cursor-pointer rounded-lg border-2 border-gray-200 p-0.5"
                          />
                        </div>
                        <div className="flex-1">
                          <Input
                            value={minisite.accentColor}
                            onChange={(e) => setMinisite({ ...minisite, accentColor: e.target.value })}
                            placeholder="#f59e0b"
                            className="font-mono text-sm"
                          />
                        </div>
                      </div>
                      {/* Preview */}
                      <div className="rounded-lg border p-3 space-y-2">
                        <div className="h-8 rounded-md flex items-center justify-center text-white text-xs font-medium" style={{ backgroundColor: minisite.accentColor }}>
                          Buton doneaza
                        </div>
                        <div className="h-6 rounded flex items-center px-2 text-xs font-medium" style={{ backgroundColor: `${minisite.accentColor}15`, color: minisite.accentColor }}>
                          Suma evidentiata
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Live preview bar */}
                  <div className="rounded-xl overflow-hidden border">
                    <div className="p-4 text-white text-center" style={{ backgroundColor: minisite.primaryColor }}>
                      <p className="text-sm font-bold mb-2">Previzualizare header</p>
                      <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold" style={{ backgroundColor: minisite.accentColor }}>
                        Doneaza acum
                      </div>
                    </div>
                  </div>

                  {ngoSlug && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                      <ExternalLink className="h-4 w-4" />
                      <span>Previzualizare completa:</span>
                      <a href={`/s/${ngoSlug}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-medium">
                        /s/{ngoSlug}
                      </a>
                    </div>
                  )}
                </>
              )}
            </CardContent>
            <CardFooter className="border-t pt-6">
              <Button onClick={handleSaveMinisite} disabled={saving || minisiteLoading}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Salveaza culorile
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Membri echipa
                  </CardTitle>
                  <CardDescription>
                    Gestioneaza cine are acces la panoul de control CRM.
                  </CardDescription>
                </div>
                <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Invita utilizator
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invita membru in echipa</DialogTitle>
                      <DialogDescription>
                        Trimite un email de invitatie pentru a adauga un nou membru in echipa.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="inviteEmail">Adresa email</Label>
                        <Input
                          id="inviteEmail"
                          type="email"
                          placeholder="colleague@example.com"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Rol</Label>
                        <Select value={inviteRole} onValueChange={setInviteRole}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLE_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          {inviteRole === "ADMIN" && "Acces complet la toate setarile si datele."}
                          {inviteRole === "MANAGER" && "Poate gestiona campanii, donatori si automatizari."}
                          {inviteRole === "MEMBER" && "Poate crea si edita campanii si gestiona donatori."}
                          {inviteRole === "VIEWER" && "Acces doar pentru citire la panouri si rapoarte."}
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setInviteOpen(false)}>
                        Anuleaza
                      </Button>
                      <Button onClick={handleInvite} disabled={inviteLoading || !inviteEmail.trim()}>
                        {inviteLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Mail className="mr-2 h-4 w-4" />
                        )}
                        Trimite invitatia
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {teamLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : team.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Niciun membru in echipa inca.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-3 text-left font-medium">Nume</th>
                        <th className="p-3 text-left font-medium">Email</th>
                        <th className="p-3 text-left font-medium">Rol</th>
                        <th className="p-3 text-left font-medium hidden md:table-cell">Status</th>
                        <th className="p-3 text-right font-medium">Actiuni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {team.map((member) => (
                        <tr key={member.id} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-medium">{member.name || "In asteptare"}</td>
                          <td className="p-3 text-muted-foreground">{member.email}</td>
                          <td className="p-3">
                            <Badge variant={roleBadgeVariant(member.role)}>
                              {member.role}
                            </Badge>
                          </td>
                          <td className="p-3 hidden md:table-cell">
                            <Badge variant={member.status === "ACTIVE" ? "success" : "warning"}>
                              {member.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleRemoveMember(member.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Tab */}
        <TabsContent value="payment">
          <div className="space-y-6">
            {/* Stripe Connect Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Stripe Connect - Plati cu cardul
                </CardTitle>
                <CardDescription>
                  Primeste donatii direct pe cardul organizatiei prin Stripe.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {paymentLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Setup Guide - show when not connected */}
                    {!payment.stripeConnectId && (
                      <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                        <div className="flex items-start gap-2 mb-3">
                          <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                          <h4 className="font-semibold text-blue-900 text-sm">Cum activezi platile cu cardul prin Stripe</h4>
                        </div>
                        <ol className="text-sm text-blue-800 space-y-1.5 ml-6 list-decimal">
                          <li>Apasa butonul &quot;Activeaza plati cu cardul&quot; de mai jos</li>
                          <li>Vei fi redirectionat catre Stripe pentru a crea un cont (sau te vei conecta la unul existent)</li>
                          <li>Completeaza datele organizatiei: denumire, adresa, CUI/CIF</li>
                          <li>Adauga un cont bancar (IBAN) pentru a primi transferurile de fonduri</li>
                          <li>Verifica identitatea reprezentantului legal (buletin/pasaport)</li>
                          <li>Dupa aprobare, platile cu cardul vor fi active automat pe mini-site</li>
                        </ol>
                        <p className="text-xs text-blue-600 mt-3">
                          Procesul dureaza 5-10 minute. Stripe percepe un comision de ~2.9% + 0.25 EUR per tranzactie.
                        </p>
                      </div>
                    )}

                    {/* Status Display */}
                    <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/30">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">Status cont Stripe</h3>
                          {payment.stripeConnectStatus === "active" ? (
                            <Badge className="bg-green-600 text-white">Activ</Badge>
                          ) : payment.stripeConnectStatus === "restricted" ? (
                            <Badge variant="destructive">Restrictionat</Badge>
                          ) : payment.stripeConnectId ? (
                            <Badge variant="secondary">In curs</Badge>
                          ) : (
                            <Badge variant="outline">Neconectat</Badge>
                          )}
                        </div>
                        {payment.stripeConnectId ? (
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p>Plati card: {payment.stripeChargesEnabled ? "Activate" : "Dezactivate"}</p>
                            <p>Transfer fonduri: {payment.stripePayoutsEnabled ? "Activat" : "Dezactivat"}</p>
                            {payment.stripeLastSyncAt && (
                              <p>Ultima sincronizare: {new Date(payment.stripeLastSyncAt).toLocaleDateString("ro-RO", { hour: "2-digit", minute: "2-digit" })}</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Conecteaza contul Stripe pentru a primi donatii online cu cardul.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Stripe Connect Actions */}
                    <div className="flex gap-3">
                      {!payment.stripeConnectId || payment.stripeConnectStatus !== "active" ? (
                        <Button onClick={handleStartOnboarding} disabled={connectLoading}>
                          {connectLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <CreditCard className="mr-2 h-4 w-4" />
                          )}
                          {payment.stripeConnectId ? "Continua configurarea Stripe" : "Activeaza plati cu cardul"}
                        </Button>
                      ) : (
                        <Button variant="outline" onClick={handleStripeDashboard} disabled={connectLoading}>
                          {connectLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <ArrowUpRight className="mr-2 h-4 w-4" />
                          )}
                          Dashboard Stripe
                        </Button>
                      )}
                    </div>

                    {payment.stripeConnectStatus === "restricted" && (
                      <div className="flex items-start gap-2 p-3 rounded-md bg-yellow-50 border border-yellow-200 text-sm text-yellow-800">
                        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                        <p>Contul tau Stripe necesita informatii suplimentare. Apasa pe butonul de mai sus pentru a completa procesul.</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* PayPal Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  PayPal
                </CardTitle>
                <CardDescription>
                  Adauga adresa de email PayPal pentru a primi donatii. Donatorii vor fi redirectionati catre PayPal pentru a finaliza plata.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {paymentLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    {/* PayPal Setup Guide */}
                    {!payment.paypalEmail && !payment.paypalClientId && (
                      <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                        <div className="flex items-start gap-2 mb-3">
                          <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                          <h4 className="font-semibold text-blue-900 text-sm">Cum activezi PayPal pentru donatii</h4>
                        </div>
                        <ol className="text-sm text-blue-800 space-y-1.5 ml-6 list-decimal">
                          <li>Creeaza un cont PayPal Business la <span className="font-medium">paypal.com/business</span></li>
                          <li>Completeaza datele organizatiei (denumire, adresa, CUI)</li>
                          <li>Adauga un cont bancar sau card pentru retragerea fondurilor</li>
                          <li>Verifica adresa de email si identitatea organizatiei</li>
                          <li>Copiaza adresa de email PayPal si adaug-o mai jos</li>
                        </ol>
                        <p className="text-xs text-blue-600 mt-3">
                          PayPal percepe un comision de ~3.4% + 0.35 EUR per tranzactie pentru organizatii non-profit.
                        </p>
                      </div>
                    )}

                    {/* PayPal Status */}
                    <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/30">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">Status PayPal</h3>
                          {payment.paypalEnabled && (payment.paypalEmail || payment.paypalClientId) ? (
                            <Badge className="bg-green-600 text-white">Activ</Badge>
                          ) : (payment.paypalEmail || payment.paypalClientId) ? (
                            <Badge variant="secondary">Configurat (dezactivat)</Badge>
                          ) : (
                            <Badge variant="outline">Neconfigurat</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {payment.paypalEmail
                            ? `Email PayPal: ${payment.paypalEmail}`
                            : "Adauga adresa de email PayPal a organizatiei pentru a primi donatii."}
                        </p>
                      </div>
                    </div>

                    {/* Enable/Disable Toggle */}
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setPayment({ ...payment, paypalEnabled: !payment.paypalEnabled })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          payment.paypalEnabled ? "bg-green-600" : "bg-gray-200"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            payment.paypalEnabled ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                      <Label className="text-sm">
                        {payment.paypalEnabled ? "PayPal activat" : "PayPal dezactivat"}
                      </Label>
                    </div>

                    {/* PayPal Email - Simple setup */}
                    <div className="grid gap-2">
                      <Label htmlFor="paypalEmail">Adresa email PayPal</Label>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                        <Input
                          id="paypalEmail"
                          type="email"
                          placeholder="paypal@organizatia-ta.ro"
                          value={payment.paypalEmail}
                          onChange={(e) => setPayment({ ...payment, paypalEmail: e.target.value })}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Adresa de email asociata contului PayPal al organizatiei. Donatorii vor fi redirectionati catre PayPal pentru a trimite bani la aceasta adresa.
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Bank Transfer Section - Multiple IBANs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Banknote className="h-5 w-5" />
                  Transfer bancar (IBAN)
                </CardTitle>
                <CardDescription>
                  Adauga unul sau mai multe conturi IBAN in diferite valute (RON, EUR, USD, GBP etc.) pentru a primi donatii prin transfer bancar.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {paymentLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    {/* IBAN Setup Guide */}
                    {ibanAccounts.length <= 1 && !ibanAccounts[0]?.iban && (
                      <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                        <div className="flex items-start gap-2 mb-3">
                          <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                          <h4 className="font-semibold text-blue-900 text-sm">Adauga conturile bancare ale organizatiei</h4>
                        </div>
                        <p className="text-sm text-blue-800 mb-2">
                          Poti adauga mai multe conturi IBAN in diferite valute. Donatorii vor vedea optiunile disponibile pe pagina de donatie.
                        </p>
                        <ul className="text-sm text-blue-800 space-y-1 ml-5 list-disc">
                          <li><strong>RON</strong> - pentru donatii in lei romanesti</li>
                          <li><strong>EUR</strong> - pentru donatii din zona euro</li>
                          <li><strong>USD</strong> - pentru donatii din SUA sau in dolari</li>
                          <li><strong>GBP</strong> - pentru donatii din Marea Britanie</li>
                        </ul>
                      </div>
                    )}

                    {/* Multiple IBAN entries */}
                    {ibanAccounts.map((account, index) => (
                      <div key={index} className="p-4 border rounded-lg space-y-3 bg-muted/10">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-semibold">Cont bancar #{index + 1}</Label>
                          {ibanAccounts.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 h-7 px-2"
                              onClick={() => {
                                const updated = ibanAccounts.filter((_, i) => i !== index);
                                setIbanAccounts(updated);
                              }}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Sterge
                            </Button>
                          )}
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="grid gap-1.5">
                            <Label className="text-xs">Valuta</Label>
                            <Select
                              value={account.currency}
                              onValueChange={(val) => {
                                const updated = [...ibanAccounts];
                                updated[index] = { ...updated[index], currency: val };
                                setIbanAccounts(updated);
                              }}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="RON">RON (Lei)</SelectItem>
                                <SelectItem value="EUR">EUR (Euro)</SelectItem>
                                <SelectItem value="USD">USD (Dolari)</SelectItem>
                                <SelectItem value="GBP">GBP (Lire)</SelectItem>
                                <SelectItem value="CHF">CHF (Franci)</SelectItem>
                                <SelectItem value="HUF">HUF (Forint)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-1.5 sm:col-span-2">
                            <Label className="text-xs">IBAN</Label>
                            <Input
                              placeholder={account.currency === "RON" ? "RO49 AAAA 1B31 0075 9384 0000" : "IBAN..."}
                              value={account.iban}
                              onChange={(e) => {
                                const updated = [...ibanAccounts];
                                updated[index] = { ...updated[index], iban: e.target.value };
                                setIbanAccounts(updated);
                              }}
                              className="h-9"
                            />
                          </div>
                        </div>
                        <div className="grid gap-1.5">
                          <Label className="text-xs">Numele bancii</Label>
                          <Input
                            placeholder="Ex: Banca Transilvania, ING, BRD, Raiffeisen..."
                            value={account.bankName}
                            onChange={(e) => {
                              const updated = [...ibanAccounts];
                              updated[index] = { ...updated[index], bankName: e.target.value };
                              setIbanAccounts(updated);
                            }}
                            className="h-9"
                          />
                        </div>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIbanAccounts([...ibanAccounts, { currency: "EUR", iban: "", bankName: "" }])}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Adauga alt IBAN
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Revolut Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Revolut
                </CardTitle>
                <CardDescription>
                  Adauga detaliile Revolut pentru a primi donatii rapide.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {paymentLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    {/* Revolut Setup Guide */}
                    {!payment.revolutTag && !payment.revolutLink && (
                      <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                        <div className="flex items-start gap-2 mb-3">
                          <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                          <h4 className="font-semibold text-blue-900 text-sm">Cum activezi Revolut pentru donatii</h4>
                        </div>
                        <ol className="text-sm text-blue-800 space-y-1.5 ml-6 list-decimal">
                          <li>Descarca aplicatia Revolut si creeaza un cont Business (sau personal)</li>
                          <li>Completeaza verificarea de identitate (KYC)</li>
                          <li>Activeaza-ti un @tag Revolut din setarile aplicatiei</li>
                          <li>Optional: genereaza un link revolut.me pentru plati rapide</li>
                          <li>Adauga detaliile mai jos - donatorii vor putea trimite bani instant</li>
                        </ol>
                        <p className="text-xs text-blue-600 mt-3">
                          Revolut nu percepe comisioane pentru transferuri intre conturi Revolut. Transferurile externe pot avea comisioane minime.
                        </p>
                      </div>
                    )}

                    <div className="grid gap-2">
                      <Label htmlFor="revolutTag">Revolut @tag</Label>
                      <Input
                        id="revolutTag"
                        placeholder="@organizatia-ta"
                        value={payment.revolutTag}
                        onChange={(e) => setPayment({ ...payment, revolutTag: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="revolutPhone">Numar telefon Revolut (optional)</Label>
                      <Input
                        id="revolutPhone"
                        placeholder="+40 7xx xxx xxx"
                        value={payment.revolutPhone}
                        onChange={(e) => setPayment({ ...payment, revolutPhone: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="revolutLink">Link Revolut.me (optional)</Label>
                      <Input
                        id="revolutLink"
                        placeholder="https://revolut.me/organizatia-ta"
                        value={payment.revolutLink}
                        onChange={(e) => setPayment({ ...payment, revolutLink: e.target.value })}
                      />
                    </div>
                  </>
                )}
              </CardContent>
              <CardFooter className="border-t pt-6">
                <Button onClick={handleSavePayment} disabled={saving || paymentLoading}>
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Salveaza setarile de plata
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Abonamentul tau
                </CardTitle>
                <CardDescription>
                  Gestioneaza planul de abonament al organizatiei tale.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {subLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/30">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold">Plan {subscription.plan}</h3>
                          <Badge variant={subscription.status === "active" ? "success" : "warning"}>
                            {subscription.status === "active" ? "Activ" : subscription.status}
                          </Badge>
                        </div>
                        {subscription.expiresAt && (
                          <p className="text-sm text-muted-foreground">
                            Expira: {new Date(subscription.expiresAt).toLocaleDateString("ro-RO")}
                          </p>
                        )}
                        {subscription.currentPeriodEnd && (
                          <p className="text-sm text-muted-foreground">
                            Perioada curenta pana la: {new Date(subscription.currentPeriodEnd).toLocaleDateString("ro-RO")}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        {
                          name: "BASIC",
                          price: "Gratuit",
                          features: ["100 donatori", "1.000 email-uri/luna", "1 utilizator", "Mini-site de baza"],
                        },
                        {
                          name: "PRO",
                          price: "149 RON/luna",
                          features: ["5.000 donatori", "10.000 email-uri/luna", "5 utilizatori", "Automatizari", "AI asistent", "SMS campanii"],
                        },
                        {
                          name: "ELITE",
                          price: "399 RON/luna",
                          features: ["Donatori nelimitati", "Email-uri nelimitate", "Utilizatori nelimitati", "Toate functiile", "Suport prioritar", "API access"],
                        },
                      ].map((p) => (
                        <div
                          key={p.name}
                          className={`p-4 border rounded-lg ${subscription.plan === p.name ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-muted-foreground/30"} transition`}
                        >
                          <h4 className="font-semibold text-lg">{p.name}</h4>
                          <p className="text-xl font-bold mt-1 mb-3">{p.price}</p>
                          <ul className="space-y-1.5 text-sm text-muted-foreground mb-4">
                            {p.features.map((f) => (
                              <li key={f} className="flex items-center gap-1.5">
                                <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                                {f}
                              </li>
                            ))}
                          </ul>
                          {subscription.plan === p.name ? (
                            <Badge className="w-full justify-center py-1">Plan curent</Badge>
                          ) : (PLAN_ORDER[p.name] ?? 0) > (PLAN_ORDER[subscription.plan] ?? 0) ? (
                            <Button
                              size="sm"
                              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700"
                              onClick={() => handleChangePlan(p.name)}
                              disabled={saving}
                            >
                              <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                              Upgrade la {p.name}
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => handleChangePlan(p.name)}
                              disabled={saving}
                            >
                              Downgrade la {p.name}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <PageHelp items={[
        { title: "Profil ONG", description: "Seteaza numele, logo-ul, descrierea si website-ul organizatiei tale." },
        { title: "Culori", description: "Personalizeaza culorile mini-site-ului organizatiei tale." },
        { title: "Plati", description: "Configureaza Stripe Connect, PayPal, transfer bancar si Revolut pentru a primi donatii." },
        { title: "Abonament", description: "Gestioneaza planul de abonament al organizatiei tale." },
        { title: "Echipa", description: "Invita membrii echipei cu roluri: ADMIN (acces total), MANAGER, MEMBER, VIEWER (doar citire)." },
      ]} />
    </div>
  );
}
