const base = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export const ICONS = {
  download: (
    <svg {...base}>
      <rect x="3" y="4" width="18" height="14" rx="2" />
      <path d="M12 8v6m0 0-3-3m3 3 3-3M8 21h8" />
    </svg>
  ),
  key: (
    <svg {...base}>
      <circle cx="8" cy="15" r="4" />
      <path d="m11 12 9-9m-3 3 3 3m-6 0 2 2" />
    </svg>
  ),
  laptop: (
    <svg {...base}>
      <rect x="4" y="5" width="16" height="11" rx="1.5" />
      <path d="M2 20h20M9 9l2 2 4-4" />
    </svg>
  ),
  doc: (
    <svg {...base}>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4M9 14l2 2 4-4" />
    </svg>
  ),
};
