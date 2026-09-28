import { useGame } from '../context/GameContext'

// Scoreboard.jsx — MANUAL FEATURE (built without AI assistance):
// tracks X wins / O wins / draws across games, persisted in the reducer's
// `scores` slice so it survives board resets within the same session.
export default function Scoreboard() {
  const { scores, playerNames } = useGame()

  return (
    <div className="scoreboard" aria-label="Scoreboard">
      <div className="scoreboard__item scoreboard__item--x">
        <span className="scoreboard__label">{playerNames.X}</span>
        <span className="scoreboard__value">{scores.X}</span>
      </div>
      <div className="scoreboard__item scoreboard__item--draw">
        <span className="scoreboard__label">Draws</span>
        <span className="scoreboard__value">{scores.Draws}</span>
      </div>
      <div className="scoreboard__item scoreboard__item--o">
        <span className="scoreboard__label">{playerNames.O}</span>
        <span className="scoreboard__value">{scores.O}</span>
      </div>
    </div>
  )
}
