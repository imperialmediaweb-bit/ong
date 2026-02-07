"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateTime } from "@/lib/utils";
import {
  Search,
  Filter,
  Loader2,
  Mail,
  MessageSquare,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Inbox,
} from "lucide-react";

interface Message {
  id: string;
  campaignId: string | null;
  campaignName: string | null;
  channel: string;
  status: string;
  recipientCount: number;
  deliveredCount: number;
  subject: string | null;
  sentAt: string | null;
  createdAt: string;
}

interface MessagesResponse {
  messages: Message[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const CHANNEL_OPTIONS = [
  { value: "all", label: "All Channels" },
  { value: "EMAIL", label: "Email" },
  { value: "SMS", label: "SMS" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "SENDING", label: "Sending" },
  { value: "SENT", label: "Sent" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "FAILED", label: "Failed" },
  { value: "BOUNCED", label: "Bounced" },
];

const statusBadgeVariant = (status: string) => {
  switch (status) {
    case "DELIVERED":
    case "SENT":
      return "success" as const;
    case "SENDING":
    case "PENDING":
      return "warning" as const;
    case "FAILED":
    case "BOUNCED":
      return "destructive" as const;
    default:
      return "secondary" as const;
  }
};

const statusIcon = (status: string) => {
  switch (status) {
    case "DELIVERED":
    case "SENT":
      return <CheckCircle2 className="h-3 w-3" />;
    case "SENDING":
    case "PENDING":
      return <Clock className="h-3 w-3" />;
    case "FAILED":
    case "BOUNCED":
      return <XCircle className="h-3 w-3" />;
    default:
      return <Send className="h-3 w-3" />;
  }
};

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (channelFilter !== "all") params.set("channel", channelFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      params.set("page", page.toString());
      params.set("pageSize", pageSize.toString());

      const res = await fetch(`/api/messages?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      const data: MessagesResponse = await res.json();
      setMessages(data.messages || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, channelFilter, statusFilter, page]);

  useEffect(() => {
    const timeout = setTimeout(fetchMessages, 300);
    return () => clearTimeout(timeout);
  }, [fetchMessages]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
        <p className="text-muted-foreground">
          View all sent messages across campaigns. {total > 0 && `${total} message${total !== 1 ? "s" : ""} total.`}
        </p>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by campaign name or subject..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Button
              variant={filtersOpen ? "secondary" : "outline"}
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>
          {filtersOpen && (
            <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t">
              <div className="w-48">
                <Select value={channelFilter} onValueChange={(v) => { setChannelFilter(v); setPage(1); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Channel" />
                  </SelectTrigger>
                  <SelectContent>
                    {CHANNEL_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-48">
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive">
          <CardContent className="py-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Messages Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No messages found</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                {search || channelFilter !== "all" || statusFilter !== "all"
                  ? "Try adjusting your search or filters."
                  : "Messages will appear here once campaigns are sent."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left font-medium">Date</th>
                    <th className="p-3 text-left font-medium">Campaign</th>
                    <th className="p-3 text-left font-medium hidden md:table-cell">Subject</th>
                    <th className="p-3 text-left font-medium">Channel</th>
                    <th className="p-3 text-left font-medium">Status</th>
                    <th className="p-3 text-right font-medium">Recipients</th>
                    <th className="p-3 text-right font-medium hidden md:table-cell">Delivered</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((msg) => (
                    <tr key={msg.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-3 text-muted-foreground whitespace-nowrap">
                        {msg.sentAt ? formatDateTime(msg.sentAt) : formatDateTime(msg.createdAt)}
                      </td>
                      <td className="p-3 font-medium max-w-[200px] truncate">
                        {msg.campaignName || "Direct Message"}
                      </td>
                      <td className="p-3 text-muted-foreground hidden md:table-cell max-w-[200px] truncate">
                        {msg.subject || "-"}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          {msg.channel === "EMAIL" ? (
                            <Mail className="h-3 w-3 text-muted-foreground" />
                          ) : (
                            <MessageSquare className="h-3 w-3 text-muted-foreground" />
                          )}
                          <span className="text-xs">{msg.channel}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant={statusBadgeVariant(msg.status)} className="gap-1">
                          {statusIcon(msg.status)}
                          {msg.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">{msg.recipientCount.toLocaleString()}</td>
                      <td className="p-3 text-right hidden md:table-cell">
                        {msg.deliveredCount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
