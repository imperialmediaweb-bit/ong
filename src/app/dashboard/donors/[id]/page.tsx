"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
import { formatCurrency, formatDate, formatDateTime, getInitials } from "@/lib/utils";
import {
  ArrowLeft,
  Edit2,
  Save,
  X,
  Trash2,
  Download,
  Shield,
  Tag,
  Plus,
  Mail,
  Phone,
  Heart,
  Clock,
  MessageSquare,
  FileText,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface DonorDetail {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  preferredChannel: string;
  emailConsent: boolean;
  smsConsent: boolean;
  privacyConsent: boolean;
  totalDonated: number;
  donationCount: number;
  lastDonationAt: string | null;
  notes: string | null;
  isAnonymized: boolean;
  createdAt: string;
  updatedAt: string;
  tags: { tag: { id: string; name: string; color: string } }[];
  donations: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    source: string | null;
    createdAt: string;
    campaign: { id: string; name: string } | null;
  }[];
  consents: {
    id: string;
    type: string;
    granted: boolean;
    source: string | null;
    createdAt: string;
  }[];
  messageRecipients: {
    id: string;
    channel: string;
    status: string;
    address: string;
    deliveredAt: string | null;
    openedAt: string | null;
    createdAt: string;
    message: { subject: string | null; campaign: { name: string } | null } | null;
  }[];
}

interface AvailableTag {
  id: string;
  name: string;
  color: string;
}

export default function DonorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const donorId = params.id as string;

  const [donor, setDonor] = useState<DonorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [availableTags, setAvailableTags] = useState<AvailableTag[]>([]);

  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    preferredChannel: "EMAIL",
    status: "ACTIVE",
    notes: "",
  });

  const [newNote, setNewNote] = useState("");
  const [addTagDialogOpen, setAddTagDialogOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [gdprDialogOpen, setGdprDialogOpen] = useState(false);
  const [gdprAction, setGdprAction] = useState<"export" | "delete">("export");

  const fetchDonor = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/donors/${donorId}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("Donor not found");
        throw new Error("Failed to fetch donor");
      }
      const data: DonorDetail = await res.json();
      setDonor(data);
      setEditForm({
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        preferredChannel: data.preferredChannel,
        status: data.status,
        notes: data.notes || "",
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [donorId]);

  const fetchTags = useCallback(async () => {
    try {
      const res = await fetch("/api/tags");
      if (res.ok) {
        const data = await res.json();
        setAvailableTags(data.tags || []);
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchDonor();
    fetchTags();
  }, [fetchDonor, fetchTags]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/donors/${donorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error("Failed to update donor");
      await fetchDonor();
      setEditing(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddTag = async (tagId?: string) => {
    try {
      const body = tagId ? { tagId } : { name: newTagName };
      const res = await fetch(`/api/donors/${donorId}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to add tag");
      setAddTagDialogOpen(false);
      setNewTagName("");
      fetchDonor();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    try {
      const res = await fetch(`/api/donors/${donorId}/tags/${tagId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove tag");
      fetchDonor();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGdprAction = async () => {
    try {
      if (gdprAction === "export") {
        const res = await fetch(`/api/donors/${donorId}/export`);
        if (!res.ok) throw new Error("Failed to export data");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `donor-${donorId}-data.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        if (!confirm("This will permanently anonymize this donor's personal data. This cannot be undone. Continue?")) return;
        const res = await fetch(`/api/donors/${donorId}/anonymize`, {
          method: "POST",
        });
        if (!res.ok) throw new Error("Failed to anonymize donor");
        fetchDonor();
      }
      setGdprDialogOpen(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSaveNote = async () => {
    if (!newNote.trim()) return;
    try {
      const updatedNotes = donor?.notes ? `${donor.notes}\n\n---\n[${new Date().toISOString()}]\n${newNote}` : `[${new Date().toISOString()}]\n${newNote}`;
      const res = await fetch(`/api/donors/${donorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: updatedNotes }),
      });
      if (!res.ok) throw new Error("Failed to save note");
      setNewNote("");
      fetchDonor();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !donor) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card className="max-w-md mx-auto">
          <CardContent className="py-10 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold">{error || "Donor not found"}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              The donor you are looking for does not exist or you do not have access.
            </p>
            <Link href="/dashboard/donors">
              <Button className="mt-4">Back to Donors</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const donorTags = donor.tags?.map((t) => t.tag) || [];
  const assignedTagIds = new Set(donorTags.map((t) => t.id));
  const unassignedTags = availableTags.filter((t) => !assignedTagIds.has(t.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary text-lg font-semibold">
              {donor.name ? getInitials(donor.name) : "?"}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {donor.isAnonymized ? "Anonymized Donor" : donor.name || "Unknown Donor"}
              </h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {donor.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {donor.email}
                  </span>
                )}
                {donor.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {donor.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button variant="outline" onClick={() => setEditing(false)}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setEditing(true)}>
                <Edit2 className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Dialog open={gdprDialogOpen} onOpenChange={setGdprDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Shield className="mr-2 h-4 w-4" />
                    GDPR
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>GDPR Actions</DialogTitle>
                    <DialogDescription>
                      Manage this donor&apos;s personal data in compliance with GDPR.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                        gdprAction === "export" ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/30"
                      }`}
                      onClick={() => setGdprAction("export")}
                    >
                      <div className="flex items-center gap-2 font-medium">
                        <Download className="h-4 w-4" />
                        Export Personal Data
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Download all personal data associated with this donor as a JSON file (Art. 20 GDPR).
                      </p>
                    </div>
                    <div
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                        gdprAction === "delete" ? "border-destructive bg-destructive/5" : "border-muted hover:border-muted-foreground/30"
                      }`}
                      onClick={() => setGdprAction("delete")}
                    >
                      <div className="flex items-center gap-2 font-medium text-destructive">
                        <Trash2 className="h-4 w-4" />
                        Delete / Anonymize Data
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Permanently anonymize all personal data. Donation records are preserved with anonymized references (Art. 17 GDPR).
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setGdprDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant={gdprAction === "delete" ? "destructive" : "default"}
                      onClick={handleGdprAction}
                    >
                      {gdprAction === "export" ? "Export Data" : "Anonymize Donor"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      {/* Anonymized Warning */}
      {donor.isAnonymized && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardContent className="py-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">
              This donor&apos;s personal data has been anonymized per GDPR request.
            </span>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Profile Info */}
        <div className="space-y-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {editing ? (
                <>
                  <div className="grid gap-2">
                    <Label>Name</Label>
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Email</Label>
                    <Input
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Phone</Label>
                    <Input
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Preferred Channel</Label>
                    <Select
                      value={editForm.preferredChannel}
                      onValueChange={(v) => setEditForm({ ...editForm, preferredChannel: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EMAIL">Email</SelectItem>
                        <SelectItem value="SMS">SMS</SelectItem>
                        <SelectItem value="BOTH">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Status</Label>
                    <Select
                      value={editForm.status}
                      onValueChange={(v) => setEditForm({ ...editForm, status: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                        <SelectItem value="UNSUBSCRIBED">Unsubscribed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge
                      variant={
                        donor.status === "ACTIVE"
                          ? "success"
                          : donor.status === "INACTIVE"
                          ? "warning"
                          : "destructive"
                      }
                    >
                      {donor.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Channel</span>
                    <span className="text-sm font-medium">{donor.preferredChannel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Donated</span>
                    <span className="text-sm font-semibold text-green-600">
                      {formatCurrency(donor.totalDonated)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Donations</span>
                    <span className="text-sm font-medium">{donor.donationCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Last Donation</span>
                    <span className="text-sm">
                      {donor.lastDonationAt ? formatDate(donor.lastDonationAt) : "Never"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Joined</span>
                    <span className="text-sm">{formatDate(donor.createdAt)}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Tags Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base">Tags</CardTitle>
              <Dialog open={addTagDialogOpen} onOpenChange={setAddTagDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Plus className="mr-1 h-3 w-3" />
                    Add
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Add Tag</DialogTitle>
                    <DialogDescription>Select an existing tag or create a new one.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {unassignedTags.length > 0 && (
                      <div>
                        <Label className="text-xs mb-2 block">Existing Tags</Label>
                        <div className="flex flex-wrap gap-2">
                          {unassignedTags.map((tag) => (
                            <Badge
                              key={tag.id}
                              variant="outline"
                              className="cursor-pointer hover:bg-accent"
                              style={{ borderColor: tag.color, color: tag.color }}
                              onClick={() => handleAddTag(tag.id)}
                            >
                              <Plus className="mr-1 h-3 w-3" />
                              {tag.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="grid gap-2">
                      <Label className="text-xs">Create New Tag</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Tag name"
                          value={newTagName}
                          onChange={(e) => setNewTagName(e.target.value)}
                        />
                        <Button onClick={() => handleAddTag()} disabled={!newTagName.trim()}>
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {donorTags.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tags assigned.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {donorTags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="outline"
                      className="pr-1"
                      style={{ borderColor: tag.color, color: tag.color }}
                    >
                      {tag.name}
                      <button
                        onClick={() => handleRemoveTag(tag.id)}
                        className="ml-1 rounded-full hover:bg-muted p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Consent Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Consent Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Email Marketing</span>
                {donor.emailConsent ? (
                  <Badge variant="success">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Granted
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="mr-1 h-3 w-3" />
                    Not Granted
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">SMS Marketing</span>
                {donor.smsConsent ? (
                  <Badge variant="success">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Granted
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="mr-1 h-3 w-3" />
                    Not Granted
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Privacy Policy</span>
                {donor.privacyConsent ? (
                  <Badge variant="success">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Accepted
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="mr-1 h-3 w-3" />
                    Not Accepted
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="donations" className="space-y-4">
            <TabsList>
              <TabsTrigger value="donations" className="gap-1">
                <Heart className="h-3 w-3" />
                Donations
              </TabsTrigger>
              <TabsTrigger value="messages" className="gap-1">
                <MessageSquare className="h-3 w-3" />
                Messages
              </TabsTrigger>
              <TabsTrigger value="consent" className="gap-1">
                <Shield className="h-3 w-3" />
                Consent History
              </TabsTrigger>
              <TabsTrigger value="notes" className="gap-1">
                <FileText className="h-3 w-3" />
                Notes
              </TabsTrigger>
            </TabsList>

            {/* Donations Tab */}
            <TabsContent value="donations">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Donation History</CardTitle>
                  <CardDescription>All donations from this donor</CardDescription>
                </CardHeader>
                <CardContent>
                  {donor.donations.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No donations recorded yet.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {donor.donations.map((donation) => (
                        <div
                          key={donation.id}
                          className="flex items-center justify-between py-2 border-b last:border-0"
                        >
                          <div>
                            <p className="text-sm font-medium">
                              {formatCurrency(donation.amount, donation.currency)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {donation.campaign?.name || "Direct donation"} &middot;{" "}
                              {formatDateTime(donation.createdAt)}
                            </p>
                          </div>
                          <Badge
                            variant={
                              donation.status === "COMPLETED"
                                ? "success"
                                : donation.status === "PENDING"
                                ? "warning"
                                : "destructive"
                            }
                          >
                            {donation.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Messages Tab */}
            <TabsContent value="messages">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Communication History</CardTitle>
                  <CardDescription>Messages sent to this donor</CardDescription>
                </CardHeader>
                <CardContent>
                  {donor.messageRecipients.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No messages sent yet.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {donor.messageRecipients.map((mr) => (
                        <div
                          key={mr.id}
                          className="flex items-center justify-between py-2 border-b last:border-0"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded ${mr.channel === "EMAIL" ? "bg-blue-50" : "bg-green-50"}`}>
                              {mr.channel === "EMAIL" ? (
                                <Mail className="h-3 w-3 text-blue-600" />
                              ) : (
                                <MessageSquare className="h-3 w-3 text-green-600" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                {mr.message?.subject || mr.message?.campaign?.name || "Message"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDateTime(mr.createdAt)}
                                {mr.openedAt && " - Opened"}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant={
                              mr.status === "DELIVERED" || mr.status === "OPENED" || mr.status === "CLICKED"
                                ? "success"
                                : mr.status === "BOUNCED" || mr.status === "FAILED"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {mr.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Consent History Tab */}
            <TabsContent value="consent">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Consent History</CardTitle>
                  <CardDescription>Full audit trail of consent changes</CardDescription>
                </CardHeader>
                <CardContent>
                  {donor.consents.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No consent records found.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {donor.consents.map((consent) => (
                        <div
                          key={consent.id}
                          className="flex items-center justify-between py-2 border-b last:border-0"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded ${consent.granted ? "bg-green-50" : "bg-red-50"}`}>
                              {consent.granted ? (
                                <CheckCircle2 className="h-3 w-3 text-green-600" />
                              ) : (
                                <XCircle className="h-3 w-3 text-red-600" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                {consent.type.replace(/_/g, " ")}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {consent.source && `Via ${consent.source} - `}
                                {formatDateTime(consent.createdAt)}
                              </p>
                            </div>
                          </div>
                          <Badge variant={consent.granted ? "success" : "destructive"}>
                            {consent.granted ? "Granted" : "Revoked"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent value="notes">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Notes</CardTitle>
                  <CardDescription>Internal notes about this donor</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Add a note..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>
                  <Button onClick={handleSaveNote} disabled={!newNote.trim()} size="sm">
                    <Plus className="mr-1 h-3 w-3" />
                    Add Note
                  </Button>
                  {donor.notes ? (
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                      <pre className="text-sm whitespace-pre-wrap font-sans">{donor.notes}</pre>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No notes yet.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
