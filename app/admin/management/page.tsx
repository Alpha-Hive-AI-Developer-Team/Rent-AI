"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Shield,
  ShieldCheck,
  UserPlus,
  Users,
  Search,
  Mail,
  Clock,
  MoreVertical,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Trash2,
  AlertTriangle,
  X,
  Filter,
  Calendar,
} from "lucide-react";
import toast from "react-hot-toast";
import { withAuth } from "@/hooks/withAuth";
import { formatDate } from "@/lib/utils";
import {
  useAdmins,
  useAdminInvites,
  useInviteAdmin,
  useResendAdminInvite,
  useRevokeAdminInvite,
  useUpdateAdminStatus,
} from "@/hooks/useAdmin";

function getInitials(name?: string, email?: string): string {
  if (name && name.trim().length > 0) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email && email.trim().length > 0) {
    return email.slice(0, 2).toUpperCase();
  }
  return "AD";
}

function AdminManagementPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 500);
    return () => clearTimeout(t);
  }, [search]);

  const { data: adminsRes, isLoading: adminsLoading } = useAdmins({
    search: debouncedSearch || undefined,
    status: statusFilter === "All" ? undefined : statusFilter,
    page: 1,
    limit: 50,
  });
  const { data: invitesRes, isLoading: invitesLoading } = useAdminInvites(
    debouncedSearch || undefined
  );

  const adminsList: any[] =
    adminsRes?.data ?? adminsRes?.data?.data ?? adminsRes?.data ?? [];
  const invitesList: any[] = invitesRes?.data ?? [];

  const inviteAdminMutation = useInviteAdmin();
  const resendInviteMutation = useResendAdminInvite();
  const revokeInviteMutation = useRevokeAdminInvite();
  const updateStatusMutation = useUpdateAdminStatus();

  const filtered = useMemo(() => {
    return (adminsList || []).filter((a: any) => {
      const matchesSearch =
        !search ||
        `${a.name || ""} ${a.email || ""}`
          .toLowerCase()
          .includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "All" ? true : a.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [adminsList, search, statusFilter]);

  const stats = useMemo(() => {
    const total = adminsList.length;
    const active = adminsList.filter((a: any) => a.status === "active").length;
    const pending = invitesList.length;
    return { total, active, pending };
  }, [adminsList, invitesList]);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [statusConfirm, setStatusConfirm] = useState<{
    id: string;
    name: string;
    nextStatus: "active" | "disable";
  } | null>(null);

  const confirmChangeStatus = () => {
    if (!statusConfirm) return;
    updateStatusMutation.mutate(
      { id: statusConfirm.id, status: statusConfirm.nextStatus },
      {
        onSuccess: () => {
          toast.success(
            statusConfirm.nextStatus === "active"
              ? "Admin account activated"
              : "Admin account disabled"
          );
          setStatusConfirm(null);
        },
        onError: (err: any) =>
          toast.error(
            err?.response?.data?.message ||
              err?.message ||
              "Failed to update status"
          ),
      }
    );
  };

  const onInviteAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = inviteEmail.trim();
    if (!email) {
      toast.error("Email is required");
      return;
    }

    inviteAdminMutation.mutate(
      { email },
      {
        onSuccess: () => {
          setShowInviteModal(false);
          setInviteEmail("");
          toast.success("Invite sent by email");
        },
        onError: (err: any) => {
          toast.error(
            err?.response?.data?.message ||
              err?.message ||
              "Failed to send invite"
          );
        },
      }
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-black min-h-screen text-white space-y-6 sm:space-y-8 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-800/60">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-[#027A48]/10 border border-[#027A48]/20 text-emerald-400 hidden sm:flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="sm:hidden text-emerald-400">
                <ShieldCheck className="w-5 h-5 inline-block -mt-1" />
              </span>
              Admin Management
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Invite team administrators and oversee platform access permissions
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#027A48] hover:bg-[#02653d] text-white text-sm font-medium transition-all shadow-sm active:scale-95 w-full sm:w-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invite Admin</span>
        </button>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Total Admins */}
        <div className="bg-[#111] border border-gray-800/70 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-medium">Total Admins</p>
            <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gray-800/50 flex items-center justify-center text-gray-300">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Active Admins */}
        <div className="bg-[#111] border border-gray-800/70 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-medium">Active Accounts</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">
              {stats.active}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#027A48]/15 border border-emerald-900/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Pending Invites */}
        <div className="bg-[#111] border border-gray-800/70 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-medium">Pending Invites</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">
              {stats.pending}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#111] border border-gray-800/70 rounded-xl p-3 sm:p-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search admins by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#161616] border border-gray-800 text-xs sm:text-sm text-gray-200 placeholder-gray-500 rounded-xl pl-9 pr-8 py-2.5 focus:outline-none focus:border-[#027A48] focus:ring-1 focus:ring-[#027A48] transition"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-10 px-4 rounded-xl bg-[#161616] border border-gray-800 text-gray-300 hover:text-white hover:border-gray-700 flex items-center justify-between sm:justify-start gap-2 text-xs sm:text-sm transition w-full sm:w-auto">
                <span className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-gray-400" />
                  <span>
                    Status:{" "}
                    <strong className="text-white font-medium">
                      {statusFilter === "All"
                        ? "All"
                        : statusFilter === "active"
                        ? "Active"
                        : "Disabled"}
                    </strong>
                  </span>
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-[#141414] border border-gray-800 text-gray-300 rounded-xl shadow-xl min-w-[150px] p-1"
            >
              <DropdownMenuItem
                onClick={() => setStatusFilter("All")}
                className="cursor-pointer hover:bg-white/5 rounded-lg text-xs sm:text-sm px-3 py-2"
              >
                All Statuses
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setStatusFilter("active")}
                className="cursor-pointer hover:bg-white/5 rounded-lg text-xs sm:text-sm px-3 py-2 text-emerald-400"
              >
                Active Only
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setStatusFilter("disable")}
                className="cursor-pointer hover:bg-white/5 rounded-lg text-xs sm:text-sm px-3 py-2 text-rose-400"
              >
                Disabled Only
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Section 1: Pending Invites */}
      <div className="bg-[#111] border border-gray-800/80 rounded-2xl overflow-hidden shadow-md shadow-black/40 space-y-4 p-4 sm:p-6">
        <div className="flex items-center justify-between border-b border-gray-800/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Mail className="w-4 h-4" />
            </div>
            <h2 className="text-sm sm:text-base font-semibold text-white">
              Pending Invites
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {invitesList.length}
            </span>
          </div>
        </div>

        {/* Mobile View: Cards (< sm) */}
        <div className="block sm:hidden space-y-3">
          {invitesLoading ? (
            <div className="py-8 text-center text-gray-400 text-xs">
              Loading pending invites...
            </div>
          ) : invitesList.length === 0 ? (
            <div className="py-6 text-center text-gray-400 text-xs bg-[#0c0c0c] rounded-xl border border-gray-800/60">
              No pending admin invites
            </div>
          ) : (
            invitesList.map((inv: any) => (
              <div
                key={inv._id}
                className="p-3.5 bg-[#0c0c0c] border border-gray-800/80 rounded-xl space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400 font-medium">Email</p>
                    <p className="text-sm font-semibold text-white truncate">
                      {inv.email}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-medium shrink-0">
                    Pending
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 pt-1 border-t border-gray-800/60">
                  <div>
                    <span className="text-[10px] text-gray-400 block">
                      Sent Date
                    </span>
                    <span className="text-gray-300 text-xs">
                      {formatDate(inv.createdAt)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block">
                      Expires
                    </span>
                    <span className="text-gray-300 text-xs">
                      {formatDate(inv.expiresAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-gray-800/60">
                  <button
                    onClick={() =>
                      resendInviteMutation.mutate(inv._id, {
                        onSuccess: () => toast.success("Invite resent"),
                        onError: (err: any) =>
                          toast.error(
                            err?.response?.data?.message || "Failed to resend"
                          ),
                      })
                    }
                    disabled={resendInviteMutation.isPending}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium border border-emerald-700/40 text-emerald-300 bg-emerald-950/20 hover:bg-emerald-950/40 active:scale-95 transition"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Resend</span>
                  </button>
                  <button
                    onClick={() =>
                      revokeInviteMutation.mutate(inv._id, {
                        onSuccess: () => toast.success("Invite revoked"),
                        onError: (err: any) =>
                          toast.error(
                            err?.response?.data?.message || "Failed to revoke"
                          ),
                      })
                    }
                    disabled={revokeInviteMutation.isPending}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium border border-rose-800/40 text-rose-300 bg-rose-950/20 hover:bg-rose-950/40 active:scale-95 transition"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Revoke</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop / Tablet View: Table (>= sm) with Hidden Scrollbar */}
        <div className="hidden sm:block overflow-x-auto rounded-xl border border-gray-800/70 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <table className="w-full text-left text-xs sm:text-sm min-w-[620px]">
            <thead>
              <tr className="bg-[#0c0c0c] border-b border-gray-800 text-gray-400 font-medium">
                <th className="py-3 px-4">Invited Email</th>
                <th className="py-3 px-4">Invited Date</th>
                <th className="py-3 px-4">Expires</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {invitesLoading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="py-8 text-center text-gray-400 text-sm"
                  >
                    Loading invites...
                  </td>
                </tr>
              ) : invitesList.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="py-8 text-center text-gray-400 text-sm"
                  >
                    No pending invites found
                  </td>
                </tr>
              ) : (
                invitesList.map((inv: any) => (
                  <tr
                    key={inv._id}
                    className="hover:bg-[#151515] transition-colors"
                  >
                    <td className="py-3.5 px-4 font-medium text-gray-200">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#1a1a1a] border border-gray-800 flex items-center justify-center text-gray-400 shrink-0">
                          <Mail className="w-3.5 h-3.5" />
                        </div>
                        <span>{inv.email}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-400">
                      {formatDate(inv.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 text-gray-400">
                      {formatDate(inv.expiresAt)}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() =>
                            resendInviteMutation.mutate(inv._id, {
                              onSuccess: () => toast.success("Invite resent"),
                              onError: (err: any) =>
                                toast.error(
                                  err?.response?.data?.message ||
                                    "Failed to resend"
                                ),
                            })
                          }
                          disabled={resendInviteMutation.isPending}
                          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-emerald-700/40 text-emerald-300 bg-emerald-950/20 hover:bg-emerald-900/30 transition active:scale-95"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Resend</span>
                        </button>
                        <button
                          onClick={() =>
                            revokeInviteMutation.mutate(inv._id, {
                              onSuccess: () => toast.success("Invite revoked"),
                              onError: (err: any) =>
                                toast.error(
                                  err?.response?.data?.message ||
                                    "Failed to revoke"
                                ),
                            })
                          }
                          disabled={revokeInviteMutation.isPending}
                          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-rose-800/40 text-rose-300 bg-rose-950/20 hover:bg-rose-900/30 transition active:scale-95"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Revoke</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Active Admins */}
      <div className="bg-[#111] border border-gray-800/80 rounded-2xl overflow-hidden shadow-md shadow-black/40 space-y-4 p-4 sm:p-6">
        <div className="flex items-center justify-between border-b border-gray-800/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#027A48]/15 flex items-center justify-center text-emerald-400">
              <Shield className="w-4 h-4" />
            </div>
            <h2 className="text-sm sm:text-base font-semibold text-white">
              Administrator Accounts
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#027A48]/15 text-emerald-400 border border-[#027A48]/30">
              {filtered.length}
            </span>
          </div>
        </div>

        {/* Mobile View: Cards (< sm) */}
        <div className="block sm:hidden space-y-3">
          {adminsLoading ? (
            <div className="py-8 text-center text-gray-400 text-xs">
              Loading administrators...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-6 text-center text-gray-400 text-xs bg-[#0c0c0c] rounded-xl border border-gray-800/60">
              No admins match your search
            </div>
          ) : (
            filtered.map((a: any) => {
              const isActive = a.status === "active";
              const initials = getInitials(a.name, a.email);
              const adminId = a._id || a.id;

              return (
                <div
                  key={adminId}
                  className="p-3.5 bg-[#0c0c0c] border border-gray-800/80 rounded-xl space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-800/40 to-teal-900/40 border border-emerald-600/30 text-emerald-300 font-semibold text-xs flex items-center justify-center shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {a.name || "Administrator"}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {a.email}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 text-[10px] rounded-full font-medium inline-flex items-center gap-1 shrink-0 ${
                        isActive
                          ? "bg-emerald-950/40 text-emerald-400 border border-emerald-700/40"
                          : "bg-rose-950/40 text-rose-400 border border-rose-800/40"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isActive ? "bg-emerald-400" : "bg-rose-400"
                        }`}
                      />
                      {isActive ? "Active" : "Disabled"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-800/60">
                    <span className="flex items-center gap-1 text-[11px]">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      Joined {formatDate(a.createdAt)}
                    </span>

                    <button
                      onClick={() =>
                        setStatusConfirm({
                          id: adminId,
                          name: a.name || a.email,
                          nextStatus: isActive ? "disable" : "active",
                        })
                      }
                      className={`text-xs px-3 py-1 rounded-lg border font-medium transition active:scale-95 ${
                        isActive
                          ? "border-rose-800/40 text-rose-300 bg-rose-950/20 hover:bg-rose-900/30"
                          : "border-emerald-700/40 text-emerald-300 bg-emerald-950/20 hover:bg-emerald-900/30"
                      }`}
                    >
                      {isActive ? "Disable Access" : "Activate Access"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop / Tablet View: Table (>= sm) with Hidden Scrollbar */}
        <div className="hidden sm:block overflow-x-auto rounded-xl border border-gray-800/70 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <table className="w-full text-left text-xs sm:text-sm min-w-[680px]">
            <thead>
              <tr className="bg-[#0c0c0c] border-b border-gray-800 text-gray-400 font-medium">
                <th className="py-3 px-4">Administrator</th>
                <th className="py-3 px-4">Email Address</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {adminsLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center text-gray-400 text-sm"
                  >
                    Loading administrators...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center text-gray-400 text-sm"
                  >
                    No administrators found matching criteria
                  </td>
                </tr>
              ) : (
                filtered.map((a: any) => {
                  const isActive = a.status === "active";
                  const initials = getInitials(a.name, a.email);
                  const adminId = a._id || a.id;

                  return (
                    <tr
                      key={adminId}
                      className="hover:bg-[#151515] transition-colors"
                    >
                      <td className="py-3.5 px-4 font-medium text-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-800/40 to-teal-900/40 border border-emerald-600/30 text-emerald-300 font-semibold text-xs flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <span className="truncate max-w-[180px]">
                            {a.name || "Administrator"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-gray-300 font-mono text-xs">
                        {a.email}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full font-medium ${
                            isActive
                              ? "bg-emerald-950/40 text-emerald-400 border border-emerald-700/40"
                              : "bg-rose-950/40 text-rose-400 border border-rose-800/40"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isActive ? "bg-emerald-400" : "bg-rose-400"
                            }`}
                          />
                          {isActive ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-400">
                        {formatDate(a.createdAt)}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="bg-[#141414] border border-gray-800 text-gray-200 rounded-xl shadow-xl min-w-[160px] p-1"
                          >
                            {isActive ? (
                              <DropdownMenuItem
                                onClick={() =>
                                  setStatusConfirm({
                                    id: adminId,
                                    name: a.name || a.email,
                                    nextStatus: "disable",
                                  })
                                }
                                className="cursor-pointer text-rose-400 hover:bg-rose-950/30 rounded-lg text-xs px-3 py-2 flex items-center gap-2"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Disable Account</span>
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() =>
                                  setStatusConfirm({
                                    id: adminId,
                                    name: a.name || a.email,
                                    nextStatus: "active",
                                  })
                                }
                                className="cursor-pointer text-emerald-400 hover:bg-emerald-950/30 rounded-lg text-xs px-3 py-2 flex items-center gap-2"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Activate Account</span>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#111] border border-gray-800 rounded-2xl p-6 text-white shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800/80 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#027A48]/15 border border-[#027A48]/30 flex items-center justify-center text-emerald-400">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold">
                  Invite Administrator
                </h3>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-gray-400 mb-5 leading-relaxed">
              We will send a secure invitation email with a link for the new admin
              to complete their profile and set credentials. Invites remain valid
              for 7 days.
            </p>

            <form onSubmit={onInviteAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Admin Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="email"
                    required
                    placeholder="admin@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full bg-[#161616] border border-gray-800 text-gray-100 placeholder-gray-500 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#027A48] focus:ring-1 focus:ring-[#027A48] transition"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-800/80">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-800 text-xs sm:text-sm text-gray-300 hover:bg-white/5 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteAdminMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-[#027A48] text-white text-xs sm:text-sm font-medium hover:bg-[#02653d] transition active:scale-95 disabled:opacity-50"
                >
                  {inviteAdminMutation.isPending
                    ? "Sending Invite..."
                    : "Send Invitation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Confirmation Modal */}
      {statusConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#111] border border-gray-800 rounded-2xl p-6 text-white shadow-2xl relative">
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  statusConfirm.nextStatus === "disable"
                    ? "bg-rose-500/10 border border-rose-500/20 text-rose-400"
                    : "bg-[#027A48]/15 border border-[#027A48]/30 text-emerald-400"
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white">
                  {statusConfirm.nextStatus === "disable"
                    ? "Disable Admin Account"
                    : "Reactivate Admin Account"}
                </h3>
                <p className="text-xs text-gray-400">
                  Confirm permission modification
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-gray-300 mb-6 leading-relaxed bg-[#161616] p-3.5 rounded-xl border border-gray-800/60">
              {statusConfirm.nextStatus === "disable" ? (
                <>
                  Are you sure you want to disable access for{" "}
                  <strong className="text-white">{statusConfirm.name}</strong>?
                  They will immediately lose access to the admin dashboard until
                  reactivated.
                </>
              ) : (
                <>
                  Are you sure you want to activate access for{" "}
                  <strong className="text-white">{statusConfirm.name}</strong>?
                  They will regain full administrative privileges upon sign-in.
                </>
              )}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStatusConfirm(null)}
                className="px-4 py-2 rounded-xl border border-gray-800 text-xs sm:text-sm text-gray-300 hover:bg-white/5 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmChangeStatus}
                disabled={updateStatusMutation.isPending}
                className={`px-5 py-2 rounded-xl text-white text-xs sm:text-sm font-medium transition active:scale-95 disabled:opacity-50 ${
                  statusConfirm.nextStatus === "disable"
                    ? "bg-rose-700 hover:bg-rose-600 shadow-sm shadow-rose-900/30"
                    : "bg-[#027A48] hover:bg-[#02653d] shadow-sm shadow-[#027A48]/30"
                }`}
              >
                {updateStatusMutation.isPending
                  ? "Updating..."
                  : statusConfirm.nextStatus === "disable"
                  ? "Disable Account"
                  : "Activate Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAuth(AdminManagementPage, ["superAdmin"]);

