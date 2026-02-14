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
  MessageSquare,
  Users,
  Save,
  Loader2,
  Eye,
  EyeOff,
  Plus,
  Shield,
  CheckCircle2,
  Globe,
  Phone,
  Key,
  UserPlus,
  Trash2,
  CreditCard,
  ExternalLink,
  Palette,
  Wallet,
  Banknote,
  AlertTriangle,
  ArrowUpRight,
  Copy,
  Upload,
  Image as ImageIcon,
  Heart,
  Pipette,
  Check,
} from "lucide-react";

interface ProfileSettings {
  ngoName: string;
  description: string;
  logoUrl: string;
  website: string;
}

interface EmailSettings {
  sendgridApiKey: string;
  senderEmail: string;
  senderName: string;
}

interface SmsSettings {
  activeProvider: string;
  twilioSid: string;
  twilioAuthToken: string;
  twilioPhoneNumber: string;
  telnyxApiKey: string;
  telnyxPhoneNumber: string;
  smsSenderId: string;
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

function maskKey(key: string): string {
  if (!key || key.length < 8) return key ? "****" : "";
  return key.slice(0, 4) + "****" + key.slice(-4);
}

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

  // Email
  const [email, setEmail] = useState<EmailSettings>({
    sendgridApiKey: "",
    senderEmail: "",
    senderName: "",
  });
  const [emailLoading, setEmailLoading] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);
  const [editingApiKey, setEditingApiKey] = useState(false);
  const [newApiKey, setNewApiKey] = useState("");

  // SMS
  const [sms, setSms] = useState<SmsSettings>({
    activeProvider: "twilio",
    twilioSid: "",
    twilioAuthToken: "",
    twilioPhoneNumber: "",
    telnyxApiKey: "",
    telnyxPhoneNumber: "",
    smsSenderId: "",
  });
  const [smsLoading, setSmsLoading] = useState(true);
  const [showTwilioSid, setShowTwilioSid] = useState(false);
  const [showTwilioToken, setShowTwilioToken] = useState(false);
  const [editingTwilio, setEditingTwilio] = useState(false);
  const [newTwilioSid, setNewTwilioSid] = useState("");
  const [newTwilioToken, setNewTwilioToken] = useState("");
  const [editingTelnyx, setEditingTelnyx] = useState(false);
  const [newTelnyxApiKey, setNewTelnyxApiKey] = useState("");

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

  // Fetch email settings
  const fetchEmail = useCallback(async () => {
    setEmailLoading(true);
    try {
      const res = await fetch("/api/settings/email");
      if (!res.ok) throw new Error("Failed to fetch email settings");
      const data = await res.json();
      setEmail({
        sendgridApiKey: data.sendgridApiKey || "",
        senderEmail: data.senderEmail || "",
        senderName: data.senderName || "",
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setEmailLoading(false);
    }
  }, []);

  // Fetch SMS settings
  const fetchSms = useCallback(async () => {
    setSmsLoading(true);
    try {
      const res = await fetch("/api/settings/sms");
      if (!res.ok) throw new Error("Failed to fetch SMS settings");
      const data = await res.json();
      setSms({
        activeProvider: data.activeProvider || "twilio",
        twilioSid: data.twilioSid || "",
        twilioAuthToken: data.twilioAuthToken || "",
        twilioPhoneNumber: data.twilioPhoneNumber || "",
        telnyxApiKey: data.telnyxApiKey || "",
        telnyxPhoneNumber: data.telnyxPhoneNumber || "",
        smsSenderId: data.smsSenderId || "",
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSmsLoading(false);
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
      case "email":
        fetchEmail();
        break;
      case "sms":
        fetchSms();
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
  }, [activeTab, fetchProfile, fetchEmail, fetchSms, fetchTeam, fetchMinisite, fetchSubscription, fetchPayment]);

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

  const handleSaveEmail = async () => {
    clearMessages();
    setSaving(true);
    try {
      const payload: any = {
        senderEmail: email.senderEmail,
        senderName: email.senderName,
      };
      if (editingApiKey && newApiKey) {
        payload.sendgridApiKey = newApiKey;
      }
      const res = await fetch("/api/settings/email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save email settings");
      setSuccess("Setarile email au fost salvate cu succes.");
      setEditingApiKey(false);
      setNewApiKey("");
      fetchEmail();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSms = async () => {
    clearMessages();
    setSaving(true);
    try {
      const payload: any = {
        twilioPhoneNumber: sms.twilioPhoneNumber,
        telnyxPhoneNumber: sms.telnyxPhoneNumber,
        smsSenderId: sms.smsSenderId,
      };
      if (editingTwilio) {
        if (newTwilioSid) payload.twilioSid = newTwilioSid;
        if (newTwilioToken) payload.twilioAuthToken = newTwilioToken;
      }
      if (editingTelnyx) {
        if (newTelnyxApiKey) payload.telnyxApiKey = newTelnyxApiKey;
      }
      const res = await fetch("/api/settings/sms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save SMS settings");
      setSuccess("Setarile SMS au fost salvate cu succes.");
      setEditingTwilio(false);
      setNewTwilioSid("");
      setNewTwilioToken("");
      setEditingTelnyx(false);
      setNewTelnyxApiKey("");
      fetchSms();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
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
      const payload: any = {
        bankName: payment.bankName,
        ibanRon: payment.ibanRon,
        ibanEur: payment.ibanEur,
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

  const handleChangePlan = async (plan: string) => {
    clearMessages();
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
        <TabsList className="grid w-full grid-cols-7 overflow-x-auto">
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
          <TabsTrigger value="email" className="gap-1 text-xs">
            <Mail className="h-3 w-3" />
            Email
          </TabsTrigger>
          <TabsTrigger value="sms" className="gap-1 text-xs">
            <MessageSquare className="h-3 w-3" />
            SMS
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

        {/* Email Provider Tab */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Configurare SendGrid
              </CardTitle>
              <CardDescription>
                Configureaza integrarea SendGrid pentru trimiterea campaniilor email.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {emailLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="grid gap-2">
                    <Label>SendGrid API Key</Label>
                    {!editingApiKey ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 flex items-center gap-2 h-10 rounded-md border bg-muted/50 px-3">
                          <Key className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-mono">
                            {email.sendgridApiKey ? maskKey(email.sendgridApiKey) : "Neconfigurat"}
                          </span>
                        </div>
                        <Button variant="outline" onClick={() => setEditingApiKey(true)}>
                          Schimba cheia
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Input
                          type="password"
                          placeholder="SG.xxxxx..."
                          value={newApiKey}
                          onChange={(e) => setNewApiKey(e.target.value)}
                        />
                        <Button variant="ghost" onClick={() => { setEditingApiKey(false); setNewApiKey(""); }}>
                          Anuleaza
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="senderEmail">Email expeditor</Label>
                    <Input
                      id="senderEmail"
                      type="email"
                      placeholder="noreply@your-ngo.org"
                      value={email.senderEmail}
                      onChange={(e) => setEmail({ ...email, senderEmail: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="senderName">Nume expeditor</Label>
                    <Input
                      id="senderName"
                      placeholder="Numele ONG-ului tau"
                      value={email.senderName}
                      onChange={(e) => setEmail({ ...email, senderName: e.target.value })}
                    />
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="border-t pt-6">
              <Button onClick={handleSaveEmail} disabled={saving || emailLoading}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Salveaza setarile email
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* SMS Provider Tab */}
        <TabsContent value="sms">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Configurare SMS
              </CardTitle>
              <CardDescription>
                Provider activ: <span className="font-semibold uppercase">{sms.activeProvider}</span>
                {" "}(setat prin variabila de mediu SMS_PROVIDER)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {smsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {/* Twilio Section */}
                  <div className={`space-y-3 p-4 border rounded-lg ${sms.activeProvider === "twilio" ? "border-primary bg-primary/5" : "border-muted"}`}>
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Twilio</h4>
                      {sms.activeProvider === "twilio" && (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Activ</span>
                      )}
                    </div>
                    {!editingTwilio ? (
                      <div className="space-y-3">
                        <div className="grid gap-2">
                          <Label>Account SID</Label>
                          <div className="flex items-center gap-2 h-10 rounded-md border bg-muted/50 px-3">
                            <Key className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-mono">
                              {sms.twilioSid ? maskKey(sms.twilioSid) : "Neconfigurat"}
                            </span>
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label>Auth Token</Label>
                          <div className="flex items-center gap-2 h-10 rounded-md border bg-muted/50 px-3">
                            <Key className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-mono">
                              {sms.twilioAuthToken ? maskKey(sms.twilioAuthToken) : "Neconfigurat"}
                            </span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setEditingTwilio(true)}>
                          Actualizeaza credentialele
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3 p-3 border rounded-lg bg-muted/20">
                        <div className="grid gap-2">
                          <Label>Noul Account SID</Label>
                          <Input
                            type="password"
                            placeholder="ACxxxxx..."
                            value={newTwilioSid}
                            onChange={(e) => setNewTwilioSid(e.target.value)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Noul Auth Token</Label>
                          <Input
                            type="password"
                            placeholder="Auth token..."
                            value={newTwilioToken}
                            onChange={(e) => setNewTwilioToken(e.target.value)}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingTwilio(false);
                            setNewTwilioSid("");
                            setNewTwilioToken("");
                          }}
                        >
                          Anuleaza
                        </Button>
                      </div>
                    )}
                    <div className="grid gap-2">
                      <Label htmlFor="twilioPhone">Numar telefon Twilio</Label>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                        <Input
                          id="twilioPhone"
                          placeholder="+1234567890"
                          value={sms.twilioPhoneNumber}
                          onChange={(e) => setSms({ ...sms, twilioPhoneNumber: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Telnyx Section */}
                  <div className={`space-y-3 p-4 border rounded-lg ${sms.activeProvider === "telnyx" ? "border-primary bg-primary/5" : "border-muted"}`}>
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Telnyx</h4>
                      {sms.activeProvider === "telnyx" && (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Activ</span>
                      )}
                    </div>
                    {!editingTelnyx ? (
                      <div className="space-y-3">
                        <div className="grid gap-2">
                          <Label>API Key</Label>
                          <div className="flex items-center gap-2 h-10 rounded-md border bg-muted/50 px-3">
                            <Key className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-mono">
                              {sms.telnyxApiKey ? maskKey(sms.telnyxApiKey) : "Neconfigurat"}
                            </span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setEditingTelnyx(true)}>
                          Actualizeaza API Key
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3 p-3 border rounded-lg bg-muted/20">
                        <div className="grid gap-2">
                          <Label>Noul API Key</Label>
                          <Input
                            type="password"
                            placeholder="KEY..."
                            value={newTelnyxApiKey}
                            onChange={(e) => setNewTelnyxApiKey(e.target.value)}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingTelnyx(false);
                            setNewTelnyxApiKey("");
                          }}
                        >
                          Anuleaza
                        </Button>
                      </div>
                    )}
                    <div className="grid gap-2">
                      <Label htmlFor="telnyxPhone">Numar telefon Telnyx</Label>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                        <Input
                          id="telnyxPhone"
                          placeholder="+1234567890"
                          value={sms.telnyxPhoneNumber}
                          onChange={(e) => setSms({ ...sms, telnyxPhoneNumber: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Common Settings */}
                  <div className="grid gap-2">
                    <Label htmlFor="smsSenderId">ID expeditor SMS</Label>
                    <Input
                      id="smsSenderId"
                      placeholder="YourNGO"
                      value={sms.smsSenderId}
                      onChange={(e) => setSms({ ...sms, smsSenderId: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      ID alfanumeric afisat ca expeditor SMS (maxim 11 caractere).
                    </p>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="border-t pt-6">
              <Button onClick={handleSaveSms} disabled={saving || smsLoading}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Salveaza setarile SMS
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

            {/* Bank Transfer Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Banknote className="h-5 w-5" />
                  Transfer bancar
                </CardTitle>
                <CardDescription>
                  Configureaza datele bancare pentru a primi donatii prin transfer bancar.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {paymentLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="bankName">Numele bancii</Label>
                      <Input
                        id="bankName"
                        placeholder="Ex: Banca Transilvania, ING, BRD..."
                        value={payment.bankName}
                        onChange={(e) => setPayment({ ...payment, bankName: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="ibanRon">IBAN RON</Label>
                      <Input
                        id="ibanRon"
                        placeholder="RO49 AAAA 1B31 0075 9384 0000"
                        value={payment.ibanRon}
                        onChange={(e) => setPayment({ ...payment, ibanRon: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="ibanEur">IBAN EUR (optional)</Label>
                      <Input
                        id="ibanEur"
                        placeholder="RO49 AAAA 1B31 0075 9384 0001"
                        value={payment.ibanEur}
                        onChange={(e) => setPayment({ ...payment, ibanEur: e.target.value })}
                      />
                    </div>
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
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => handleChangePlan(p.name)}
                              disabled={saving}
                            >
                              {subscription.plan === "ELITE" && p.name !== "ELITE"
                                ? "Downgrade"
                                : "Upgrade"}{" "}
                              la {p.name}
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
        { title: "Email (SendGrid)", description: "Configureaza cheia API SendGrid si adresa de expeditor pentru trimiterea emailurilor." },
        { title: "SMS (Twilio/Telnyx)", description: "Alege provider-ul SMS si introdu credentialele pentru trimiterea de SMS-uri." },
        { title: "Echipa", description: "Invita membrii echipei cu roluri: ADMIN (acces total), MANAGER, MEMBER, VIEWER (doar citire)." },
        { title: "API", description: "Genereaza chei API pentru integrari externe si webhook-uri." },
        { title: "Credite", description: "Vezi soldul de credite email si SMS disponibile." },
      ]} />
    </div>
  );
}
