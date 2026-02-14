"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  FileText, Plus, Pencil, Trash2, Save, X, Mail, MessageSquare,
  Loader2, CheckCircle2, XCircle, Eye,
} from "lucide-react";

interface EmailTemplate {
  id: string;
  name: string;
  category: string;
  subject: string;
  htmlBody: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SmsTemplate {
  id: string;
  name: string;
  category: string;
  body: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

const emailCategories = [
  { id: "thank_you", label: "Multumire" },
  { id: "newsletter", label: "Newsletter" },
  { id: "emergency", label: "Urgenta" },
  { id: "reactivation", label: "Reactivare" },
  { id: "event", label: "Eveniment" },
  { id: "impact_report", label: "Raport Impact" },
];

const smsCategories = [
  { id: "thank_you", label: "Multumire" },
  { id: "reminder", label: "Reminder" },
  { id: "emergency", label: "Urgenta" },
  { id: "update", label: "Update" },
  { id: "reactivation", label: "Reactivare" },
];

export default function AdminTemplatesPage() {
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [smsTemplates, setSmsTemplates] = useState<SmsTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"email" | "sms">("email");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formHtmlBody, setFormHtmlBody] = useState("");
  const [formSmsBody, setFormSmsBody] = useState("");

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/templates");
      if (!res.ok) throw new Error("Eroare");
      const data = await res.json();
      setEmailTemplates(data.emailTemplates || []);
      setSmsTemplates(data.smsTemplates || []);
    } catch {
      setError("Eroare la incarcarea template-urilor");
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (type: "success" | "error", msg: string) => {
    if (type === "success") { setSuccess(msg); setError(""); }
    else { setError(msg); setSuccess(""); }
    setTimeout(() => { setSuccess(""); setError(""); }, 5000);
  };

  const resetForm = () => {
    setFormName("");
    setFormCategory("");
    setFormSubject("");
    setFormHtmlBody("");
    setFormSmsBody("");
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (template: EmailTemplate | SmsTemplate) => {
    setShowForm(true);
    setEditingId(template.id);
    setFormName(template.name);
    setFormCategory(template.category);
    if ("subject" in template) {
      setFormSubject(template.subject);
      setFormHtmlBody(template.htmlBody);
    } else {
      setFormSmsBody(template.body);
    }
  };

  const handleSave = async () => {
    if (!formName || !formCategory) {
      showMsg("error", "Numele si categoria sunt obligatorii");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        const res = await fetch(`/api/admin/templates/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: activeTab,
            name: formName,
            category: formCategory,
            ...(activeTab === "email"
              ? { subject: formSubject, htmlBody: formHtmlBody }
              : { body: formSmsBody }),
          }),
        });
        if (!res.ok) throw new Error("Eroare la actualizare");
        showMsg("success", "Template actualizat cu succes!");
      } else {
        const res = await fetch("/api/admin/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: activeTab,
            name: formName,
            category: formCategory,
            ...(activeTab === "email"
              ? { subject: formSubject, htmlBody: formHtmlBody }
              : { body: formSmsBody }),
          }),
        });
        if (!res.ok) throw new Error("Eroare la creare");
        showMsg("success", "Template creat cu succes!");
      }
      resetForm();
      fetchTemplates();
    } catch {
      showMsg("error", "Eroare la salvarea template-ului");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Sigur doriti sa stergeti acest template?")) return;

    try {
      const res = await fetch(`/api/admin/templates/${id}?type=${activeTab}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Eroare la stergere");
      showMsg("success", "Template sters cu succes!");
      fetchTemplates();
    } catch {
      showMsg("error", "Eroare la stergerea template-ului");
    }
  };

  const categories = activeTab === "email" ? emailCategories : smsCategories;
  const categoryLabel = (cat: string) =>
    categories.find((c) => c.id === cat)?.label || cat;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-7 w-7 text-purple-600" />
          <div>
            <h1 className="text-3xl font-bold">Template-uri Email &amp; SMS</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gestioneaza template-urile de sistem pentru campanii si notificari
            </p>
          </div>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Template nou
        </Button>
      </div>

      {/* Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2">
          <XCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
        <button
          onClick={() => { setActiveTab("email"); resetForm(); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "email"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Mail className="h-4 w-4" />
          Email ({emailTemplates.length})
        </button>
        <button
          onClick={() => { setActiveTab("sms"); resetForm(); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "sms"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          SMS ({smsTemplates.length})
        </button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <Card className="border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {editingId ? "Editeaza template" : "Template nou"} ({activeTab === "email" ? "Email" : "SMS"})
              </h2>
              <Button variant="ghost" size="icon" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nume template *</Label>
                  <Input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: Multumire donatie"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Categorie *</Label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Selecteaza...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {activeTab === "email" && (
                <>
                  <div className="space-y-2">
                    <Label>Subject *</Label>
                    <Input
                      value={formSubject}
                      onChange={(e) => setFormSubject(e.target.value)}
                      placeholder="Subiectul emailului - suporta {{donor.name}}, {{ngo.name}}"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Continut HTML *</Label>
                    <textarea
                      value={formHtmlBody}
                      onChange={(e) => setFormHtmlBody(e.target.value)}
                      rows={12}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                      placeholder="<html>...</html>"
                    />
                    <p className="text-xs text-muted-foreground">
                      Variabile disponibile: {"{{donor.name}}"}, {"{{donor.email}}"}, {"{{ngo.name}}"}, {"{{unsubscribe_url}}"}
                    </p>
                  </div>
                </>
              )}

              {activeTab === "sms" && (
                <div className="space-y-2">
                  <Label>Continut SMS *</Label>
                  <textarea
                    value={formSmsBody}
                    onChange={(e) => setFormSmsBody(e.target.value)}
                    rows={4}
                    maxLength={480}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Mesajul SMS - max 160 caractere per segment"
                  />
                  <div className="flex justify-between">
                    <p className="text-xs text-muted-foreground">
                      Variabile: {"{{donor.name}}"}, {"{{ngo.name}}"}
                    </p>
                    <p className={`text-xs ${formSmsBody.length > 160 ? "text-amber-600" : "text-muted-foreground"}`}>
                      {formSmsBody.length}/160 caractere ({Math.ceil(formSmsBody.length / 160) || 1} segmente)
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetForm}>Anuleaza</Button>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Se salveaza..." : editingId ? "Actualizeaza" : "Creeaza"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Template List */}
      {activeTab === "email" && (
        <div className="space-y-3">
          {emailTemplates.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Niciun template de email creat</p>
                <p className="text-xs mt-1">Apasa &quot;Template nou&quot; pentru a crea primul template</p>
              </CardContent>
            </Card>
          ) : (
            emailTemplates.map((t) => (
              <Card key={t.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Mail className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        <h3 className="font-semibold truncate">{t.name}</h3>
                        <Badge variant="outline" className="text-[10px]">
                          {categoryLabel(t.category)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        Subject: {t.subject}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Actualizat: {new Date(t.updatedAt).toLocaleDateString("ro-RO")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 ml-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setPreviewHtml(previewHtml === t.id ? null : t.id)}
                        title="Previzualizare"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(t)} title="Editeaza">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)} title="Sterge">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  {previewHtml === t.id && (
                    <div className="mt-3 border rounded-lg overflow-hidden">
                      <div className="bg-slate-100 px-3 py-1.5 text-xs text-muted-foreground border-b">
                        Previzualizare HTML
                      </div>
                      <div
                        className="p-4 max-h-96 overflow-auto bg-white"
                        dangerouslySetInnerHTML={{ __html: t.htmlBody }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === "sms" && (
        <div className="space-y-3">
          {smsTemplates.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Niciun template de SMS creat</p>
                <p className="text-xs mt-1">Apasa &quot;Template nou&quot; pentru a crea primul template</p>
              </CardContent>
            </Card>
          ) : (
            smsTemplates.map((t) => (
              <Card key={t.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquare className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <h3 className="font-semibold truncate">{t.name}</h3>
                        <Badge variant="outline" className="text-[10px]">
                          {categoryLabel(t.category)}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">{t.body}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-muted-foreground">
                          {t.body.length} caractere ({Math.ceil(t.body.length / 160)} segmente)
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Actualizat: {new Date(t.updatedAt).toLocaleDateString("ro-RO")}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-4">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(t)} title="Editeaza">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)} title="Sterge">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
