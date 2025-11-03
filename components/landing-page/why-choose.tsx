"use client";

import Image from "next/image";
import { Zap } from "lucide-react";

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
      image: (
        <Image src="/images/box1.png" alt="Clock" width={32} height={32} />
      ),
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
      image: (
        <Image src="/images/box-2.png" alt="Network" width={32} height={32} />
      ),
    },
    {
      id: "learning",
      title: "Continuous Learning",
      description:
        "Continuously improves its accuracy by learning from your actions.",
      image: (
        <Image src="/images/box-3.png" alt="Brain" width={32} height={32} />
      ),
    },
  ];

  return (
    <section className="bg-black text-white py-20 px-4 sm:px-6 md:px-8" id="how">
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

        {/* Main layout container */}
        <div className="relative flex flex-col items-center justify-center gap-6">
          {/* Top Box */}
          <div className="w-full max-w-sm">
            <FeatureBox feature={features[0]} />
          </div>

          {/* Middle row with left, center, right */}
          <div className="flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-28 w-full">
            <div className="w-full max-w-sm">
              <FeatureBox feature={features[1]} />
            </div>

            {/* Center circle with chess */}
            <div className="flex items-center justify-center my-6 lg:my-0">
              <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-44 md:h-44 rounded-full bg-[#111111] border border-[#2A2A2A] flex items-center justify-center">
                <Image
                  src="/images/logo-transparent.png"
                  alt="Chess"
                  width={96}
                  height={96}
                  className="opacity-90"
                />
              </div>
            </div>

            <div className="w-full max-w-sm">
              <FeatureBox feature={features[2]} />
            </div>
          </div>

          {/* Bottom Box */}
          <div className="w-full max-w-sm">
            <FeatureBox feature={features[3]} />
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureBox({ feature }: { feature: Feature }) {
  return (
    <div className="bg-[#0f0f0f] border border-slate-800 rounded-2xl p-10 sm:p-12 md:p-14 flex flex-col items-center text-center hover:border-slate-600 transition">
      <div className="w-16 h-16 flex items-center justify-center border border-slate-800 rounded-full bg-[#181818] mb-4">
        {feature.image}
      </div>
      <h3 className="text-base font-semibold text-slate-100 flex items-center justify-center gap-1 mb-2">
        <Zap className="w-4 h-4 text-white" /> {feature.title}
      </h3>
      <p className="text-sm text-[#A3A3A3] leading-relaxed">
        {feature.description}
      </p>
    </div>
  );
}
