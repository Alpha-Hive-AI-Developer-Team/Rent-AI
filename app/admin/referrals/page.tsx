"use client";

import ReferralCard from "@/components/admin/referral-card";
import ReferralGrowthChart from "@/components/admin/referral-chart";
import ReferralTable from "@/components/admin/referral-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function ReferralRewardCenter() {
  const partners = [
    {
      name: "John Smith",
      role: "Premium Partner",
      rank: 1,
      earnings: "$8,567",
      referrals: 124,
      imageSrc: "/images/johny.png",
    },
    {
      name: "Sarah Chen",
      role: "Premium Partner",
      rank: 2,
      earnings: "$8,567",
      referrals: 124,
      imageSrc: "/images/sara.png",
    },
    {
      name: "Will Chen",
      role: "Premium Partner",
      rank: 3,
      earnings: "$8,567",
      referrals: 124,
      imageSrc: "/images/will.png",
    },
  ];

  const tableData = [
    {
      code: "12345678",
      name: "Jhon Smith",
      status: "Active",
      reward: "$50",
      users: "124/200",
      created: "Mar 13, 2025",
      action: "Approved",
      image: "/images/johny.png",
    },
    {
      code: "12345678",
      name: "Sarah Chen",
      status: "Active",
      reward: "$123",
      users: "213/200",
      created: "Mar 13, 2025",
      action: "Approved",
      image: "/images/sara.png",
    },
    {
      code: "12345678",
      name: "Jack Bonds",
      status: "Expired",
      reward: "$567",
      users: "111/200",
      created: "Mar 13, 2025",
      action: "Renew",
      image: "/images/will.png",
    },
  ];

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
        <Button className="bg-[#027A48] hover:bg-green-700 text-white">
          <Plus className="w-4 h-4 mr-1" /> Create Referral Code
        </Button>
      </div>

      {/* Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {partners.map((partner) => (
          <ReferralCard key={partner.rank} {...partner} />
        ))}
      </div>

      {/* Chart */}
      <ReferralGrowthChart />

      {/* Table */}
      <ReferralTable data={tableData} />
    </div>
  );
}
