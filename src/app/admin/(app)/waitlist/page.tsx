"use client";

import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button-v2";
import { Input } from "@/shared/ui/input";
import { Typography } from "@/shared/ui/typography";
import { useAdminAuthStore } from "@/store/use-admin-auth";

interface WaitlistEntry {
  id: string;
  walletAddress: string;
  email?: string;
  queuePosition: number;
  referralCount: number;
  status: string;
  createdAt: string;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "PENDING")
    return <Badge className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/20">PENDING</Badge>;
  if (status === "CONFIRMED")
    return <Badge className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/20">CONFIRMED</Badge>;
  if (status === "ACCESS_SENT")
    return (
      <Badge className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20">
        ACCESS_SENT
      </Badge>
    );
  return <Badge className="bg-muted text-muted-foreground hover:bg-muted">{status}</Badge>;
}

const PAGE_SIZE = 20;

export default function AdminWaitlistPage() {
  const token = useAdminAuthStore((s) => s.token);
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    setIsLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);

    fetch(`/api/admin/waitlist?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        setEntries(d.items ?? []);
        setTotal(d.total ?? 0);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [token, page, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function applySearch() {
    setSearch(searchInput);
    setPage(1);
  }

  return (
    <div className="space-y-6 p-8">
      <div>
        <Typography variant="h2" className="font-bold text-xl">
          Waitlist Entries
        </Typography>
        <p className="mt-1 text-muted-foreground text-sm">
          {total.toLocaleString()} total registrations
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Input
          placeholder="Search wallet or email…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applySearch()}
          className="max-w-sm"
        />
        <Button variant="outline" onClick={applySearch}>
          Search
        </Button>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="ACCESS_SENT">Access Sent</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium">#</th>
              <th className="px-4 py-3 text-left font-medium">Wallet</th>
              <th className="px-4 py-3 text-left font-medium">Email</th>
              <th className="px-4 py-3 text-left font-medium">Refs</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted-foreground">
                  No entries found
                </td>
              </tr>
            ) : (
              entries.map((e) => (
                <tr key={e.id} className="transition-colors hover:bg-muted/20">
                  <td className="px-4 py-3 text-muted-foreground">{e.queuePosition}</td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {e.walletAddress.slice(0, 6)}…{e.walletAddress.slice(-6)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{e.email ?? "—"}</td>
                  <td className="px-4 py-3 text-emerald-400">{e.referralCount}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={e.status} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(e.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Page {page} of {totalPages}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
