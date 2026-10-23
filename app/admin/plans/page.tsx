"use client";

import { useEffect, useMemo, useState } from "react";
import { useAdminPlans, useUpdateAdminPlan } from "@/hooks/useAdmin";
import type { AdminPlan } from "@/lib/api/adminApi";
import { toast } from "react-hot-toast";
import { Pencil, X } from "lucide-react";
import { withAuth } from "@/hooks/withAuth";

type EditForm = {
  title: string;
  description: string;
  featuresText: string;
  pricePounds: string;
  maxTenants: string;
  enabled: boolean;
  sortOrder: string;
  priceDisplay: string;
};

function planToForm(plan: AdminPlan): EditForm {
  return {
    title: plan.title || "",
    description: plan.description || "",
    featuresText: (plan.features || []).join("\n"),
    pricePounds: ((Number(plan.priceCents) || 0) / 100).toFixed(2),
    maxTenants: String(plan.maxTenants ?? 0),
    enabled: !!plan.enabled,
    sortOrder: String(plan.sortOrder ?? 0),
    priceDisplay: plan.priceDisplay || "",
  };
}

function AdminPlansPage() {
  const { data, isLoading, isError, refetch } = useAdminPlans();
  const updateMutation = useUpdateAdminPlan();
  const plans = data?.data || [];

  const [editing, setEditing] = useState<AdminPlan | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (editing) setForm(planToForm(editing));
    else setForm(null);
  }, [editing]);

  const priceChanging = useMemo(() => {
    if (!editing || !form || editing.isFree) return false;
    const nextCents = Math.round(Number(form.pricePounds) * 100);
    if (!Number.isFinite(nextCents)) return false;
    return nextCents !== Number(editing.priceCents || 0);
  }, [editing, form]);

  const openEdit = (plan: AdminPlan) => {
    setEditing(plan);
    setConfirmOpen(false);
  };

  const closeEdit = () => {
    if (updateMutation.isPending) return;
    setEditing(null);
    setConfirmOpen(false);
  };

  const buildPayload = () => {
    if (!editing || !form) return null;
    const features = form.featuresText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const priceCents = editing.isFree
      ? 0
      : Math.round(Number(form.pricePounds) * 100);
    if (!editing.isFree && (!Number.isFinite(priceCents) || priceCents < 0)) {
      toast.error("Enter a valid price");
      return null;
    }
    const maxTenants = Math.round(Number(form.maxTenants));
    if (!Number.isFinite(maxTenants) || maxTenants < 0) {
      toast.error("Enter a valid max tenants");
      return null;
    }
    return {
      title: form.title.trim(),
      description: form.description.trim(),
      features,
      priceCents,
      priceDisplay: form.priceDisplay.trim() || undefined,
      maxTenants,
      enabled: form.enabled,
      sortOrder: Math.round(Number(form.sortOrder) || 0),
    };
  };

  const submitUpdate = async () => {
    if (!editing) return;
    const payload = buildPayload();
    if (!payload) return;
    try {
      const res = await updateMutation.mutateAsync({ id: editing.id, payload });
      const mig = res.data?.migration;
      if (mig) {
        toast.success(
          `Plan updated. Migrated ${mig.migrated} subscriber(s)` +
            (mig.failed ? `, ${mig.failed} failed` : "") +
            ". Partner commissions stay locked."
        );
      } else {
        toast.success(res.message || "Plan updated");
      }
      setEditing(null);
      setConfirmOpen(false);
      refetch();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to update plan");
    }
  };

  const onSaveClick = () => {
    if (!editing || !form) return;
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (priceChanging) {
      setConfirmOpen(true);
      return;
    }
    void submitUpdate();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-black min-h-screen text-white space-y-6 sm:space-y-8 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-gray-800/60">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-[#027A48]/10 border border-[#027A48]/20 text-emerald-400 hidden sm:flex items-center justify-center">
            <Pencil className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Subscription Plans
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Configure pricing tiers, tenant limits, feature inclusions, and landlord availability
            </p>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="py-12 text-center text-gray-400 text-sm bg-[#111] border border-gray-800/70 rounded-2xl">
          Loading subscription tiers…
        </div>
      )}

      {isError && (
        <div className="p-6 text-center text-rose-400 bg-rose-950/20 border border-rose-900/40 rounded-2xl text-sm">
          Failed to load plans.{" "}
          <button
            type="button"
            className="underline hover:text-rose-300 ml-1 font-medium"
            onClick={() => refetch()}
          >
            Retry
          </button>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="space-y-4">
          {/* Mobile Card List (< sm) */}
          <div className="block sm:hidden space-y-3">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="bg-[#111] border border-gray-800/80 rounded-2xl p-4 space-y-3 shadow-md shadow-black/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-white text-base">
                      {plan.title}
                    </h3>
                    <p className="text-xs text-gray-400 capitalize mt-0.5">
                      {plan.key} Tier
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border shrink-0 ${
                      plan.enabled
                        ? "bg-emerald-950/40 border-emerald-700/40 text-emerald-400"
                        : "bg-rose-950/40 border-rose-800/40 text-rose-400"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        plan.enabled ? "bg-emerald-400" : "bg-rose-400"
                      }`}
                    />
                    {plan.enabled ? "Enabled" : "Disabled"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-gray-800/60">
                  <div>
                    <span className="text-[11px] text-gray-400 block">Price</span>
                    <span className="text-sm font-bold text-emerald-400 tabular-nums">
                      {plan.priceDisplay ||
                        `£${((plan.priceCents || 0) / 100).toFixed(2)} / mo`}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-400 block">
                      Max Tenants
                    </span>
                    <span className="text-sm font-semibold text-white">
                      {plan.maxTenants >= 1000000 ? "Unlimited" : plan.maxTenants}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-800/60 text-xs">
                  <span className="text-gray-400">
                    Active Subscribers:{" "}
                    <strong className="text-white font-semibold">
                      {plan.activeSubscribers ?? 0}
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => openEdit(plan)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-800 text-xs font-medium text-gray-200 hover:text-white hover:bg-white/5 active:scale-95 transition"
                  >
                    <Pencil className="w-3.5 h-3.5 text-emerald-400" />
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (>= sm) with Hidden Scrollbar */}
          <div className="hidden sm:block overflow-x-auto rounded-2xl border border-gray-800/80 bg-[#111] no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden shadow-md shadow-black/40">
            <table className="w-full text-left text-xs sm:text-sm min-w-[720px]">
              <thead>
                <tr className="bg-[#0c0c0c] border-b border-gray-800 text-gray-400 font-medium text-[11px] sm:text-xs uppercase tracking-wider">
                  <th className="px-4 py-3.5">Plan Tier</th>
                  <th className="px-4 py-3.5">Pricing</th>
                  <th className="px-4 py-3.5">Max Tenants</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Active Subs</th>
                  <th className="px-4 py-3.5">Stripe Price ID</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {plans.map((plan) => (
                  <tr
                    key={plan.id}
                    className="hover:bg-[#151515] transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-white">{plan.title}</div>
                      <div className="text-xs text-gray-500 capitalize">
                        {plan.key} Tier
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-emerald-400 tabular-nums">
                      {plan.priceDisplay ||
                        `£${((plan.priceCents || 0) / 100).toFixed(2)}`}
                    </td>
                    <td className="px-4 py-3.5 text-gray-300">
                      {plan.maxTenants >= 1000000 ? "Unlimited" : plan.maxTenants}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                          plan.enabled
                            ? "bg-emerald-950/40 border-emerald-700/40 text-emerald-400"
                            : "bg-rose-950/40 border-rose-800/40 text-rose-400"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            plan.enabled ? "bg-emerald-400" : "bg-rose-400"
                          }`}
                        />
                        {plan.enabled ? "Enabled" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-300 font-semibold tabular-nums">
                      {plan.activeSubscribers ?? 0}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-400 font-mono max-w-[140px] truncate">
                      {plan.isFree ? "—" : plan.stripePriceId || "—"}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(plan)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-gray-800 px-3 py-1.5 text-xs text-gray-200 hover:text-white hover:bg-white/5 active:scale-95 transition"
                      >
                        <Pencil className="w-3.5 h-3.5 text-emerald-400" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Plan Modal */}
      {editing && form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-2xl border border-gray-800 bg-[#111] p-6 text-white shadow-2xl relative no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800/80 mb-5">
              <div>
                <h3 className="text-base sm:text-lg font-semibold">
                  Edit Plan — {editing.title}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Update subscription tier settings and inclusions
                </p>
              </div>
              <button
                type="button"
                onClick={closeEdit}
                disabled={updateMutation.isPending}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Plan Display Title
                </label>
                <input
                  className="w-full rounded-xl border border-gray-800 bg-[#161616] px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#027A48] focus:ring-1 focus:ring-[#027A48] transition"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Plan Description
                </label>
                <textarea
                  className="w-full rounded-xl border border-gray-800 bg-[#161616] px-3.5 py-2.5 text-xs sm:text-sm text-white min-h-[72px] focus:outline-none focus:border-[#027A48] focus:ring-1 focus:ring-[#027A48] transition"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Features (one item per line)
                </label>
                <textarea
                  className="w-full rounded-xl border border-gray-800 bg-[#161616] px-3.5 py-2.5 text-xs font-mono text-gray-200 min-h-[100px] focus:outline-none focus:border-[#027A48] focus:ring-1 focus:ring-[#027A48] transition"
                  value={form.featuresText}
                  onChange={(e) =>
                    setForm({ ...form, featuresText: e.target.value })
                  }
                />
              </div>

              {!editing.isFree && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      Price (£ / month)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full rounded-xl border border-gray-800 bg-[#161616] px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#027A48] focus:ring-1 focus:ring-[#027A48] transition"
                      value={form.pricePounds}
                      onChange={(e) =>
                        setForm({ ...form, pricePounds: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      Display Label (optional)
                    </label>
                    <input
                      className="w-full rounded-xl border border-gray-800 bg-[#161616] px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#027A48] focus:ring-1 focus:ring-[#027A48] transition"
                      placeholder="e.g. £29"
                      value={form.priceDisplay}
                      onChange={(e) =>
                        setForm({ ...form, priceDisplay: e.target.value })
                      }
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Max Tenants Allowed
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full rounded-xl border border-gray-800 bg-[#161616] px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#027A48] focus:ring-1 focus:ring-[#027A48] transition"
                    value={form.maxTenants}
                    onChange={(e) =>
                      setForm({ ...form, maxTenants: e.target.value })
                    }
                  />
                  <span className="text-[10px] text-gray-500 mt-1 block">
                    Use 1000000+ for unlimited.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Display Sort Order
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-xl border border-gray-800 bg-[#161616] px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#027A48] focus:ring-1 focus:ring-[#027A48] transition"
                    value={form.sortOrder}
                    onChange={(e) =>
                      setForm({ ...form, sortOrder: e.target.value })
                    }
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-[#161616] border border-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={(e) =>
                    setForm({ ...form, enabled: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-600 accent-[#027A48]"
                />
                <span className="text-xs sm:text-sm text-gray-200">
                  Enable plan for landlords (visible in pricing tier picker)
                </span>
              </label>

              {editing.isFree && (
                <p className="text-xs text-gray-400 bg-white/5 p-3 rounded-xl border border-gray-800">
                  Free plan does not require a Stripe price ID. Features and limits can be modified freely.
                </p>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-800/80 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeEdit}
                disabled={updateMutation.isPending}
                className="px-4 py-2 rounded-xl border border-gray-800 text-xs sm:text-sm text-gray-300 hover:bg-white/5 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onSaveClick}
                disabled={updateMutation.isPending}
                className="px-5 py-2 rounded-xl bg-[#027A48] text-xs sm:text-sm font-medium text-white hover:bg-[#02653d] active:scale-95 transition disabled:opacity-50"
              >
                {updateMutation.isPending ? "Saving Changes…" : "Save Plan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Price Change Confirmation */}
      {confirmOpen && editing && form && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-amber-900/60 bg-[#14100c] p-6 text-white shadow-2xl relative">
            <h3 className="text-base sm:text-lg font-semibold text-amber-300">
              Confirm Subscription Price Change
            </h3>
            <p className="mt-3 text-xs sm:text-sm text-gray-300 leading-relaxed">
              You are updating the base monthly price of{" "}
              <strong className="text-white">{editing.title}</strong> from{" "}
              <span className="text-white font-mono">
                £{((editing.priceCents || 0) / 100).toFixed(2)}
              </span>{" "}
              to{" "}
              <span className="text-emerald-400 font-mono font-semibold">
                £{Number(form.pricePounds).toFixed(2)}
              </span>
              .
            </p>
            <p className="mt-2 text-xs sm:text-sm text-amber-200/90 bg-amber-950/30 p-3 rounded-xl border border-amber-900/40 leading-relaxed">
              All {editing.activeSubscribers ?? 0} active subscribers on this tier
              will be billed the new rate on their next renewal cycle. Locked partner
              referral commissions remain unchanged.
            </p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={updateMutation.isPending}
                className="px-4 py-2 rounded-xl border border-gray-800 text-xs sm:text-sm text-gray-300 hover:bg-white/5 transition"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => void submitUpdate()}
                disabled={updateMutation.isPending}
                className="px-5 py-2 rounded-xl bg-amber-700 hover:bg-amber-600 text-xs sm:text-sm font-medium text-white active:scale-95 transition disabled:opacity-50"
              >
                {updateMutation.isPending ? "Updating…" : "Confirm & Update Price"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAuth(AdminPlansPage, ["superAdmin"]);

