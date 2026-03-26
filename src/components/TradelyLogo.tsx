type TradelyLogoProps = {
  size?: number;
  showWordmark?: boolean;
  className?: string;
};

export default function TradelyLogo({
  size = 28,
  showWordmark = true,
  className = '',
}: TradelyLogoProps) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`.trim()}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect x="8" y="28" width="7" height="20" rx="2.5" fill="url(#tradely-bars)" />
        <rect x="19" y="22" width="7" height="26" rx="2.5" fill="url(#tradely-bars)" />
        <rect x="30" y="16" width="7" height="32" rx="2.5" fill="url(#tradely-bars)" />
        <path
          d="M8 42L20 30L29 39L50 18"
          stroke="url(#tradely-arrow)"
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M42 17H50V25"
          stroke="url(#tradely-arrow)"
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4 48L7 45"
          stroke="hsl(206 44% 25%)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M5.5 53L10.5 48"
          stroke="hsl(206 44% 25%)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M11 56L16 51"
          stroke="hsl(206 44% 25%)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="tradely-bars" x1="8" y1="16" x2="37" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="hsl(170 50% 73%)" />
            <stop offset="1" stopColor="hsl(174 53% 51%)" />
          </linearGradient>
          <linearGradient id="tradely-arrow" x1="10" y1="44" x2="50" y2="18" gradientUnits="userSpaceOnUse">
            <stop stopColor="hsl(198 72% 36%)" />
            <stop offset="1" stopColor="hsl(168 56% 58%)" />
          </linearGradient>
        </defs>
      </svg>
      {showWordmark && (
        <span className="text-[1.22rem] font-semibold tracking-tight text-foreground">
          Tradely
        </span>
      )}
    </div>
  );
}
