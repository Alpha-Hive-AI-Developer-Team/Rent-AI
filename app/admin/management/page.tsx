"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import toast from "react-hot-toast";
import { withAuth } from "@/hooks/withAuth";
import {
  useAdmins,
  useAdminInvites,
  useInviteAdmin,
  useResendAdminInvite,
  useRevokeAdminInvite,
  useUpdateAdminStatus,
} from "@/hooks/useAdmin";

function AdminManagementPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 700);
    return () => clearTimeout(t);
  }, [search]);

  const { data: adminsRes, isLoading: adminsLoading } = useAdmins({
    search: debouncedSearch || undefined,
    status: statusFilter === "All" ? undefined : statusFilter,
    page: 1,
    limit: 50,
  });
  const { data: invitesRes, isLoading: invitesLoading } = useAdminInvites(debouncedSearch || undefined);

  const adminsList = adminsRes?.data ?? adminsRes?.data?.data ?? adminsRes?.data ?? [];
  const invitesList = invitesRes?.data ?? [];

  const inviteAdminMutation = useInviteAdmin();
  const resendInviteMutation = useResendAdminInvite();
  const revokeInviteMutation = useRevokeAdminInvite();
  const updateStatusMutation = useUpdateAdminStatus();

  const filtered = useMemo(() => {
    return (adminsList || []).filter((a: any) => {
      const matchesSearch = !search || `${a.name} ${a.email}`.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "All" ? true : a.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [adminsList, search, statusFilter]);

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
          toast.error(err?.response?.data?.message || err?.message || "Failed to update status"),
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
          toast.error(err?.response?.data?.message || err?.message || "Failed to send invite");
        },
      }
    );
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-black min-h-screen text-white">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold">Admin Management</h1>
          <p className="text-[#535862] text-sm">Invite admins by email and manage active accounts</p>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm"
        >
          Invite Admin
        </button>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center gap-3 mb-4">
        <div className="w-full md:w-1/3">
          <Input
            placeholder="Search admins or invites"
            value={search}
            onChange={(e: any) => setSearch(e.target.value)}
            className="bg-[#111] border-gray-800 text-white"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-[#111] border border-gray-800 text-gray-300 flex items-center">
              {statusFilter === "All" ? "Status: All" : `Status: ${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}`}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-[#111] border border-gray-800 text-gray-300">
            {(["All", "active", "disable"] as string[]).map((s) => (
              <DropdownMenuItem key={s} onClick={() => setStatusFilter(s)} className="cursor-pointer">
                {s === "All" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mb-8">
        <h2 className="text-sm font-medium text-gray-300 mb-3">Pending invites</h2>
        <div className="w-full overflow-x-auto rounded-lg bg-[#070707] border border-[#151515]">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-left">
                <th className="py-3 px-4 text-xs">Email</th>
                <th className="py-3 px-4 text-xs">Invited at</th>
                <th className="py-3 px-4 text-xs">Expires</th>
                <th className="py-3 px-6 text-xs text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {invitesLoading ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-gray-400">Loading invites...</td>
                </tr>
              ) : invitesList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-gray-400">No pending invites</td>
                </tr>
              ) : (
                invitesList.map((inv: any) => (
                  <tr key={inv._id} className="border-t border-[#111] hover:bg-[#0e0e0e]">
                    <td className="py-3 px-4 text-gray-200">{inv.email}</td>
                    <td className="py-3 px-4 text-gray-300">
                      {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      {inv.expiresAt ? new Date(inv.expiresAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-3 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() =>
                            resendInviteMutation.mutate(inv._id, {
                              onSuccess: () => toast.success("Invite resent"),
                              onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to resend"),
                            })
                          }
                          className="text-xs px-3 py-1 rounded-full border border-emerald-700 text-emerald-300"
                        >
                          Resend
                        </button>
                        <button
                          onClick={() =>
                            revokeInviteMutation.mutate(inv._id, {
                              onSuccess: () => toast.success("Invite revoked"),
                              onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to revoke"),
                            })
                          }
                          className="text-xs px-3 py-1 rounded-full border border-rose-700 text-rose-300"
                        >
                          Revoke
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

      <div className="w-full overflow-x-auto rounded-lg bg-[#070707] border border-[#151515]">
        <h2 className="text-sm font-medium text-gray-300 px-4 pt-4 pb-2">Active admins</h2>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-gray-400 text-left">
              <th className="py-3 px-4 text-xs">Name</th>
              <th className="py-3 px-4 text-xs">Email</th>
              <th className="py-3 px-4 text-xs">Status</th>
              <th className="py-3 px-4 text-xs">Created</th>
              <th className="py-3 px-6 text-xs text-right rounded-tr-lg">Action</th>
            </tr>
          </thead>
          <tbody>
            {adminsLoading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-400">Loading admins...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 px-4 text-center text-gray-400">No admins found</td>
              </tr>
            ) : (
              filtered.map((a: any) => (
                <tr key={a._id || a.id} className="border-t border-[#111] hover:bg-[#0e0e0e]">
                  <td className="py-3 px-4 text-gray-200">{a.name}</td>
                  <td className="py-3 px-4 text-gray-300">{a.email}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-medium ${
                        a.status === "active"
                          ? "bg-emerald-900/20 text-emerald-400 border border-emerald-700"
                          : "bg-red-900/20 text-rose-400 border border-rose-700"
                      }`}
                    >
                      {a.status === "active" ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-300">
                    {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="py-3 px-6 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2 rounded-full hover:bg-[#0e0e0e]">
                          <MoreVertical className="w-4 h-4 text-gray-300" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-[#111] border border-gray-800 text-gray-300">
                        {a.status === "active" ? (
                          <DropdownMenuItem
                            onClick={() =>
                              setStatusConfirm({
                                id: a._id || a.id,
                                name: a.name || a.email,
                                nextStatus: "disable",
                              })
                            }
                            className="cursor-pointer text-rose-300"
                          >
                            Set Disabled
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() =>
                              setStatusConfirm({
                                id: a._id || a.id,
                                name: a.name || a.email,
                                nextStatus: "active",
                              })
                            }
                            className="cursor-pointer text-emerald-300"
                          >
                            Set Active
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md bg-[#0c0c0c] border border-gray-800 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Invite Admin</h3>
              <button onClick={() => setShowInviteModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <p className="text-sm text-gray-400 mb-4">
              We will email them a secure link to set their name and password. Invites expire after 7 days.
            </p>

            <form onSubmit={onInviteAdmin} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm mb-1 text-gray-300">Email</label>
                <input
                  type="email"
                  required
                  placeholder="admin@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-transparent border border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 rounded-full border border-[#2A2A2A] text-sm text-gray-300 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteAdminMutation.isPending}
                  className="px-4 py-2 rounded-full bg-[#027A48] text-white text-sm hover:bg-[#02653d] disabled:opacity-50"
                >
                  {inviteAdminMutation.isPending ? "Sending..." : "Send invite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {statusConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md bg-[#0c0c0c] border border-gray-800 rounded-2xl p-6 text-white shadow-xl">
            <h3 className="text-lg font-semibold mb-2">
              {statusConfirm.nextStatus === "disable" ? "Disable admin?" : "Activate admin?"}
            </h3>
            <p className="text-sm text-gray-400 mb-6">
              {statusConfirm.nextStatus === "disable"
                ? `Are you sure you want to disable ${statusConfirm.name}? They will not be able to sign in until reactivated.`
                : `Are you sure you want to activate ${statusConfirm.name}? They will be able to sign in again.`}
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setStatusConfirm(null)}
                className="px-4 py-2 rounded-full border border-[#2A2A2A] text-sm text-gray-300 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmChangeStatus}
                disabled={updateStatusMutation.isPending}
                className={`px-4 py-2 rounded-full text-white text-sm disabled:opacity-50 ${
                  statusConfirm.nextStatus === "disable"
                    ? "bg-rose-700 hover:bg-rose-600"
                    : "bg-[#027A48] hover:bg-[#02653d]"
                }`}
              >
                {updateStatusMutation.isPending
                  ? "Updating..."
                  : statusConfirm.nextStatus === "disable"
                    ? "Disable"
                    : "Activate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAuth(AdminManagementPage, ["superAdmin"]);
