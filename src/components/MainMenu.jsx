import { useState } from 'react'
import { useGame } from '../context/GameContext'
import { DIFFICULTIES, DIFFICULTY_INFO, MODES } from '../reducer/gameReducer'

// MainMenu.jsx — the start screen (shown first, and whenever you pick
// "Main Menu"). It only calls named actions from useGame():
//   setMode(...)      -> starts the game in that mode
//   setDifficulty(..) -> AI strength for Solo
//   openModal(...)    -> Online lobby / Help pop-ups
export default function MainMenu() {
  const { difficulty, setDifficulty, setMode, openModal } = useGame()
  const [choosingSolo, setChoosingSolo] = useState(false) // show the difficulty step?

  return (
    <section className="main-menu">
      <p className="header__eyebrow">Player 001 · Round 6</p>
      <h1 className="header__title">Tic Tac Toe</h1>

      {!choosingSolo ? (
        <>
          <p className="main-menu__sub">Choose a game mode</p>
          <div className="main-menu__cards">
            <button className="mode-card" onClick={() => setChoosingSolo(true)}>
              <span className="mode-card__icon">🤖</span>
              <span className="mode-card__name">Solo</span>
              <span className="mode-card__desc">Play against the computer</span>
            </button>
            <button className="mode-card" onClick={() => setMode(MODES.LOCAL)}>
              <span className="mode-card__icon">👥</span>
              <span className="mode-card__name">Local Multiplayer</span>
              <span className="mode-card__desc">Pass &amp; play on one screen</span>
            </button>
            <button className="mode-card" onClick={() => openModal('online')}>
              <span className="mode-card__icon">🌐</span>
              <span className="mode-card__name">Online Multiplayer</span>
              <span className="mode-card__desc">Create or join a room</span>
            </button>
          </div>
          <button className="link-btn" onClick={() => openModal('help')}>How to play</button>
        </>
      ) : (
        <>
          <p className="main-menu__sub">Choose difficulty</p>
          <div className="difficulty-list">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                className={`difficulty-row ${difficulty === d ? 'difficulty-row--active' : ''}`}
                onClick={() => setDifficulty(d)}
              >
                <span className="difficulty-row__name">{DIFFICULTY_INFO[d].label}</span>
                <span className="difficulty-row__desc">{DIFFICULTY_INFO[d].desc}</span>
              </button>
            ))}
          </div>
          <div className="modal__actions main-menu__actions">
            <button className="btn" onClick={() => setChoosingSolo(false)}>← Back</button>
            <button className="btn btn--reset" onClick={() => setMode(MODES.SOLO)}>▶ Play</button>
          </div>
        </>
      )}
    </section>
  )
}