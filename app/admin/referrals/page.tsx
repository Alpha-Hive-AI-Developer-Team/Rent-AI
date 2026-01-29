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
    <div className="p-6 bg-black min-h-screen text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div>
          <h2 className="text-xl font-semibold">Referral & Reward Center</h2>
          <p className="text-[#535862] text-sm">
            Monitor all tenants across the platform
          </p>
        </div>
        {/* <Button className="bg-[#027A48] hover:bg-green-700 text-white">
          <Plus className="w-4 h-4 mr-1" /> Create Referral Code
        </Button> */}
      </div>

      {/* Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {topReferrers.map((partner:any, idx:any) => (
          <ReferralCard
            key={partner.id}
            name={partner.name}
            rank={idx + 1}
            earnings={formatMoney(partner.rewardCents)}
            referrals={partner.referralsCount}
            referralCode={partner.referralCode}
          />
        ))}
      </div>

      {/* Chart */}
      <ReferralGrowthChart data={trendData} trendPct={trendPct} />

      {/* Table */}
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
