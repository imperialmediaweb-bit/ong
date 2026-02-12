"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BinevoLogo } from "@/components/BinevoLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", ngoName: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Inregistrarea a esuat");
        setLoading(false);
        return;
      }

      router.push("/login?registered=true");
    } catch {
      setError("Ceva nu a functionat corect");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <BinevoLogo size="lg" />
          </div>
          <CardTitle>Inregistreaza ONG-ul</CardTitle>
          <CardDescription>Creeaza un cont pentru a gestiona donatorii si campaniile</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">{error}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="ngoName">Numele ONG-ului</Label>
              <Input
                id="ngoName"
                placeholder="ONG-ul tau"
                value={form.ngoName}
                onChange={(e) => setForm({ ...form, ngoName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Numele tau</Label>
              <Input
                id="name"
                placeholder="Ion Popescu"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@ngo.org"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Parola</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minim 8 caractere"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={8}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Se creeaza contul..." : "Creeaza cont"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Ai deja cont?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Autentificare
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
