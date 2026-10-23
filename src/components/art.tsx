// Hand-drawn travel-journal artwork. Line art in currentColor plus the theme's accent colours, so it follows light and
// dark mode. Purely decorative: every piece is aria-hidden.

/** Home hero: a dashed route hopping between doodled stops (mountain, temple, palm, plane). */
export function JourneyDoodle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 420 300" fill="none" className={className} aria-hidden>
      <g stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        {/* route */}
        <path
          d="M40 250 C 90 200, 60 150, 130 140 S 210 190, 250 130 S 330 60, 380 70"
          strokeDasharray="2 9"
          className="text-accent"
          stroke="var(--accent)"
          strokeWidth="3"
        />
        {/* start pin */}
        <path d="M40 250c-10-14-16-22-16-30a16 16 0 0 1 32 0c0 8-6 16-16 30z" fill="var(--sun)" />
        <circle cx="40" cy="220" r="5" fill="var(--card)" />
        {/* mountain */}
        <path d="M92 132l22-40 14 22 8-12 24 30z" fill="var(--accent-soft)" />
        <path d="M108 103l6-11 6 9" />
        {/* temple */}
        <path d="M232 128h36M236 128v-14h28v14M240 114l10-12 10 12M244 102h12M250 90v-6" fill="var(--card)" />
        <path d="M228 132h44" />
        {/* palm */}
        <path d="M318 168c2-22 0-40-6-56" />
        <path
          d="M312 112c-10-8-24-8-32 0 12-2 22 0 32 0zM312 112c4-12 16-18 28-14-10 4-18 8-28 14zM312 112c10-6 24-2 30 8-10-4-20-6-30-8zM312 112c-6-10-6-22 2-30-1 10 0 20-2 30z"
          fill="var(--accent-soft)"
        />
        <path d="M296 170c10-4 32-4 44 0" />
        {/* plane */}
        <g transform="translate(372 52) rotate(18)">
          <path d="M-22 6l40-8c6-1 8 4 2 6l-40 10z" fill="var(--card)" />
          <path d="M-4 2l-10-14h6l16 12M-2 8l-8 12h6l12-12M-20 6l-6-8h4l8 6" />
        </g>
        {/* sun */}
        <circle cx="70" cy="60" r="16" fill="var(--sun)" stroke="none" opacity="0.85" />
        <path d="M70 34v-8M70 94v-8M44 60h-8M104 60h-8M52 42l-5-5M93 83l-5-5M52 78l-5 5M93 37l-5 5" />
        {/* little x marks */}
        <path d="M180 230l8 8M188 230l-8 8M350 220l6 6M356 220l-6 6" stroke="var(--accent-2)" />
        {/* wave */}
        <path d="M150 268c12-8 22-8 34 0s22 8 34 0 22-8 34 0 22 8 34 0" stroke="var(--accent)" opacity="0.6" />
      </g>
    </svg>
  );
}

/** Round passport stamp with text around the rim. */
export function Stamp({
  top,
  middle,
  bottom,
  className = "",
  tone = "accent-2",
}: {
  top: string;
  middle: string;
  bottom?: string;
  className?: string;
  tone?: "accent" | "accent-2";
}) {
  const id = `stamp-${top.replace(/\W/g, "")}-${bottom?.replace(/\W/g, "") ?? ""}`;
  return (
    <svg viewBox="0 0 120 120" className={className} style={{ color: `var(--${tone})` }} aria-hidden>
      <defs>
        <path id={`${id}-t`} d="M20 60a40 40 0 0 1 80 0" />
        <path id={`${id}-b`} d="M15 60a45 45 0 0 0 90 0" />
      </defs>
      <circle cx="60" cy="60" r="57" fill="var(--card)" opacity="0.9" />
      <g fill="none" stroke="currentColor" opacity="0.9">
        <circle cx="60" cy="60" r="56" strokeWidth="3" />
        <circle cx="60" cy="60" r="47" strokeWidth="1.2" strokeDasharray="3 3" />
      </g>
      <g fill="currentColor" fontFamily="var(--font-display)" fontWeight="700" letterSpacing="2">
        <text fontSize="11">
          <textPath href={`#${id}-t`} startOffset="50%" textAnchor="middle">
            {top.toUpperCase()}
          </textPath>
        </text>
        {bottom && (
          <text fontSize="9" letterSpacing="1">
            <textPath href={`#${id}-b`} startOffset="50%" textAnchor="middle">
              {bottom.toUpperCase()}
            </textPath>
          </text>
        )}
        <text x="60" y="66" fontSize="17" textAnchor="middle" letterSpacing="0.5">
          {middle}
        </text>
      </g>
    </svg>
  );
}

/** Wavy dashed divider with a tiny plane, between page sections. */
export function SquiggleDivider({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 600 24" preserveAspectRatio="none" className={`h-6 w-full ${className}`} aria-hidden>
      <path
        d="M0 12 Q 25 2, 50 12 T 100 12 T 150 12 T 200 12 T 250 12 T 300 12 T 350 12 T 400 12 T 450 12 T 500 12 T 550 12"
        fill="none"
        stroke="var(--line-strong)"
        strokeWidth="2"
        strokeDasharray="1 7"
        strokeLinecap="round"
      />
      <path d="M572 12l18-5c3-1 4 2 1 3l-18 6z M579 10l-5-6h3l7 5" fill="var(--accent)" />
    </svg>
  );
}

/** Suitcase doodle for empty states. */
export function SuitcaseDoodle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 100" fill="none" className={className} aria-hidden>
      <g stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="18" y="30" width="84" height="58" rx="10" fill="var(--accent-soft)" />
        <path d="M46 30v-10a6 6 0 0 1 6-6h16a6 6 0 0 1 6 6v10" />
        <path d="M18 52h84" />
        <path d="M40 30v58M80 30v58" stroke="var(--accent)" />
        <circle cx="34" cy="94" r="3" />
        <circle cx="86" cy="94" r="3" />
        <path d="M86 40l6 4-6 4" stroke="var(--accent-2)" />
      </g>
      <circle cx="96" cy="22" r="9" fill="var(--sun)" />
    </svg>
  );
}

/** Hand-drawn underline swoosh, placed under a highlighted word. */
export function Swoosh({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 16" preserveAspectRatio="none" className={className} aria-hidden>
      <path d="M4 11 C 50 3, 120 2, 196 8" fill="none" stroke="var(--accent-2)" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
