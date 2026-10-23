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
    <div className="p-6 bg-black min-h-screen text-white">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div>
          <h2 className="text-xl font-semibold">Subscription Plans</h2>
          <p className="text-[#535862] text-sm">
            Edit plan name, price, description, features, and availability. Disabled plans are hidden
            from landlords and cannot be purchased.
          </p>
        </div>
      </div>

      {isLoading && <p className="text-sm text-gray-400">Loading plans…</p>}
      {isError && (
        <p className="text-sm text-rose-400">
          Failed to load plans.{" "}
          <button type="button" className="underline" onClick={() => refetch()}>
            Retry
          </button>
        </p>
      )}

      {!isLoading && !isError && (
        <div className="overflow-x-auto rounded-2xl border border-[#2A2A2A]">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-gray-400 text-xs border-b border-[#2A2A2A] bg-[#0c0c0c]">
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Max tenants</th>
                <th className="px-4 py-3">Enabled</th>
                <th className="px-4 py-3">Active subs</th>
                <th className="px-4 py-3">Stripe price</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a]">
              {plans.map((plan) => (
                <tr key={plan.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{plan.title}</div>
                    <div className="text-xs text-gray-500 capitalize">{plan.key}</div>
                  </td>
                  <td className="px-4 py-3 text-emerald-300">
                    {plan.priceDisplay || `£${((plan.priceCents || 0) / 100).toFixed(2)}`}
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    {plan.maxTenants >= 1000000 ? "Unlimited" : plan.maxTenants}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs border ${
                        plan.enabled
                          ? "border-emerald-700 text-emerald-300"
                          : "border-rose-800 text-rose-300"
                      }`}
                    >
                      {plan.enabled ? "Enabled" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-300">{plan.activeSubscribers ?? 0}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 font-mono max-w-[140px] truncate">
                    {plan.isFree ? "—" : plan.stripePriceId || "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(plan)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#2A2A2A] px-3 py-1.5 text-xs text-gray-200 hover:border-emerald-700/60"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-800 bg-[#0c0c0c] p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit {editing.title}</h3>
              <button
                type="button"
                onClick={closeEdit}
                disabled={updateMutation.isPending}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <label className="block text-sm">
                <span className="text-gray-400">Name</span>
                <input
                  className="mt-1 w-full rounded-xl border border-[#2A2A2A] bg-black px-3 py-2 text-white"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </label>

              <label className="block text-sm">
                <span className="text-gray-400">Description</span>
                <textarea
                  className="mt-1 w-full rounded-xl border border-[#2A2A2A] bg-black px-3 py-2 text-white min-h-[72px]"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </label>

              <label className="block text-sm">
                <span className="text-gray-400">Features (one per line)</span>
                <textarea
                  className="mt-1 w-full rounded-xl border border-[#2A2A2A] bg-black px-3 py-2 text-white min-h-[100px] font-mono text-xs"
                  value={form.featuresText}
                  onChange={(e) => setForm({ ...form, featuresText: e.target.value })}
                />
              </label>

              {!editing.isFree && (
                <>
                  <label className="block text-sm">
                    <span className="text-gray-400">Price (£ / month)</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="mt-1 w-full rounded-xl border border-[#2A2A2A] bg-black px-3 py-2 text-white"
                      value={form.pricePounds}
                      onChange={(e) => setForm({ ...form, pricePounds: e.target.value })}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="text-gray-400">Display label (optional)</span>
                    <input
                      className="mt-1 w-full rounded-xl border border-[#2A2A2A] bg-black px-3 py-2 text-white"
                      placeholder="e.g. £29"
                      value={form.priceDisplay}
                      onChange={(e) => setForm({ ...form, priceDisplay: e.target.value })}
                    />
                  </label>
                </>
              )}

              <label className="block text-sm">
                <span className="text-gray-400">Max tenants</span>
                <input
                  type="number"
                  min="0"
                  className="mt-1 w-full rounded-xl border border-[#2A2A2A] bg-black px-3 py-2 text-white"
                  value={form.maxTenants}
                  onChange={(e) => setForm({ ...form, maxTenants: e.target.value })}
                />
                <span className="text-xs text-gray-500">Use a very large number for unlimited.</span>
              </label>

              <label className="block text-sm">
                <span className="text-gray-400">Sort order</span>
                <input
                  type="number"
                  className="mt-1 w-full rounded-xl border border-[#2A2A2A] bg-black px-3 py-2 text-white"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                />
              </label>

              <label className="flex items-center gap-3 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-600"
                />
                <span>Enabled for landlords (purchasable / visible)</span>
              </label>

              {editing.isFree && (
                <p className="text-xs text-gray-500">
                  Free plan has no Stripe price. Content and tenant limits can still be edited.
                </p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeEdit}
                disabled={updateMutation.isPending}
                className="px-4 py-2 rounded-full border border-[#2A2A2A] text-sm text-gray-300 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onSaveClick}
                disabled={updateMutation.isPending}
                className="px-4 py-2 rounded-full border border-emerald-600 text-sm text-emerald-300 hover:bg-emerald-900/20 disabled:opacity-50"
              >
                {updateMutation.isPending ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmOpen && editing && form && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-2xl border border-amber-900/50 bg-[#120c08] p-6 text-white">
            <h3 className="text-lg font-semibold text-amber-200">Confirm price change</h3>
            <p className="mt-3 text-sm text-gray-300">
              You are changing <span className="text-white">{editing.title}</span> from{" "}
              <span className="text-white">
                £{((editing.priceCents || 0) / 100).toFixed(2)}
              </span>{" "}
              to <span className="text-white">£{Number(form.pricePounds).toFixed(2)}</span>.
            </p>
            <p className="mt-2 text-sm text-gray-300">
              <strong className="text-amber-200">
                All {editing.activeSubscribers ?? 0} current subscriber(s) on this plan will be
                charged the new amount on their next renewal.
              </strong>{" "}
              This period’s already-paid invoice is not recharged. Partner commissions for existing
              referrals stay at their locked amounts.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={updateMutation.isPending}
                className="px-4 py-2 rounded-full border border-[#2A2A2A] text-sm text-gray-300"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => void submitUpdate()}
                disabled={updateMutation.isPending}
                className="px-4 py-2 rounded-full border border-amber-600 text-sm text-amber-200 hover:bg-amber-950/40 disabled:opacity-50"
              >
                {updateMutation.isPending ? "Updating…" : "Confirm & update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAuth(AdminPlansPage, ["superAdmin"]);
