type LogoProps = {
  className?: string;
  variant?: "light" | "dark";
};

export default function Logo({ className = "", variant = "dark" }: LogoProps) {
  const isLight = variant === "light";
  const strokeColor = isLight ? "#ffffff" : "url(#hb-grad)";
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        width="34"
        height="34"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="hb-grad" x1="0" y1="0" x2="48" y2="48">
            <stop offset="0%" stopColor="#4f7cff" />
            <stop offset="100%" stopColor="#7b3fe4" />
          </linearGradient>
        </defs>
        <path
          d="M6 34c8 0 12-12 18-12s10 12 18 12"
          stroke={strokeColor}
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M8 34v6M40 34v6M24 22v18"
          stroke={strokeColor}
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle cx="24" cy="13" r="4" fill={strokeColor} />
      </svg>
      {isLight ? (
        <span className="text-xl font-extrabold tracking-tight text-white">
          HanBridge
        </span>
      ) : (
        <span className="text-xl font-extrabold tracking-tight text-slate-900">
          Han<span className="text-gradient">Bridge</span>
        </span>
      )}
    </span>
  );
}
