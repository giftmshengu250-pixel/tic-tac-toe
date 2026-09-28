import { useGame } from '../context/GameContext'

// MoveHistory.jsx — ADVANCED FEATURE: "Move History + Time Travel".
// Renders one entry per snapshot in `history`. Clicking an entry calls
// jumpTo(step), which just moves the reducer's `step` pointer — no
// board data is thrown away, so you can always come back to "latest".
export default function MoveHistory() {
  const { history, step, jumpTo } = useGame()

  return (
    <div className="move-history" aria-label="Move history">
      <h3 className="move-history__title">Time Travel</h3>
      <ol className="move-history__list">
        {history.map((_, moveIndex) => {
          const label = moveIndex === 0 ? 'Game start' : `Move #${moveIndex}`
          const isCurrent = moveIndex === step
          return (
            <li key={moveIndex}>
              <button
                className={`move-history__btn ${isCurrent ? 'move-history__btn--active' : ''}`}
                onClick={() => jumpTo(moveIndex)}
              >
                {label}
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
