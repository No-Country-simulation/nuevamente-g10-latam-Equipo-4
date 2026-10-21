import type { CSSProperties } from "react";

export function AtlasOrb({
  color = "#ff704f",
  className = "",
}: {
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={`atlas-orb ${className}`}
      style={{ "--orb-color": color } as CSSProperties}
      aria-hidden="true"
    >
      <svg viewBox="0 0 200 200" fill="none">
        <circle
          cx="100"
          cy="100"
          r="55"
          stroke="currentColor"
          strokeOpacity=".24"
        />
        <circle
          cx="100"
          cy="100"
          r="77"
          stroke="currentColor"
          strokeOpacity=".12"
          strokeDasharray="1 8"
        />
        <ellipse
          cx="100"
          cy="100"
          rx="83"
          ry="30"
          transform="rotate(-35 100 100)"
          stroke="currentColor"
          strokeOpacity=".65"
        />
        <ellipse
          cx="100"
          cy="100"
          rx="83"
          ry="30"
          transform="rotate(55 100 100)"
          stroke="currentColor"
          strokeOpacity=".35"
        />
        <ellipse
          cx="100"
          cy="100"
          rx="58"
          ry="20"
          transform="rotate(12 100 100)"
          stroke="currentColor"
          strokeOpacity=".28"
        />
        <path
          d="m55 67 45 33 51-29-20 70-31-41-28 48-17-81"
          stroke="currentColor"
          strokeOpacity=".22"
        />
        <circle
          cx="100"
          cy="100"
          r="17"
          fill="currentColor"
          fillOpacity=".08"
        />
        <circle
          cx="100"
          cy="100"
          r="6"
          fill="currentColor"
          className="orb-core"
        />
        <circle cx="151" cy="71" r="3" fill="#ededef" />
        <circle cx="55" cy="67" r="2.5" fill="currentColor" />
        <circle cx="131" cy="141" r="3" fill="currentColor" />
        <circle cx="72" cy="148" r="2" fill="#ededef" />
      </svg>
    </span>
  );
}

export function AtlasLogo() {
  return (
    <span className="atlas-wordmark">
      <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <ellipse
          cx="24"
          cy="24"
          rx="23"
          ry="10"
          transform="rotate(-45 24 24)"
          stroke="currentColor"
          strokeOpacity=".6"
        />
        <ellipse
          cx="24"
          cy="24"
          rx="15"
          ry="20"
          transform="rotate(32 24 24)"
          stroke="#ff704f"
          strokeOpacity=".4"
        />
        <circle cx="9" cy="37" r="6" fill="#ededef" />
        <circle cx="38" cy="10" r="4" fill="#ff704f" />
      </svg>
      <span>atlas</span>
    </span>
  );
}
