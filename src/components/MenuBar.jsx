import { useEffect, useRef, useState } from 'react'
import { useGame } from '../context/GameContext'
import { DIFFICULTIES, MODES, THEMES } from '../reducer/gameReducer'
import HelpModal from './modals/HelpModal'
import ScoreModal from './modals/ScoreModal'
import LeaderboardModal from './modals/LeaderboardModal'
import OnlineLobbyModal from './modals/OnlineLobbyModal'
import ExitScreen from './modals/ExitScreen'

const DIFFICULTY_LABELS = { easy: 'Easy', medium: 'Medium', hard: 'Hard', impossible: 'Impossible' }
const THEME_LABELS = { neon: 'Neon', dark: 'Dark Mode', light: 'Light Mode', wooden: 'Wooden' }

// One row inside a dropdown. `active` shows a ✓.
function Item({ active, onClick, children, hint }) {
  return (
    <button className={`menu__item ${active ? 'menu__item--active' : ''}`} role="menuitem" onClick={onClick}>
      <span className="menu__check">{active ? '✓' : ''}</span>
      <span>
        {children}
        {hint && <small className="menu__hint">{hint}</small>}
      </span>
    </button>
  )
}

// One dropdown group (trigger button + list). Defined OUTSIDE MenuBar so
// React doesn't re-create it on every render.
function Group({ id, label, openGroup, setOpenGroup, children }) {
  return (
    <div className="menu__group">
      <button
        className={`menu__trigger ${openGroup === id ? 'menu__trigger--open' : ''}`}
        aria-haspopup="menu"
        aria-expanded={openGroup === id}
        onClick={() => setOpenGroup(openGroup === id ? null : id)}
      >
        {label} <span className="menu__caret">▾</span>
      </button>
      {openGroup === id && <div className="menu__dropdown" role="menu">{children}</div>}
    </div>
  )
}

// MenuBar.jsx — THE one menu bar. Four dropdown groups:
//   🎮 Game Modes | ⚙️ Game Settings | 🛠️ Options | 📊 Stats & System
// It only calls named actions from useGame(); no game logic lives here.
export default function MenuBar() {
  const { mode, difficulty, theme, setMode, setDifficulty, setTheme, modal, openModal: showModal, closeModal, goToMenu } = useGame()

  const [openGroup, setOpenGroup] = useState(null) // which dropdown is open
  const [navOpen, setNavOpen] = useState(false) // mobile hamburger
  // `modal` ('help' | 'score' | 'leaderboard' | 'online' | null) now lives in the reducer
  const [exited, setExited] = useState(false)
  const barRef = useRef(null)

  // Close dropdowns when clicking elsewhere or pressing Esc.
  useEffect(() => {
    const onDown = (e) => barRef.current && !barRef.current.contains(e.target) && setOpenGroup(null)
    const onKey = (e) => e.key === 'Escape' && setOpenGroup(null)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const closeMenus = () => {
    setOpenGroup(null)
    setNavOpen(false)
  }
  // Run an action, then close the menu.
  const run = (fn) => () => {
    fn()
    closeMenus()
  }
  const openModal = (name) => run(() => showModal(name))

  const handleExit = () => {
    window.close() // only works if this tab was opened by a script
    setExited(true)
  }

  return (
    <>
      <nav className="menubar" ref={barRef} aria-label="Game menu">
        <div className="menubar__inner">
          <button className="menubar__brand" onClick={goToMenu} title="Main Menu">◯ △ □</button>
          <button className="menubar__burger" aria-label="Toggle menu" onClick={() => setNavOpen(!navOpen)}>☰</button>

          <div className={`menubar__nav ${navOpen ? 'menubar__nav--open' : ''}`}>
            <Group id="modes" openGroup={openGroup} setOpenGroup={setOpenGroup} label="🎮 Game Modes">
              <Item active={mode === MODES.SOLO} onClick={run(() => setMode(MODES.SOLO))} hint="Play against the computer">
                Solo / Single Player
              </Item>
              <Item active={mode === MODES.LOCAL} onClick={run(() => setMode(MODES.LOCAL))} hint="Two players, one screen">
                Local Multiplayer / Pass &amp; Play
              </Item>
              <Item active={mode === MODES.ONLINE} onClick={openModal('online')} hint="Create or join a room">
                Online Multiplayer
              </Item>
            </Group>

            <Group id="settings" openGroup={openGroup} setOpenGroup={setOpenGroup} label="⚙️ Game Settings">
              <p className="menu__section">Difficulty Level (Solo)</p>
              {DIFFICULTIES.map((d) => (
                <Item key={d} active={difficulty === d} onClick={run(() => setDifficulty(d))}>
                  {DIFFICULTY_LABELS[d]}
                </Item>
              ))}
            </Group>

            <Group id="options" openGroup={openGroup} setOpenGroup={setOpenGroup} label="🛠️ Options">
              <p className="menu__section">Themes / Skins</p>
              {THEMES.map((t) => (
                <Item key={t} active={theme === t} onClick={run(() => setTheme(t))}>
                  {THEME_LABELS[t]}
                </Item>
              ))}
            </Group>

            <Group id="stats" openGroup={openGroup} setOpenGroup={setOpenGroup} label="📊 Stats & System">
              <Item onClick={openModal('score')}>Scoreboard / Reset</Item>
              <Item onClick={openModal('leaderboard')}>Leaderboards</Item>
              <Item onClick={openModal('help')}>Help / Rules</Item>
              <Item onClick={run(goToMenu)}>Main Menu</Item>
              <Item onClick={run(handleExit)}>Exit / Quit</Item>
            </Group>
          </div>
        </div>
      </nav>

      {modal === 'help' && <HelpModal onClose={closeModal} />}
      {modal === 'score' && <ScoreModal onClose={closeModal} />}
      {modal === 'leaderboard' && <LeaderboardModal onClose={closeModal} />}
      {modal === 'online' && <OnlineLobbyModal onClose={closeModal} />}
      {exited && <ExitScreen onReturn={() => setExited(false)} />}
    </>
  )
}