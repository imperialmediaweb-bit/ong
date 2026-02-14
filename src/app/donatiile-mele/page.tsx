"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Heart,
  Loader2,
  Search,
  Building2,
  Calendar,
  TrendingUp,
  ExternalLink,
  Mail,
} from "lucide-react";

interface DonationItem {
  id: string;
  amount: number;
  currency: string;
  createdAt: string;
  campaignName: string | null;
}

interface NgoProfile {
  ngo: {
    name: string;
    slug: string;
    logoUrl: string | null;
  };
  donorName: string | null;
  totalDonated: number;
  donationCount: number;
  lastDonationAt: string | null;
  donations: DonationItem[];
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("ro-RO", { style: "currency", currency }).format(amount);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" });
}

export default function DonatileMelePage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<NgoProfile[] | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!email) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      // Generate token client-side (same logic as API)
      const encoder = new TextEncoder();
      const data = encoder.encode(email + "donor-profile-salt");
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const token = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16);

      const res = await fetch(`/api/donor-profile?email=${encodeURIComponent(email)}&token=${token}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Eroare la cautare");
      }
      const result = await res.json();
      setProfile(result.profile);
    } catch (err: any) {
      setError(err.message);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const totalDonatedAll = profile?.reduce((sum, p) => sum + p.totalDonated, 0) || 0;
  const totalDonationsAll = profile?.reduce((sum, p) => sum + p.donationCount, 0) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100">
            <Heart className="h-8 w-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">Donatiile mele</h1>
          <p className="mt-2 text-gray-500 max-w-lg mx-auto">
            Introdu adresa ta de email pentru a vedea istoricul donatiilor tale catre organizatiile inregistrate pe platforma.
          </p>
        </div>

        {/* Search */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="email@exemplu.ro"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch} disabled={loading || !email}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                Cauta
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4 text-center text-red-600 text-sm">
              {error}
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {profile && profile.length > 0 && (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
              <Card>
                <CardContent className="p-4 text-center">
                  <Building2 className="h-5 w-5 text-indigo-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold">{profile.length}</p>
                  <p className="text-xs text-muted-foreground">Organizatii sustinute</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold">{formatCurrency(totalDonatedAll, "RON")}</p>
                  <p className="text-xs text-muted-foreground">Total donat</p>
                </CardContent>
              </Card>
              <Card className="col-span-2 sm:col-span-1">
                <CardContent className="p-4 text-center">
                  <Heart className="h-5 w-5 text-pink-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold">{totalDonationsAll}</p>
                  <p className="text-xs text-muted-foreground">Donatii totale</p>
                </CardContent>
              </Card>
            </div>

            {/* Per-NGO breakdown */}
            <div className="space-y-6">
              {profile.map((ngoProfile, idx) => (
                <Card key={idx} className="overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-5">
                    <div className="flex items-center gap-3">
                      {ngoProfile.ngo.logoUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={ngoProfile.ngo.logoUrl}
                          alt={ngoProfile.ngo.name}
                          className="h-10 w-10 rounded-lg bg-white/20 object-contain p-1"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
                          <Heart className="h-5 w-5 text-white" />
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-white text-lg">{ngoProfile.ngo.name}</CardTitle>
                        <CardDescription className="text-white/70 text-xs">
                          {ngoProfile.donationCount} donati{ngoProfile.donationCount === 1 ? "e" : "i"} &middot; Total: {formatCurrency(ngoProfile.totalDonated, "RON")}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {ngoProfile.donations.length === 0 ? (
                      <p className="p-5 text-center text-sm text-muted-foreground">Nicio donatie finalizata</p>
                    ) : (
                      <div className="divide-y">
                        {ngoProfile.donations.map((donation) => (
                          <div key={donation.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                                <Heart className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold">
                                  {formatCurrency(donation.amount, donation.currency)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {donation.campaignName || "Donatie directa"}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(donation.createdAt)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {ngoProfile.ngo.slug && (
                      <div className="p-4 border-t bg-gray-50">
                        <a
                          href={`/s/${ngoProfile.ngo.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-indigo-600 hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Viziteaza pagina {ngoProfile.ngo.name}
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {searched && !loading && (!profile || profile.length === 0) && !error && (
          <Card>
            <CardContent className="py-16 text-center">
              <Heart className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-1">Nicio donatie gasita</h3>
              <p className="text-sm text-muted-foreground">
                Nu am gasit donatii asociate cu aceasta adresa de email.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
