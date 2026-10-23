"use client";

import React, { useState } from "react";
import {
  Copy,
  Check,
  Share2,
  Mail,
  MessageCircle,
  Linkedin,
  ExternalLink,
  ShieldCheck,
  Percent,
  Clock,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";

import { resolveReferralLink } from "@/lib/utils/referralLink";
import { buildReferralShareUrls, openShareUrl } from "@/lib/utils/referralShare";

type ReferCustomerViewProps = {
  referralCode?: string;
  referralLink?: string;
  onOpenHelp?: () => void;
};

export default function ReferCustomerView({
  referralCode = "PARTNER10",
  referralLink,
  onOpenHelp,
}: ReferCustomerViewProps) {
  const effectiveLink = resolveReferralLink(referralLink, referralCode);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(effectiveLink);
      setCopiedLink(true);
      toast.success("Referral link copied to clipboard!");
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopiedCode(true);
      toast.success("Referral code copied to clipboard!");
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      toast.error("Failed to copy code");
    }
  };

  const landlordTemplate = `Hi,

I recommend checking out Rent AI to manage your rental collections. It automatically syncs bank payments, matches rent, and handles arrears without manual spreadsheets.

You can sign up directly here:
${effectiveLink}

Use partner code "${referralCode}" to lock in the standard £299/mo rate.`;

  const propertyManagerTemplate = `Hey,

If you're managing multiple rental properties and want automated rent collection tracking and bank reconciliation, Rent AI is built specifically for UK landlords and property managers:
${effectiveLink}

Referral code: ${referralCode}`;

  const handleCopyTemplate = async (template: string, id: string) => {
    try {
      await navigator.clipboard.writeText(template);
      setCopiedTemplate(id);
      toast.success("Message template copied!");
      setTimeout(() => setCopiedTemplate(null), 2000);
    } catch {
      toast.error("Failed to copy template");
    }
  };

  const shareUrls = buildReferralShareUrls(effectiveLink, referralCode);

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-white">Refer a Customer & Earn Recurring Commission</h1>
        <p className="text-xs md:text-sm text-[#535862] mt-1">
          Share your partner link or referral code with landlords and property managers. Earn 10% monthly recurring
          commission for every active paying subscriber.
        </p>
      </div>

      {/* 2-Column Desktop Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Link Generator & Outreach Templates */}
        <div className="lg:col-span-7 space-y-6">
          {/* Referral Link & Code Box */}
          <div className="bg-[#111] border border-gray-800/50 rounded-xl p-4 md:p-6 space-y-4 shadow-md">
            <h2 className="text-sm md:text-base font-medium text-gray-200">Your Referral Credentials</h2>

            {/* Link */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-300 font-medium">Unique Referral Link</label>
              <div className="flex items-center gap-2 bg-[#0c0c0c] border border-gray-800 rounded-lg px-3 py-2">
                <span className="text-xs text-gray-200 truncate flex-1 font-normal select-all">{effectiveLink}</span>
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 text-xs font-medium rounded-md bg-[#027A48] hover:bg-green-700 text-white transition flex items-center gap-1.5 shadow-sm"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedLink ? "Copied" : "Copy Link"}
                </button>
              </div>
            </div>

            {/* Code */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-300 font-medium">Partner Referral Code</label>
              <div className="flex items-center justify-between bg-[#0c0c0c] border border-gray-800 rounded-lg px-3 py-2">
                <span className="text-sm font-semibold text-white tracking-wider select-all">{referralCode}</span>
                <button
                  onClick={handleCopyCode}
                  className="px-3 py-1.5 text-xs font-medium rounded-md bg-[#1a1a1a] hover:bg-[#252525] text-gray-200 transition flex items-center gap-1.5"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCode ? "Copied" : "Copy Code"}
                </button>
              </div>
            </div>

            {/* Social Share Buttons */}
            <div className="pt-2">
              <label className="text-xs text-gray-400 block mb-2">Direct Share</label>
              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => openShareUrl(shareUrls.whatsapp)}
                  className="px-3.5 py-2 rounded-lg bg-[#0c0c0c] hover:bg-[#1a1a1a] border border-gray-800 text-xs font-medium text-gray-300 flex items-center gap-2 transition"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400" /> WhatsApp
                </button>

                <button
                  type="button"
                  onClick={() => openShareUrl(shareUrls.linkedin)}
                  className="px-3.5 py-2 rounded-lg bg-[#0c0c0c] hover:bg-[#1a1a1a] border border-gray-800 text-xs font-medium text-gray-300 flex items-center gap-2 transition"
                >
                  <Linkedin className="w-4 h-4 text-sky-400" /> LinkedIn
                </button>

                <button
                  type="button"
                  onClick={() => openShareUrl(shareUrls.x)}
                  className="px-3.5 py-2 rounded-lg bg-[#0c0c0c] hover:bg-[#1a1a1a] border border-gray-800 text-xs font-medium text-gray-300 flex items-center gap-2 transition"
                >
                  𝕏 Post
                </button>

                <button
                  type="button"
                  onClick={() => openShareUrl(shareUrls.email)}
                  className="px-3.5 py-2 rounded-lg bg-[#0c0c0c] hover:bg-[#1a1a1a] border border-gray-800 text-xs font-medium text-gray-300 flex items-center gap-2 transition"
                >
                  <Mail className="w-4 h-4 text-gray-400" /> Email
                </button>
              </div>
            </div>
          </div>

          {/* Outreach Templates */}
          <div className="bg-[#111] border border-gray-800/50 rounded-xl p-4 md:p-6 space-y-4 shadow-md">
            <div className="flex items-center justify-between">
              <h2 className="text-sm md:text-base font-medium text-gray-200">Pre-Written Outreach Templates</h2>
              <span className="text-xs text-gray-500">Copy & customize</span>
            </div>

            {/* Template 1: Landlord */}
            <div className="p-3.5 rounded-lg bg-[#0c0c0c] border border-gray-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-200">For Landlords & Property Owners</span>
                <button
                  onClick={() => handleCopyTemplate(landlordTemplate, "landlord")}
                  className="px-2.5 py-1 text-xs font-medium rounded bg-[#1a1a1a] hover:bg-[#252525] text-gray-300 flex items-center gap-1.5 transition"
                >
                  {copiedTemplate === "landlord" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copiedTemplate === "landlord" ? "Copied" : "Copy Template"}
                </button>
              </div>
              <p className="text-xs text-gray-300 whitespace-pre-line leading-relaxed bg-[#111] p-3.5 rounded-lg border border-gray-800/60 font-normal">
                {landlordTemplate}
              </p>
            </div>

            {/* Template 2: Property Manager */}
            <div className="p-3.5 rounded-lg bg-[#0c0c0c] border border-gray-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-200">For Property Managers & Letting Agents</span>
                <button
                  onClick={() => handleCopyTemplate(propertyManagerTemplate, "pm")}
                  className="px-2.5 py-1 text-xs font-medium rounded bg-[#1a1a1a] hover:bg-[#252525] text-gray-300 flex items-center gap-1.5 transition"
                >
                  {copiedTemplate === "pm" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copiedTemplate === "pm" ? "Copied" : "Copy Template"}
                </button>
              </div>
              <p className="text-xs text-gray-300 whitespace-pre-line leading-relaxed bg-[#111] p-3.5 rounded-lg border border-gray-800/60 font-normal">
                {propertyManagerTemplate}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Programme Economics & Guidelines */}
        <div className="lg:col-span-5 space-y-4">
          {/* Economics Card */}
          <div className="bg-[#111] border border-gray-800/50 rounded-xl p-4 md:p-6 space-y-4 shadow-md">
            <h2 className="text-sm md:text-base font-medium text-gray-200">Partner Programme Economics</h2>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-md bg-[#161616] border border-gray-800 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                  <Percent className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-semibold text-white">10% Recurring Commission</p>
                  <p className="text-gray-400 mt-0.5 leading-relaxed">
                    At today&apos;s £299/month subscription price, earn <strong className="text-gray-200">£29.90 every month</strong> for each active customer.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-md bg-[#161616] border border-gray-800 flex items-center justify-center text-gray-300 shrink-0 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-semibold text-white">Price Grandfathering</p>
                  <p className="text-gray-400 mt-0.5 leading-relaxed">
                    Your monthly commission amount is permanently locked to the introduction price. Future price changes will not reduce your historical earnings.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-md bg-[#161616] border border-gray-800 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-semibold text-white">14-Day Anti-Refund Period</p>
                  <p className="text-gray-400 mt-0.5 leading-relaxed">
                    New referrals qualify 14 days after payment, safeguarding against trial cancellations and refunds.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Rules Card */}
          <div className="bg-[#111] border border-gray-800/50 rounded-xl p-4 md:p-6 space-y-4 shadow-md">
            <h2 className="text-sm md:text-base font-medium text-gray-200">Core Programme Rules</h2>
            <ul className="space-y-2.5 text-xs text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span className="leading-relaxed">
                  <strong className="text-gray-300">60-Day Activity Requirement:</strong> Introduce at least 1 new paying customer every 60 days to keep your portfolio protected.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span className="leading-relaxed">
                  <strong className="text-gray-300">Oldest Referral Forfeiture:</strong> If 60 days elapse without a qualifying referral, 1 existing customer is permanently removed.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span className="leading-relaxed">
                  <strong className="text-gray-300">Anti-Recycling Protection:</strong> Customers cannot cancel and re-subscribe with the same partner code.
                </span>
              </li>
            </ul>

            {onOpenHelp && (
              <div className="pt-2 border-t border-gray-800">
                <button
                  onClick={onOpenHelp}
                  className="text-xs text-[#027A48] hover:underline font-medium flex items-center gap-1"
                >
                  Read full documentation & FAQ <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
