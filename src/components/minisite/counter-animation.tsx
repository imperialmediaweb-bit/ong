"use client";

import { useState, useEffect, useRef } from "react";

interface CounterStat {
  label: string;
  value: number;
  suffix?: string;
}

function AnimatedNumber({ value, suffix }: { value: number; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const duration = 2000;
          const steps = 60;
          const increment = value / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= value) {
              setDisplayValue(value);
              clearInterval(timer);
            } else {
              setDisplayValue(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [value, hasAnimated]);

  return (
    <div ref={ref} className="tabular-nums">
      {displayValue.toLocaleString("ro-RO")}
      {suffix && <span>{suffix}</span>}
    </div>
  );
}

export function CounterAnimation({
  stats,
  primaryColor,
  accentColor,
  primaryRgb,
  accentRgb,
}: {
  stats: CounterStat[];
  primaryColor: string;
  accentColor: string;
  primaryRgb: string;
  accentRgb: string;
}) {
  const colors = [primaryColor, accentColor, primaryColor, accentColor];
  const rgbs = [primaryRgb, accentRgb, primaryRgb, accentRgb];

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, idx) => (
        <div
          key={idx}
          className="group overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-8"
        >
          <div
            className="text-4xl font-extrabold sm:text-5xl"
            style={{ color: colors[idx % colors.length] }}
          >
            <AnimatedNumber value={stat.value} suffix={stat.suffix} />
          </div>
          <p className="mt-3 text-sm font-medium text-gray-500">
            {stat.label}
          </p>
          <div
            className="mx-auto mt-4 h-1 w-12 rounded-full transition-all duration-300 group-hover:w-20"
            style={{ backgroundColor: `rgba(${rgbs[idx % rgbs.length]}, 0.3)` }}
          />
        </div>
      ))}
    </div>
  );
}
