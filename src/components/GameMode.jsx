import { useGame } from '../context/GameContext'
import { DIFFICULTIES, DIFFICULTY_INFO, MODES } from '../reducer/gameReducer'

// GameMode.jsx — the in-game mode selector shown above the board.
// Switch between Solo / Local / Online at any time (switching starts a
// fresh board). In Solo mode it also shows the difficulty chips.
export default function GameMode() {
  const { mode, difficulty, setMode, setDifficulty, openModal } = useGame()

  const tabs = [
    { id: MODES.SOLO, label: '🤖 Solo', onClick: () => setMode(MODES.SOLO) },
    { id: MODES.LOCAL, label: '👥 Local', onClick: () => setMode(MODES.LOCAL) },
    { id: MODES.ONLINE, label: '🌐 Online', onClick: () => openModal('online') },
  ]

  return (
    <div className="game-mode">
      <div className="segmented" role="tablist" aria-label="Game mode">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={mode === t.id}
            className={`segmented__btn ${mode === t.id ? 'segmented__btn--active' : ''}`}
            onClick={t.onClick}
          >
            {t.label}
          </button>
        ))}
      </div>

      {mode === MODES.SOLO && (
        <div className="chips" aria-label="Difficulty">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              title={DIFFICULTY_INFO[d].desc}
              className={`chip ${difficulty === d ? 'chip--active' : ''}`}
              onClick={() => setDifficulty(d)}
            >
              {DIFFICULTY_INFO[d].label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}