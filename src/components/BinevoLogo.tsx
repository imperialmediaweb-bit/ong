/**
 * Binevo Logo Component
 * Heart gradient logo with "Binevo" text
 * Used across the platform: header, footer, invoices, etc.
 */

interface BinevoLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
  textColor?: string;
}

const sizes = {
  sm: { icon: 24, text: "text-lg", gap: "gap-1.5" },
  md: { icon: 32, text: "text-xl", gap: "gap-2" },
  lg: { icon: 40, text: "text-2xl", gap: "gap-2.5" },
  xl: { icon: 56, text: "text-4xl", gap: "gap-3" },
};

export function BinevoLogo({
  size = "md",
  showText = true,
  className = "",
  textColor,
}: BinevoLogoProps) {
  const s = sizes[size];

  return (
    <span className={`inline-flex items-center ${s.gap} ${className}`}>
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="binevo-heart-gradient" x1="0" y1="32" x2="64" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#22B8FF" />
            <stop offset="50%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#A855F7" />
          </linearGradient>
        </defs>
        {/* Heart outline */}
        <path
          d="M32 56C32 56 8 40 8 22C8 14 14 8 22 8C26.4 8 30.4 10.4 32 14C33.6 10.4 37.6 8 42 8C50 8 56 14 56 22C56 40 32 56 32 56Z"
          stroke="url(#binevo-heart-gradient)"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      {showText && (
        <span
          className={`${s.text} font-bold ${
            textColor || "bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent"
          }`}
        >
          Binevo
        </span>
      )}
    </span>
  );
}

/**
 * Binevo Logo for invoices/PDF - plain HTML version (no React hooks)
 * Returns an HTML string suitable for embedding in invoice templates
 */
export function getBinevoLogoHtml(width: number = 120): string {
  return `
    <div style="display:inline-flex;align-items:center;gap:8px;">
      <svg width="${width * 0.4}" height="${width * 0.4}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="hg" x1="0" y1="32" x2="64" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#22B8FF"/>
            <stop offset="50%" stop-color="#6366F1"/>
            <stop offset="100%" stop-color="#A855F7"/>
          </linearGradient>
        </defs>
        <path d="M32 56C32 56 8 40 8 22C8 14 14 8 22 8C26.4 8 30.4 10.4 32 14C33.6 10.4 37.6 8 42 8C50 8 56 14 56 22C56 40 32 56 32 56Z" stroke="url(#hg)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </svg>
      <span style="font-size:${width * 0.22}px;font-weight:700;background:linear-gradient(90deg,#3B82F6,#6366F1,#A855F7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">Binevo</span>
    </div>
  `;
}
