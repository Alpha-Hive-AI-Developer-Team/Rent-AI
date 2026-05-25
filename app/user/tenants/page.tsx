"use client";

import { Search, Plus, X, DollarSign, Pencil } from "lucide-react";
import { useState } from "react";
import NewTenantModal from "@/components/user/new-tenant-modal";
import usePayByCash, { useTenants, useUpdateTenant } from "@/hooks/usetenants";

export default function TenantsPage() {
  const normalizeTenantNames = (value: any): string[] => {
    if (Array.isArray(value)) {
      return value
        .map((name) => (typeof name === "string" ? name.trim() : String(name)))
        .filter(Boolean);
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed ? [trimmed] : [];
    }

    return [];
  };

  const getTenantDisplayName = (tenant: any) => {
    const names = normalizeTenantNames(tenant?.tenantName ?? tenant?.name);
    return names.length > 0 ? names.join(", ") : "Tenant";
  };

  const formatDate = (d: any) => {
    if (!d) return "—";
    const date = d instanceof Date ? d : new Date(d);
    if (isNaN(date.getTime())) return "—";
    const day = date.getUTCDate();
    const month = date.getUTCMonth() + 1;
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  };

  const [search, setSearch] = useState("");
  const [newTenantOpen, setNewTenantOpen] = useState(false);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<any | null>(null);
  const [pendingCash, setPendingCash] = useState<any | null>(null);
  const [editTenantOpen, setEditTenantOpen] = useState(false);
  const [editTenantNames, setEditTenantNames] = useState<string[]>([]);
  const [currentEditName, setCurrentEditName] = useState("");
  const [editConfirmationOpen, setEditConfirmationOpen] = useState(false);

  const { data, isLoading, isError } = useTenants();
  const payByCashMutation = usePayByCash();
  const updateTenantMutation = useUpdateTenant();

  const tenantsFromApi = data?.data ?? [];

  const statusColors: Record<string, string> = {
    Paid: "bg-green-900/40 text-green-400 border-green-700/60",
    Unpaid: "bg-red-900/40 text-red-400 border-red-700/60",
    Partial: "bg-yellow-900/40 text-yellow-400 border-yellow-700/60",
  };

  const filtered = tenantsFromApi.filter((t: any) =>
    getTenantDisplayName(t).toLowerCase().includes(search.toLowerCase()) ||
    (t.property || "").toLowerCase().includes(search.toLowerCase())
  );

  const closeTransactionModal = () => {
    setTransactionModalOpen(false);
    setPendingCash(null);
    setSelectedTenant(null);
  };

  const openTenantDetails = (tenant: any) => {
    setSelectedTenant(tenant);
    setPendingCash(null);
    setTransactionModalOpen(true);
  };

  const draftEditNames = [
    ...editTenantNames,
    ...(currentEditName.trim() ? [currentEditName.trim()] : []),
  ];

  const finalEditNames = Array.from(
    new Set(draftEditNames.map((name) => name.trim()).filter(Boolean))
  );

  const openEditTenantModal = () => {
    if (!selectedTenant) return;
    setEditTenantNames(normalizeTenantNames(selectedTenant.tenantName));
    setCurrentEditName("");
    setEditConfirmationOpen(false);
    setEditTenantOpen(true);
    setTransactionModalOpen(false);
  };

  const closeEditTenantModal = ({ reopenDetails = true }: { reopenDetails?: boolean } = {}) => {
    setEditTenantOpen(false);
    setEditConfirmationOpen(false);
    setEditTenantNames([]);
    setCurrentEditName("");

    if (reopenDetails && selectedTenant) {
      setTransactionModalOpen(true);
    }
  };

  const addEditName = () => {
    const trimmedName = currentEditName.trim();
    if (!trimmedName) return;
    setEditTenantNames((prev) => [...prev, trimmedName]);
    setCurrentEditName("");
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (finalEditNames.length === 0) return;
    setEditConfirmationOpen(true);
  };

  const confirmTenantEdit = () => {
    if (!selectedTenant || finalEditNames.length === 0) return;

    updateTenantMutation.mutate(
      {
        tenantId: selectedTenant._id,
        payload: { tenantName: finalEditNames },
      },
      {
        onSuccess: (res) => {
          const updatedTenant = res?.data ?? selectedTenant;
          setSelectedTenant(updatedTenant);
          closeEditTenantModal({ reopenDetails: false });
          setTransactionModalOpen(true);
        },
        onError: () => {
          setEditConfirmationOpen(false);
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-xl font-semibold">Tenants</h1>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full sm:w-72 md:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tenants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-800 bg-[#0c0c0c] py-2 pl-9 pr-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-700"
          />
        </div>

        <button
          onClick={() => setNewTenantOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-emerald-700 bg-transparent px-4 py-2 text-emerald-400 transition hover:bg-emerald-900/5 sm:w-auto md:ml-auto"
        >
          <Plus className="h-4 w-4 text-emerald-400" />
          <span className="text-sm">New Tenant</span>
        </button>
      </div>

      <div className="w-full overflow-x-auto rounded-2xl border border-[#1a1a1a] bg-[#0B0B0B]">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#151515] bg-[#0f0f0f] text-left text-gray-400">
              <th className="rounded-tl-2xl px-6 py-4 text-xs font-medium whitespace-nowrap md:text-sm">Tenant Name</th>
              <th className="px-6 py-4 text-xs font-medium whitespace-nowrap md:text-sm">Property</th>
              <th className="px-6 py-4 text-xs font-medium whitespace-nowrap md:text-sm">Rent</th>
              <th className="px-6 py-4 text-xs font-medium whitespace-nowrap md:text-sm">Status</th>
              <th className="rounded-tr-2xl px-6 py-4 text-xs font-medium whitespace-nowrap md:text-sm">Last Payment</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-400">Loading tenants...</td>
              </tr>
            )}

            {isError && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-rose-400">Failed to load tenants.</td>
              </tr>
            )}

            {!isLoading && !isError && filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-400">No tenants found.</td>
              </tr>
            )}

            {!isLoading && !isError && filtered.map((tenant: any) => (
              <tr
                key={tenant._id}
                onClick={() => openTenantDetails(tenant)}
                className="cursor-pointer border-t border-[#151515] transition hover:bg-[#0e0e0e]"
              >
                <td className="px-6 py-4 text-sm text-gray-300">{getTenantDisplayName(tenant)}</td>
                <td className="px-6 py-4 text-sm text-gray-300">{tenant.property}</td>
                <td className="px-6 py-4 text-sm text-gray-300">{typeof tenant.rent === "number" ? `£${tenant.rent}` : tenant.rent}</td>
                <td className="px-6 py-4 text-sm text-gray-300">
                  <span className={`rounded-full border px-2.5 py-1 text-xs ${statusColors[(tenant.status || "").charAt(0).toUpperCase() + (tenant.status || "").slice(1) as keyof typeof statusColors] || "bg-gray-800 text-gray-400"}`}>
                    {tenant.status?.charAt(0).toUpperCase() + tenant.status?.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-300">{formatDate(tenant.lastPayment)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {transactionModalOpen && selectedTenant && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 md:items-center md:p-6">
          <div style={{
          scrollbarWidth: 'none',
          }} className="my-4 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-gray-800 bg-[#0c0c0c] p-6 text-white shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">{getTenantDisplayName(selectedTenant)} — Transaction History</h3>
                <p className="text-sm text-gray-400">{selectedTenant.property}</p>
              </div>
              <button onClick={closeTransactionModal} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="w-full overflow-x-auto rounded-lg border border-[#1a1a1a] bg-[#0B0B0B]">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-[#151515] bg-[#0f0f0f] text-left text-gray-400">
                    <th className="px-4 py-3 text-xs">Month</th>
                    <th className="px-4 py-3 text-xs">Amount Due</th>
                    <th className="px-4 py-3 text-xs">Amount Paid</th>
                    <th className="px-4 py-3 text-xs">Paid On</th>
                    <th className="px-4 py-3 text-xs">Due Date</th>
                    <th className="px-4 py-3 text-xs">Status</th>
                    <th className="px-4 py-3 text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTenant.rentHistory?.length ? (
                    selectedTenant.rentHistory.map((entry: any, index: number) => (
                      <tr key={entry._id || index} className="border-t border-[#151515] hover:bg-[#0e0e0e]">
                        <td className="px-4 py-3 text-gray-300">{formatDate(entry.month)}</td>
                        <td className="px-4 py-3 text-gray-300">{typeof entry.amountDue === "number" ? `£${entry.amountDue}` : entry.amountDue}</td>
                        <td className={`px-4 py-3 ${entry.status === "unpaid" ? "text-rose-400" : "text-gray-300"}`}>£{entry.amountPaid ?? "—"}</td>
                        <td className="px-4 py-3 text-gray-300">{formatDate(entry.paidOn)}</td>
                        <td className="px-4 py-3 text-gray-300">{formatDate(entry.dueDate)}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full border px-2 py-1 text-xs ${statusColors[(entry.status || "").charAt(0).toUpperCase() + (entry.status || "").slice(1) as keyof typeof statusColors] || "bg-gray-800 text-gray-400"}`}>
                            {entry.status?.charAt(0).toUpperCase() + entry.status?.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {entry.status === "unpaid" ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setPendingCash({ index, entry });
                              }}
                              className="flex items-center gap-2 rounded-full border border-amber-700 px-3 py-1 text-xs text-amber-400 hover:bg-amber-900/5"
                            >
                              <DollarSign className="h-4 w-4" />
                              Pay By Cash
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">{entry.paymentMethod ? (entry.paymentMethod === "none" ? "—" : entry.paymentMethod) : "—"}</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-400">No rent history found for this tenant.</td>
                    </tr>
                  )}
                </tbody>
           
              </table>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                onClick={openEditTenantModal}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-700 px-4 py-2 text-sm text-emerald-300 hover:bg-[#0b1510]"
              >
                <Pencil className="h-4 w-4" />
                Edit tenant names
              </button>

              <div className="flex justify-end">
                <button onClick={closeTransactionModal} className="rounded-full border border-[#2A2A2A] px-4 py-2 text-sm text-gray-300 hover:bg-white/5">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {pendingCash && selectedTenant && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70">
          <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-[#0c0c0c] p-6 text-white shadow-xl">
            <h3 className="mb-2 text-lg font-semibold">Confirm Cash Payment</h3>
            <p className="mb-4 text-sm text-gray-400">Mark this rent as paid in <strong>cash</strong>?</p>

            <div className="mb-4 rounded-lg border border-[#111] bg-[#050505] p-3">
              <div className="flex justify-between text-sm text-gray-300">
                <div>Month</div>
                <div>{formatDate(pendingCash.entry.month)}</div>
              </div>
              <div className="flex justify-between text-sm text-gray-300">
                <div>Amount Due</div>
                <div>{typeof pendingCash.entry.amountDue === "number" ? `£${pendingCash.entry.amountDue}` : pendingCash.entry.amountDue}</div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setPendingCash(null)} className="rounded-full border px-4 py-2 text-sm text-gray-300 hover:bg-white/5">Cancel</button>
              <button
                onClick={() => {
                  const payload: any = { index: pendingCash.index };
                  if (pendingCash.entry.month) {
                    payload.month = new Date(pendingCash.entry.month).toISOString();
                  }

                  payByCashMutation.mutate(
                    { tenantId: selectedTenant._id, payload },
                    {
                      onSuccess: (res) => {
                        setPendingCash(null);
                        const updatedTenant = res?.data?.tenant || res?.tenant || null;
                        if (updatedTenant) setSelectedTenant(updatedTenant);
                      },
                    }
                  );
                }}
                className="rounded-full bg-amber-600 px-4 py-2 text-sm text-black hover:brightness-105"
              >
                Confirm Cash
              </button>
            </div>
          </div>
        </div>
      )}

      {editTenantOpen && selectedTenant && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70">
          <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-[#0c0c0c] p-6 text-white shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">Edit tenant names</h3>
                <p className="text-sm text-gray-400">{selectedTenant.property}</p>
              </div>
              <button onClick={() => closeEditTenantModal()} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-gray-200">Tenant name(s)</label>
                <div className="mb-2 flex gap-2">
                  <input
                    value={currentEditName}
                    onChange={(e) => setCurrentEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addEditName();
                      }
                    }}
                    className="flex-1 rounded-lg border border-[#2A2A2A] bg-transparent px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-700"
                    placeholder="Type a name and press Enter or click Add"
                  />
                  <button
                    type="button"
                    onClick={addEditName}
                    className="rounded-full border border-emerald-700 px-3 py-2 text-sm text-emerald-300 hover:bg-[#0b1510]"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {editTenantNames.map((name, index) => (
                    <div key={`${name}-${index}`} className="flex items-center gap-2 rounded-full border border-[#222] bg-[#0b0b0b] px-3 py-1 text-sm">
                      <span className="text-gray-200">{name}</span>
                      <button
                        type="button"
                        onClick={() => setEditTenantNames((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}
                        className="text-gray-400 hover:text-white"
                        aria-label={`Remove ${name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>

                {editTenantNames.length === 0 && !currentEditName.trim() && (
                  <p className="mt-2 text-xs text-amber-400">Add at least one tenant name before saving.</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => closeEditTenantModal()}
                  className="rounded-full border border-[#2A2A2A] px-4 py-2 text-sm text-gray-300 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={finalEditNames.length === 0}
                  className="rounded-full border border-emerald-700 px-4 py-2 text-sm text-emerald-300 hover:bg-[#0b1510] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editConfirmationOpen && selectedTenant && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75">
          <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-[#0c0c0c] p-6 text-white shadow-xl">
            <h3 className="mb-2 text-lg font-semibold">Confirm tenant update</h3>
            <p className="mb-4 text-sm text-gray-400">
              Save these tenant names for <span className="text-white">{selectedTenant.property}</span>?
            </p>

            <div className="mb-4 rounded-lg border border-[#111] bg-[#050505] p-3">
              <p className="mb-2 text-xs uppercase tracking-wide text-gray-500">Updated names</p>
              <div className="flex flex-wrap gap-2">
                {finalEditNames.map((name) => (
                  <span key={name} className="rounded-full border border-[#222] bg-[#0b0b0b] px-3 py-1 text-sm text-gray-200">
                    {name}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditConfirmationOpen(false)}
                className="rounded-full border px-4 py-2 text-sm text-gray-300 hover:bg-white/5"
              >
                Back
              </button>
              <button
                type="button"
                onClick={confirmTenantEdit}
                disabled={updateTenantMutation.isPending}
                className="rounded-full bg-emerald-500 px-4 py-2 text-sm text-black hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updateTenantMutation.isPending ? "Saving..." : "Confirm edit"}
              </button>
            </div>
          </div>
        </div>
      )}

      <NewTenantModal open={newTenantOpen} onClose={() => setNewTenantOpen(false)} />
    </div>
  );
}
