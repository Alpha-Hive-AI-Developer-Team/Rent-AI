"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function PopularQueries() {
  const [openIndex, setOpenIndex] = useState<number | null>(0); // default open "How do I get started?"

  const queries = [
    {
      question: "Can I upgrade my plan later?",
      answer:
        "Yes, you can upgrade your plan anytime from your dashboard. Your new features will be available immediately after the upgrade.",
    },
    {
      question: "Is there a free trial available?",
      answer:
        "Absolutely! You can start with a free trial to explore RentAI and see how it fits your workflow before committing.",
    },
    {
      question: "How do I get started?",
      answer:
        "Getting started is easy — just sign up, follow our guided onboarding steps, and you'll be ready to explore all features within minutes, no tech skills needed.",
    },
    {
      question: "Do I need to install any software?",
      answer:
        "No installation required. RentAI runs directly in your browser and works across all modern devices.",
    },
    {
      question: "How secure is my data?",
      answer:
        "Your data is encrypted end-to-end and stored securely using industry-leading security protocols.",
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer:
        "Yes, you can cancel your subscription anytime without penalties. You’ll continue to have access until your current billing period ends.",
    },
  ];

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="bg-black text-white py-20 px-6" id="about">
      <div className="max-w-4xl mx-auto text-center mb-14">
        {/* Green pill */}
          <p className="inline-block bg-green-300/20 text-[#027A48] px-4 py-1 rounded-full font-medium mb-3">
          Features
        </p>


        {/* Heading */}
        <h2 className="text-3xl md:text-5xl font-bold mb-4">Popular Queries</h2>

        {/* Subheading */}
        <p className="text-[#CACACA] max-w-2xl mx-auto">
          From strategy to execution, we’re trusted to deliver outcomes that make a difference.
        </p>
      </div>

      {/* Accordion List */}
      <div className="max-w-6xl mx-auto divide-y divide-gray-800 border-t border-b border-gray-800">
        {queries.map((item, index) => (
          <div key={index}>
            <button
              onClick={() => toggleAccordion(index)}
              className="w-full flex justify-between items-center py-5 text-left text-base md:text-lg font-medium hover:text-green-400 transition"
            >
              {item.question}
              <ChevronDown
                className={`w-5 h-5 transform transition-transform duration-300 ${
                  openIndex === index ? "rotate-180 text-green-400" : ""
                }`}
              />
            </button>

            {/* Answer */}
            <div
              className={`overflow-hidden transition-all duration-500 ${
                openIndex === index ? "max-h-40 mb-5" : "max-h-0"
              }`}
            >
              <p className="text-gray-400 text-sm md:text-base leading-relaxed px-1">
                {item.answer}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
