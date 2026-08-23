interface DeskLogoProps {
  className?: string;
}

/**
 * The application mark: a market split by the line its price is measured
 * against. Down territory on the left, up territory on the right, and the
 * window's opening price between them.
 *
 * It uses the same two side colours as the panels, so the logo and the data
 * are speaking the same language. Currents colours are inlined rather than
 * tokenised because a mark should look identical in both themes.
 */
export function DeskLogo({ className }: DeskLogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      role="img"
      aria-label="DreamDEX Desk"
      fill="none"
    >
      <rect width="32" height="32" rx="7" fill="#0E1418" />
      <path d="M4 8h15v16H4z" fill="#E8815A" opacity="0.85" />
      <path d="M19 8h9v16h-9z" fill="#5FD3C4" />
      <rect x="18.2" y="5" width="1.6" height="22" rx="0.8" fill="#F4E4B8" />
    </svg>
  );
}
