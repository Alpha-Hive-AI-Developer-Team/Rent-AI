"use client";

import Image from "next/image";
import {Zap} from "lucide-react";

interface Feature {
  id: string;
  title: string;
  description: string;
  image: React.ReactNode;
}

export default function WhyChooseRentAI() {
  const features: Feature[] = [
    {
      id: "save-hours",
      title: "Save Hours Weekly",
      description:
        "Reclaim hours each week by eliminating manual reconciliation tasks.",
      image: <Image src="/images/box1.png" alt="Clock" width={32} height={32} />,
    },
    {
      id: "accuracy",
      title: "AI Accuracy",
      description:
        "Drastically reduce false omens flags with intelligent, self-learning AI.",
      image: <Image src="/images/box-4.png" alt="Zap" width={32} height={32} />,
    },
    {
      id: "network",
      title: "Scale Effortlessly",
      description:
        "Scale effortlessly to hundreds of tenants from one dashboard.",
      image: <Image src="/images/box-2.png" alt="Network" width={32} height={32} />,
    },
    {
      id: "learning",
      title: "Continuous Learning",
      description:
        "Continuously improves its accuracy by learning from your actions.",
      image: <Image src="/images/box-3.png" alt="Brain" width={32} height={32} />,
    },
  ];

  const StarDecoration = ({ className }: { className: string }) => (
    <svg
      className={className}
      width="4"
      height="4"
      viewBox="0 0 4 4"
      fill="none"
    >
      <circle cx="2" cy="2" r="2" fill="currentColor" />
    </svg>
  );

  return (
    <section className="bg-black text-white py-20 px-6">
      <div className="max-w-6xl mx-auto text-center">
        {/* Feature tag */}
        <p className="inline-block bg-green-300/20 text-[#027A48] px-4 py-1 rounded-full font-medium mb-3">
          Features
        </p>

        {/* Heading */}
        <h2 className="text-3xl md:text-5xl font-bold mb-4">
          WHY CHOOSE RENTAI?
        </h2>

        {/* Subheading */}
        <p className="text-[#CACACA] max-w-2xl mx-auto mb-16">
          RentAI handles reconciliation, arrear detection, and tenant
          communication — automatically.
        </p>

        <div className="relative w-full px-4 py-20 sm:py-32">
          {/* Background grid effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/0 via-slate-900/5 to-slate-900/0 pointer-events-none" />

          <div className="relative max-w-7xl mx-auto">
            {/* Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
              {/* Top Center - Save Hours Weekly */}
              <div className="md:col-start-2 md:col-span-1">
                <FeatureBox feature={features[0]} StarDecoration={StarDecoration} />
              </div>

              {/* Left - AI Accuracy */}
              <div className="md:row-start-2">
                <FeatureBox feature={features[1]} StarDecoration={StarDecoration} />
              </div>

              {/* Center - Scale Effortlessly */}
              <div className="md:col-start-2 md:row-start-2">
                <FeatureBox feature={features[2]} StarDecoration={StarDecoration} />
              </div>

              {/* Right - Continuous Learning */}
              <div className="md:col-start-3 md:row-start-2">
                <FeatureBox feature={features[3]} StarDecoration={StarDecoration} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureBox({
  feature,
  StarDecoration,
}: {
  feature: Feature;
  StarDecoration: React.FC<{ className: string }>;
}) {
  return (
    <div className="group relative flex flex-col items-center border border-slate-700 rounded-xl p-6">
      <div className="absolute -top-8 -left-12 text-slate-600">
        <StarDecoration className="w-1 h-1" />
      </div>

      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full border border-slate-700 bg-slate-900/40 backdrop-blur flex items-center justify-center">
          <div className="text-slate-400">{feature.image}</div>
        </div>
      </div>

      <div className="text-center">
        <h3 className="text-md font-semibold text-slate-300 mb-2 flex items-center justify-center gap-1">
          <span><Zap className="w-4 h-4"/></span> {feature.title}
        </h3>
        <p className="text-xs text-[#CACACA] leading-relaxed max-w-xs">
          {feature.description}
        </p>
      </div>
    </div>
  );
}
