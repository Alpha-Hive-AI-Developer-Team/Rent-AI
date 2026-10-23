"use client";

import { useState, useMemo } from "react";
import ReferralCard from "@/components/admin/referral-card";
import ReferralGrowthChart from "@/components/admin/referral-chart";
import ReferralTable from "@/components/admin/referral-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAdminReferralsSummary, useAdminReferralsTrend, useAdminTopReferrers } from "@/hooks/useAdmin";

export default function ReferralRewardCenter() {
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;

  const filters = useMemo(() => ({
    status: statusFilter === "All" ? undefined : statusFilter,
    search: searchTerm || undefined,
    page,
    limit: pageSize,
  }), [statusFilter, searchTerm, page]);

  const { data, isLoading } = useAdminReferralsSummary(filters);
  const { data: topResp } = useAdminTopReferrers();

  const topReferrers = topResp?.data || [];
  const tableData = data?.data?.table || [];
  const total = data?.data?.total || 0;
  const currentPage = data?.data?.page || page;
  const { data: trendResp } = useAdminReferralsTrend();
  const trendData = trendResp?.data?.series || [];
  const trendPct = trendResp?.data?.trendPct || 0;

  const formatMoney = (cents: number) => `£${(Math.max(0, Math.round(cents || 0)) / 100).toFixed(2)}`;

  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
    setPage(1);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-black min-h-screen text-white space-y-6 sm:space-y-8 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-gray-800/60">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-[#027A48]/10 border border-[#027A48]/20 text-emerald-400 hidden sm:flex items-center justify-center">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Referral & Reward Center
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Track partner commissions, referral code velocity, and 14-day hold lifecycles
            </p>
          </div>
        </div>
      </div>

      {/* Top Referrers Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-300">
            Top Performing Partners
          </h2>
          <span className="text-xs text-gray-500">Ranked by total rewards</span>
        </div>

        {topReferrers.length === 0 ? (
          <div className="bg-[#111] border border-gray-800/70 rounded-2xl p-6 text-center text-xs text-gray-400">
            No top referrers recorded yet
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {topReferrers.map((partner: any, idx: any) => (
              <ReferralCard
                key={partner.id}
                name={partner.name}
                rank={idx + 1}
                earnings={formatMoney(partner.rewardCents)}
                hold={formatMoney(partner.holdCents)}
                available={formatMoney(partner.availableCents)}
                referrals={partner.referralsCount}
                referralCode={partner.referralCode}
              />
            ))}
          </div>
        )}
      </div>

      {/* Growth Chart */}
      <div className="w-full">
        <ReferralGrowthChart data={trendData} trendPct={trendPct} />
      </div>

      {/* Referrals Code Table */}
      <ReferralTable
        data={tableData}
        total={total}
        page={currentPage}
        pageSize={pageSize}
        statusFilter={statusFilter}
        searchTerm={searchTerm}
        onStatusChange={handleStatusChange}
        onSearch={handleSearch}
        onPageChange={handlePageChange}
      />
    </div>
  );
}

