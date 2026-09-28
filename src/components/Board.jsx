import Square from './Square'
import { useGame } from '../context/GameContext'

// Board.jsx — reads from context via useGame(), stays otherwise dumb.
// It doesn't know HOW moves are made or scored, only WHAT to render.
export default function Board() {
  const { board, makeMove, isGameOver, winningLine, isViewingLatest } = useGame()

  return (
    <div className="board" role="grid" aria-label="Tic Tac Toe board">
      {board.map((value, index) => (
        <Square
          key={index}
          value={value}
          isWinning={Boolean(winningLine?.includes(index))}
          // Squares are locked once the game is over, or while you're
          // time-travelling through history (isViewingLatest === false)
          // — you must jump back to "latest" before playing on.
          disabled={isGameOver || !isViewingLatest}
          onClick={() => makeMove(index)}
        />
      ))}
    </div>
  )
}
