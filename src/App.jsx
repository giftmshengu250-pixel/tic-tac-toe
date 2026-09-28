import { GameProvider, useGame } from './context/GameContext'
import Board from './components/Board'
import StatusBar from './components/StatusBar'
import Scoreboard from './components/Scoreboard'
import Controls from './components/Controls'
import MoveHistory from './components/MoveHistory'
import PlayerNameForm from './components/PlayerNameForm'
import SquidBackground from './components/SquidBackground'
import MenuBar from './components/MenuBar'
import MainMenu from './components/MainMenu'
import GameMode from './components/GameMode'

// AppContent lives INSIDE <GameProvider> so it can call useGame().
// It decides which screen to show: the Main Menu or the game board.
function AppContent() {
  const { screen } = useGame()

  return (
    <div className="page">
      <SquidBackground />

      {/* The single menu bar: modes, difficulty, themes, stats & system */}
      <MenuBar />

      <div className="page__content">
        {screen === 'menu' ? (
          <MainMenu />
        ) : (
          <>
            <header className="header">
              <p className="header__eyebrow">Player 001 · Round 6</p>
              <h1 className="header__title">Tic Tac Toe</h1>
            </header>

            <main className="layout">
              <section className="panel panel--game">
                <GameMode />
                <StatusBar />
                <Board />
                <Controls />
              </section>

              <aside className="panel panel--side">
                <Scoreboard />
                <PlayerNameForm />
                <MoveHistory />
              </aside>
            </main>
          </>
        )}

        <footer className="footer">
          <p>Built with React · useReducer + Context</p>
        </footer>
      </div>
    </div>
  )
}

export default function App() {
  return (
    // GameProvider wraps the whole tree so ANY component below can call
    // useGame() to read state or trigger actions — no prop drilling.
    <GameProvider>
      <AppContent />
    </GameProvider>
  )
}
