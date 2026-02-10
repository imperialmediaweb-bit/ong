"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FaqItem {
  question: string;
  answer: string;
}

export function FaqAccordion({
  items,
  primaryColor,
  primaryRgb,
}: {
  items: FaqItem[];
  primaryColor: string;
  primaryRgb: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {items.map((item, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div
            key={idx}
            className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 transition-all duration-300"
            style={isOpen ? { border: `1px solid rgba(${primaryRgb}, 0.2)` } : {}}
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : idx)}
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-gray-50/50"
            >
              <span className="text-base font-semibold text-gray-900">
                {item.question}
              </span>
              <ChevronDown
                className="h-5 w-5 shrink-0 text-gray-400 transition-transform duration-300"
                style={isOpen ? { transform: "rotate(180deg)", color: primaryColor } : {}}
              />
            </button>
            <div
              className="overflow-hidden transition-all duration-300"
              style={{
                maxHeight: isOpen ? "500px" : "0px",
                opacity: isOpen ? 1 : 0,
              }}
            >
              <div className="px-6 pb-5">
                <div
                  className="h-px w-full mb-4"
                  style={{ backgroundColor: `rgba(${primaryRgb}, 0.1)` }}
                />
                <p className="text-sm leading-relaxed text-gray-600">
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
