import { cn } from "@/lib/utils";

/**
 * DRFT mark + wordmark, rebuilt from the Figma logo as one SVG so it scales as a
 * unit (header 114px wide, footer ~100px). The wordmark uses Manrope via the
 * font variable, so it renders as real text, not outlines. Give each instance
 * on a page its own `id`: gradient ids must be unique, and a reference into a
 * hidden copy renders nothing.
 */
export function Logo({
  id = "drft-logo",
  className,
  tone = "dark",
}: {
  id?: string;
  className?: string;
  /** "light" for dark backgrounds (the admin sidebar): light wordmark and inner sail. */
  tone?: "dark" | "light";
}) {
  const light = tone === "light";
  return (
    <svg
      viewBox="5 0 114 32"
      role="img"
      aria-label="DRFT Aerodynamics"
      className={cn("h-8 w-auto", className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`${id}-sail-a`} x1="0" y1="25.9" x2="22.84" y2="24.93" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0284C7" />
          <stop offset="0.5" stopColor="#06B6D4" />
          <stop offset="1" stopColor="#38BDF8" />
        </linearGradient>
        <linearGradient id={`${id}-sail-b`} x1="9.47" y1="0" x2="26.36" y2="0.64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F59E0B" />
          <stop offset="0.5" stopColor="#F97316" />
          <stop offset="1" stopColor="#EF4444" />
        </linearGradient>
        <linearGradient id={`${id}-sail-c`} x1="5.68" y1="5.06" x2="21.57" y2="5.7" gradientUnits="userSpaceOnUse">
          <stop stopColor={light ? "#E2E8F0" : "#0F172A"} />
          <stop offset="1" stopColor={light ? "#CBD5E1" : "#1E293B"} />
        </linearGradient>
        <linearGradient id={`${id}-line-a`} x1="0" y1="0" x2="1" y2="0">
          <stop stopColor="#0284C7" />
          <stop offset="0.5" stopColor="#06B6D4" />
          <stop offset="1" stopColor="#38BDF8" />
        </linearGradient>
        <linearGradient id={`${id}-line-b`} x1="0" y1="0" x2="1" y2="0">
          <stop stopColor="#F59E0B" />
          <stop offset="0.5" stopColor="#F97316" />
          <stop offset="1" stopColor="#EF4444" />
        </linearGradient>
      </defs>

      <g transform="translate(6 5)">
        <path
          d="M0 24.9559C3.78941 15.4823 10.4209 6.00882 21.7891 0.324699C17.9997 7.90352 13.2629 16.4297 8.52618 25.9032C5.68412 25.9032 2.36838 25.6664 0 24.9559Z"
          fill={`url(#${id}-sail-a)`}
        />
        <path
          opacity="0.95"
          d="M9.47353 0.324697C17.0524 -1.09633 22.7365 2.2194 25.5785 8.85087C19.8944 9.79823 15.1577 14.535 12.3156 21.1665C11.3682 13.5876 10.8946 5.06146 9.47353 0.324697Z"
          fill={`url(#${id}-sail-b)`}
        />
        <path
          opacity="0.85"
          d="M5.68412 23.0612C9.47353 14.535 15.1576 8.85087 20.8418 5.06146C16.105 11.6929 12.3156 18.3244 10.4209 24.0085C8.52618 24.0085 6.63147 23.7717 5.68412 23.0612Z"
          fill={`url(#${id}-sail-c)`}
        />
        <circle cx="23.6838" cy="16.4297" r="1.8947" fill="#06B6D4" />
        <circle cx="23.6838" cy="16.4297" r="0.9474" fill="#ffffff" />
      </g>

      <text
        x="41"
        y="22.2"
        textLength="56"
        lengthAdjust="spacing"
        fill={light ? "#ffffff" : "#0a0a0a"}
        style={{ fontFamily: "var(--font-manrope)", fontSize: 20.8, fontWeight: 600 }}
      >
        DRFT
      </text>
      <rect x="42" y="27" width="16" height="1" fill={`url(#${id}-line-a)`} />
      <rect x="60" y="27" width="6" height="1" fill={`url(#${id}-line-b)`} />
      <text
        x="68"
        y="28.3"
        textLength="50"
        lengthAdjust="spacing"
        fill={light ? "#9fb6c3" : "#52525b"}
        style={{ fontFamily: "var(--font-manrope)", fontSize: 4, fontWeight: 600 }}
      >
        AERODYNAMICS
      </text>
    </svg>
  );
}
