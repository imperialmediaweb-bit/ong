"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Search, Plus, Pencil, Power, Users } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  ngoName: string | null;
  ngoId: string | null;
  lastLogin: string | null;
  isActive: boolean;
}

interface Ngo {
  id: string;
  name: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [ngos, setNgos] = useState<Ngo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Add user dialog
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("STAFF");
  const [newNgoId, setNewNgoId] = useState("");

  // Edit dialog
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editUserId, setEditUserId] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editNgoId, setEditNgoId] = useState("");

  useEffect(() => {
    fetchUsers();
    fetchNgos();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNgos = async () => {
    try {
      const res = await fetch("/api/admin/ngos?limit=100");
      const data = await res.json();
      setNgos(data.ngos || []);
    } catch (err) {
      console.error(err);
    }
  };

  const showSuccessMsg = (msg: string) => {
    setSuccessMsg(msg);
    setErrorMsg("");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const showErrorMsg = (msg: string) => {
    setErrorMsg(msg);
    setSuccessMsg("");
  };

  const handleSearch = () => {
    fetchUsers();
  };

  const handleAddUser = async () => {
    if (!newName || !newEmail || !newPassword) {
      showErrorMsg("Completati toate campurile obligatorii");
      return;
    }
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          password: newPassword,
          role: newRole,
          ngoId: newNgoId || null,
        }),
      });
      if (!res.ok) throw new Error("Eroare la creare");
      showSuccessMsg("Utilizatorul a fost creat cu succes");
      setShowAddDialog(false);
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewRole("STAFF");
      setNewNgoId("");
      fetchUsers();
    } catch (err) {
      showErrorMsg("Eroare la crearea utilizatorului");
    }
  };

  const handleEditUser = async () => {
    try {
      const res = await fetch(`/api/admin/users/${editUserId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: editRole,
          ngoId: editNgoId || null,
        }),
      });
      if (!res.ok) throw new Error("Eroare la editare");
      showSuccessMsg("Utilizatorul a fost actualizat");
      setShowEditDialog(false);
      fetchUsers();
    } catch (err) {
      showErrorMsg("Eroare la actualizarea utilizatorului");
    }
  };

  const handleToggleStatus = async (userId: string, currentActive: boolean) => {
    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      showSuccessMsg(currentActive ? "Utilizator dezactivat" : "Utilizator activat");
      fetchUsers();
    } catch (err) {
      showErrorMsg("Eroare la schimbarea statusului");
    }
  };

  const openEditDialog = (user: User) => {
    setEditUserId(user.id);
    setEditRole(user.role);
    setEditNgoId(user.ngoId || "");
    setShowEditDialog(true);
  };

  const roleColors: Record<string, string> = {
    SUPER_ADMIN: "bg-red-100 text-red-800",
    NGO_ADMIN: "bg-blue-100 text-blue-800",
    STAFF: "bg-green-100 text-green-800",
    VIEWER: "bg-slate-100 text-slate-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-7 w-7 text-blue-600" />
          <h1 className="text-3xl font-bold">Utilizatori</h1>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Adauga utilizator
        </Button>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm">{successMsg}</div>
      )}
      {errorMsg && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">{errorMsg}</div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cauta dupa nume sau email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-9"
                />
              </div>
              <Button onClick={handleSearch} variant="secondary">
                Cauta
              </Button>
            </div>
            <div className="flex gap-2">
              <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); }}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate</SelectItem>
                  <SelectItem value="SUPER_ADMIN">SUPER_ADMIN</SelectItem>
                  <SelectItem value="NGO_ADMIN">NGO_ADMIN</SelectItem>
                  <SelectItem value="STAFF">STAFF</SelectItem>
                  <SelectItem value="VIEWER">VIEWER</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); }}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate</SelectItem>
                  <SelectItem value="active">Activ</SelectItem>
                  <SelectItem value="inactive">Inactiv</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={fetchUsers}>
                Filtreaza
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Se incarca...</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">Niciun utilizator gasit</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left text-muted-foreground">
                    <th className="p-3 font-medium">Nume</th>
                    <th className="p-3 font-medium">Email</th>
                    <th className="p-3 font-medium">Rol</th>
                    <th className="p-3 font-medium">ONG</th>
                    <th className="p-3 font-medium">Ultima autentificare</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Actiuni</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted/30">
                      <td className="p-3 font-medium">{user.name}</td>
                      <td className="p-3 text-muted-foreground">{user.email}</td>
                      <td className="p-3">
                        <Badge className={roleColors[user.role] || roleColors.VIEWER}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">{user.ngoName || "-"}</td>
                      <td className="p-3 text-muted-foreground">
                        {user.lastLogin
                          ? new Date(user.lastLogin).toLocaleDateString("ro-RO")
                          : "-"}
                      </td>
                      <td className="p-3">
                        <Badge variant={user.isActive ? "success" : "secondary"}>
                          {user.isActive ? "Activ" : "Inactiv"}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(user)}>
                            <Pencil className="h-3.5 w-3.5 mr-1" />
                            Editeaza rol
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(user.id, user.isActive)}
                            className={user.isActive ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}
                          >
                            <Power className="h-3.5 w-3.5 mr-1" />
                            {user.isActive ? "Dezactiveaza" : "Activeaza"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adauga utilizator</DialogTitle>
            <DialogDescription>Creeaza un utilizator nou in platforma</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nume *</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Numele complet" />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} type="email" placeholder="email@exemplu.ro" />
            </div>
            <div className="space-y-2">
              <Label>Parola *</Label>
              <Input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" placeholder="Parola" />
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUPER_ADMIN">SUPER_ADMIN</SelectItem>
                  <SelectItem value="NGO_ADMIN">NGO_ADMIN</SelectItem>
                  <SelectItem value="STAFF">STAFF</SelectItem>
                  <SelectItem value="VIEWER">VIEWER</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>ONG asociat</Label>
              <Select value={newNgoId} onValueChange={setNewNgoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecteaza ONG (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Fara ONG</SelectItem>
                  {ngos.map((ngo) => (
                    <SelectItem key={ngo.id} value={ngo.id}>{ngo.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Anuleaza</Button>
            <Button onClick={handleAddUser}>Creeaza utilizator</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editeaza utilizator</DialogTitle>
            <DialogDescription>Modifica rolul si ONG-ul asociat</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUPER_ADMIN">SUPER_ADMIN</SelectItem>
                  <SelectItem value="NGO_ADMIN">NGO_ADMIN</SelectItem>
                  <SelectItem value="STAFF">STAFF</SelectItem>
                  <SelectItem value="VIEWER">VIEWER</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>ONG asociat</Label>
              <Select value={editNgoId} onValueChange={setEditNgoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecteaza ONG" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Fara ONG</SelectItem>
                  {ngos.map((ngo) => (
                    <SelectItem key={ngo.id} value={ngo.id}>{ngo.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Anuleaza</Button>
            <Button onClick={handleEditUser}>Salveaza</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
