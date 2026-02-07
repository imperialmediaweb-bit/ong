"use client";

import { useState, useEffect, useCallback } from "react";
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
  twilioSid: string;
  twilioAuthToken: string;
  twilioPhoneNumber: string;
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
    twilioSid: "",
    twilioAuthToken: "",
    twilioPhoneNumber: "",
    smsSenderId: "",
  });
  const [smsLoading, setSmsLoading] = useState(true);
  const [showTwilioSid, setShowTwilioSid] = useState(false);
  const [showTwilioToken, setShowTwilioToken] = useState(false);
  const [editingTwilio, setEditingTwilio] = useState(false);
  const [newTwilioSid, setNewTwilioSid] = useState("");
  const [newTwilioToken, setNewTwilioToken] = useState("");

  // Team
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");
  const [inviteLoading, setInviteLoading] = useState(false);

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
        twilioSid: data.twilioSid || "",
        twilioAuthToken: data.twilioAuthToken || "",
        twilioPhoneNumber: data.twilioPhoneNumber || "",
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
    }
  }, [activeTab, fetchProfile, fetchEmail, fetchSms, fetchTeam]);

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
        smsSenderId: sms.smsSenderId,
      };
      if (editingTwilio) {
        if (newTwilioSid) payload.twilioSid = newTwilioSid;
        if (newTwilioToken) payload.twilioAuthToken = newTwilioToken;
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="gap-1">
            <Building className="h-3 w-3" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-1">
            <Mail className="h-3 w-3" />
            Furnizor email
          </TabsTrigger>
          <TabsTrigger value="sms" className="gap-1">
            <MessageSquare className="h-3 w-3" />
            Furnizor SMS
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-1">
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
                    <Label htmlFor="logoUrl">URL Logo</Label>
                    <div className="flex gap-3">
                      <Input
                        id="logoUrl"
                        placeholder="https://example.com/logo.png"
                        value={profile.logoUrl}
                        onChange={(e) => setProfile({ ...profile, logoUrl: e.target.value })}
                        className="flex-1"
                      />
                      {profile.logoUrl && (
                        <div className="flex h-10 w-10 items-center justify-center rounded border bg-muted shrink-0 overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={profile.logoUrl}
                            alt="Previzualizare logo"
                            className="h-full w-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        </div>
                      )}
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
                Configurare Twilio
              </CardTitle>
              <CardDescription>
                Configureaza integrarea Twilio pentru trimiterea campaniilor SMS.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {smsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {!editingTwilio ? (
                    <div className="space-y-3">
                      <div className="grid gap-2">
                        <Label>Twilio Account SID</Label>
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
                      <Button variant="outline" onClick={() => setEditingTwilio(true)}>
                        Actualizeaza credentialele
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
                      <div className="grid gap-2">
                        <Label>Noul Twilio Account SID</Label>
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
      </Tabs>
    </div>
  );
}
