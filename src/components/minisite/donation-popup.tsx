"use client";

import { useState, useEffect } from "react";
import { X, Heart } from "lucide-react";

export function DonationPopup({
  delay,
  text,
  ngoSlug,
  primaryColor,
  accentColor,
  primaryRgb,
  accentRgb,
}: {
  delay: number;
  text: string;
  ngoSlug: string;
  primaryColor: string;
  accentColor: string;
  primaryRgb: string;
  accentRgb: string;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed this session
    const dismissed = sessionStorage.getItem(`popup-dismissed-${ngoSlug}`);
    if (dismissed) return;

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, (delay || 15) * 1000);

    return () => clearTimeout(timer);
  }, [delay, ngoSlug]);

  const dismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
    sessionStorage.setItem(`popup-dismissed-${ngoSlug}`, "1");
  };

  if (!isVisible || isDismissed) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={dismiss}
      />

      {/* Popup */}
      <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-300 overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Top gradient */}
        <div
          className="h-2"
          style={{ background: `linear-gradient(90deg, ${primaryColor}, ${accentColor})` }}
        />

        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute right-4 top-6 rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-8 text-center">
          {/* Icon */}
          <div
            className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: `linear-gradient(135deg, rgba(${primaryRgb}, 0.15), rgba(${accentRgb}, 0.15))` }}
          >
            <Heart className="h-8 w-8" style={{ color: primaryColor }} />
          </div>

          <h3 className="text-xl font-bold text-gray-900">
            Sustine cauza noastra
          </h3>

          <p className="mt-3 text-sm leading-relaxed text-gray-500">
            {text || "Fiecare donatie conteaza si face o diferenta reala in viata celor care au nevoie. Alatura-te comunitatii noastre de sustinatori!"}
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <a
              href="#donatie"
              onClick={dismiss}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                boxShadow: `0 4px 14px rgba(${primaryRgb}, 0.3)`,
              }}
            >
              <Heart className="h-4 w-4" />
              Doneaza acum
            </a>

            <button
              onClick={dismiss}
              className="text-sm font-medium text-gray-400 transition-colors hover:text-gray-600"
            >
              Poate mai tarziu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
