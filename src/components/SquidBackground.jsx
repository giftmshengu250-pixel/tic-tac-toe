// SquidBackground.jsx — decorative only, no game logic.
// Renders the pink guard shapes (circle / triangle / square) faint and
// floating behind the board, plus a scanline + vignette to sell the
// "neon corridor" mood from the reference image.
export default function SquidBackground() {
  return (
    <div className="squid-bg" aria-hidden="true">
      <div className="squid-bg__vignette" />
      <div className="squid-bg__scanlines" />
      <svg className="squid-bg__shape squid-bg__shape--circle" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="6" />
      </svg>
      <svg className="squid-bg__shape squid-bg__shape--triangle" viewBox="0 0 100 100">
        <polygon points="50,8 92,88 8,88" fill="none" stroke="currentColor" strokeWidth="6" />
      </svg>
      <svg className="squid-bg__shape squid-bg__shape--square" viewBox="0 0 100 100">
        <rect x="14" y="14" width="72" height="72" fill="none" stroke="currentColor" strokeWidth="6" />
      </svg>
      <svg className="squid-bg__shape squid-bg__shape--circle2" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="6" />
      </svg>
    </div>
  )
}
