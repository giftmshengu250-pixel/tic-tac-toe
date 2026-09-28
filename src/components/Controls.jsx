import { useGame } from '../context/GameContext'

// Controls.jsx — Undo, Restart and Menu buttons. Each is a one-liner that
// calls a named action from useGame(); no dispatch logic lives here.
export default function Controls() {
  const { reset, undo, step, mode, goToMenu } = useGame()

  return (
    <div className="controls">
      <button
        className="btn btn--undo"
        onClick={undo}
        disabled={step === 0 || mode === 'online'}
        title={mode === 'online' ? 'Undo is disabled in online games' : 'Undo last move'}
      >
        ⏪ Undo
      </button>
      <button className="btn btn--reset" onClick={reset}>
        🔁 Restart
      </button>
      <button className="btn" onClick={goToMenu}>
        🏠 Menu
      </button>
    </div>
  )
}
