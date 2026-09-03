/** צללית A320 במבט-על, האף כלפי מעלה. משתמשת ב-currentColor. */
export function PlaneMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      fill="currentColor"
      aria-hidden="true"
      role="presentation"
    >
      {/* כנף שמאל */}
      <path d="M88 74 L10 128 L10 141 L88 102 Z" opacity="0.92" />
      {/* כנף ימין */}
      <path d="M112 74 L190 128 L190 141 L112 102 Z" opacity="0.92" />
      {/* מייצב אופקי שמאל */}
      <path d="M92 150 L54 172 L54 181 L92 162 Z" opacity="0.92" />
      {/* מייצב אופקי ימין */}
      <path d="M108 150 L146 172 L146 181 L108 162 Z" opacity="0.92" />
      {/* גוף המטוס */}
      <path d="M100 6 C108 6 113 18 113 40 L113 150 C113 168 107 183 100 192 C93 183 87 168 87 150 L87 40 C87 18 92 6 100 6 Z" />
      {/* מנועים */}
      <ellipse cx="62" cy="103" rx="6.5" ry="12" transform="rotate(34 62 103)" />
      <ellipse cx="138" cy="103" rx="6.5" ry="12" transform="rotate(-34 138 103)" />
      {/* חלון תא הטייס */}
      <path d="M100 20 C104 20 106 27 106 34 L94 34 C94 27 96 20 100 20 Z" fill="#ffffff" opacity="0.55" />
    </svg>
  );
}
