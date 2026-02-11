"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Email sau parola incorecta");
      setLoading(false);
    } else {
      // Fetch session to determine role-based redirect
      try {
        const sessionRes = await fetch("/api/auth/session");
        const session = await sessionRes.json();
        if (session?.user?.role === "SUPER_ADMIN") {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
      } catch {
        router.push("/dashboard");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Heart className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Autentificare Binevo</CardTitle>
          <CardDescription>Introdu datele de acces pentru a accesa panoul de control</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">{error}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@ngo.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Parola</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Se autentifica..." : "Autentificare"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Nu ai cont?{" "}
              <Link href="/register" className="text-primary hover:underline">
                Inregistreaza ONG-ul
              </Link>
            </p>
          </form>

          {/* Demo credentials */}
          <div className="mt-4 pt-4 border-t space-y-3">
            <p className="text-xs text-muted-foreground text-center">Conturi pentru testare:</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  setEmail("admin@demo-ngo.org");
                  setPassword("password123");
                }}
              >
                ONG Admin
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs border-purple-200 text-purple-700 hover:bg-purple-50"
                onClick={() => {
                  setEmail("superadmin@binevo.ro");
                  setPassword("password123");
                }}
              >
                Super Admin
              </Button>
            </div>
            <div className="text-[10px] text-muted-foreground text-center space-y-0.5">
              <p>ONG: admin@demo-ngo.org / password123</p>
              <p>Super Admin: superadmin@binevo.ro / password123</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
