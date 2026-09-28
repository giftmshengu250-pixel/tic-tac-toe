// Square.jsx — a "dumb" presentational component.
// It has NO idea about game rules or state management; it just renders
// what it's told and reports clicks upward via onClick.
export default function Square({ value, onClick, disabled, isWinning }) {
  return (
    <button
      className={[
        'square',
        value ? `square--${value.toLowerCase()}` : '',
        isWinning ? 'square--winning' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onClick}
      disabled={disabled || Boolean(value)}
      aria-label={value ? `Square filled with ${value}` : 'Empty square'}
    >
      <span className="square__glyph">{value === 'X' ? '✕' : value === 'O' ? '○' : ''}</span>
    </button>
  )
}
