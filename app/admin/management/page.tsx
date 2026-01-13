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
import { useAdmins, useCreateAdmin, useUpdateAdminStatus } from "@/hooks/useAdmin";

function AdminManagementPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 700);
    return () => clearTimeout(t);
  }, [search]);

  const { data: adminsRes, isLoading: adminsLoading } = useAdmins({ search: debouncedSearch || undefined, status: statusFilter === 'All' ? undefined : statusFilter, page: 1, limit: 50 });
  const adminsList = adminsRes?.data ?? adminsRes?.data?.data ?? adminsRes?.data ?? [];
  const createAdminMutation = useCreateAdmin();
  const updateStatusMutation = useUpdateAdminStatus();

  const filtered = useMemo(() => {
    // prefer server-provided list; fallback empty
    return (adminsList || []).filter((a: any) => {
      const matchesSearch = !search || `${a.name} ${a.email}`.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "All" ? true : a.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [adminsList, search, statusFilter]);

  const changeStatus = (id: string, newStatus: string) => {
    updateStatusMutation.mutate({ id, status: newStatus as 'active' | 'disable' }, {
      onSuccess: () => {
        toast.success('Admin status updated');
      },
      onError: (err: any) => {
        toast.error(err?.message || 'Failed to update status');
      }
    });
  };

  // Add Admin modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newAdminForm, setNewAdminForm] = useState({ firstName: "", lastName: "", email: "", password: "" });

  const onCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    createAdminMutation.mutate(newAdminForm, {
      onSuccess: (res: any) => {
        setAdding(false);
        setShowAddModal(false);
        setNewAdminForm({ firstName: "", lastName: "", email: "", password: "" });
        toast.success("Admin created");
      },
      onError: (err: any) => {
        setAdding(false);
        toast.error(err?.message || 'Failed to create admin');
      }
    });
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-black min-h-screen text-white">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold">Admin Management</h1>
          <p className="text-[#535862] text-sm">Manage admin accounts and statuses</p>
        </div>

        <div className="mt-3 sm:mt-0">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm"
          >
            Add New Admin
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center gap-3 mb-4">
        <div className="w-full md:w-1/3">
          <Input
            placeholder="Search admins by name or email"
            value={search}
            onChange={(e: any) => setSearch(e.target.value)}
            className="bg-[#111] border-gray-800 text-white"
          />
        </div>

        <div className="w-full md:w-auto flex items-center gap-2">
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
      </div>

          <div className="w-full overflow-x-auto rounded-lg bg-[#070707] border border-[#151515]">
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
                <td colSpan={5} className="py-6 px-4 text-center text-gray-400">
                  No admins found
                </td>
              </tr>
            ) : (
              filtered.map((a:any) => (
                <tr key={a._id || a.id} className="border-t border-[#111] hover:bg-[#0e0e0e]">
                  <td className="py-3 px-4 text-gray-200">{a.name}</td>
                  <td className="py-3 px-4 text-gray-300">{a.email}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${a.status === 'active' ? 'bg-emerald-900/20 text-emerald-400 border border-emerald-700' : 'bg-red-900/20 text-rose-400 border border-rose-700'}`}>
                      {a.status === 'active' ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-300">{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '—'}</td>
                  <td className="py-3 px-6 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2 rounded-full hover:bg-[#0e0e0e]">
                          <MoreVertical className="w-4 h-4 text-gray-300" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-[#111] border border-gray-800 text-gray-300">
                        <DropdownMenuItem onClick={() => changeStatus(a._id || a.id, 'active')} className="cursor-pointer">Set Active</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => changeStatus(a._id || a.id, 'disable')} className="cursor-pointer">Set Disabled</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-lg bg-[#0c0c0c] border border-gray-800 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Create New Admin</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={onCreateAdmin} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1 text-gray-300">First Name</label>
                  <input
                    placeholder="First Name"
                    value={newAdminForm.firstName}
                    onChange={(e) => setNewAdminForm({ ...newAdminForm, firstName: e.target.value })}
                    className="w-full bg-transparent border border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1 text-gray-300">Last Name</label>
      
                  <input
                    placeholder="Last Name"
                    value={newAdminForm.lastName}
                    onChange={(e) => setNewAdminForm({ ...newAdminForm, lastName: e.target.value })}
                    className="w-full bg-transparent border border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1 text-gray-300">Email</label>
                <input
                  type="email"
                  placeholder="Email"
                  value={newAdminForm.email}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, email: e.target.value })}
                  className="w-full bg-transparent border border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm mb-1 text-gray-300">Password</label>
                <input
                  type="password"
                  placeholder="Password"
                  value={newAdminForm.password}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, password: e.target.value })}
                  className="w-full bg-transparent border border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 mt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-full border border-[#2A2A2A] text-sm text-gray-300 hover:bg-white/5">Cancel</button>
                <button type="submit" disabled={adding} className="px-4 py-2 rounded-full bg-[#027A48] text-white text-sm hover:bg-[#02653d] disabled:opacity-50">
                  {adding ? 'Creating...' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

  // Add modal state and handlers near the bottom of the file (outside component return)

  export default withAuth(AdminManagementPage,["superAdmin"])