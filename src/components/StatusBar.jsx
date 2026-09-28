import { useGame } from '../context/GameContext'

// StatusBar.jsx — shows "Next Player: X" / "Winner: O" / "Draw!"
export default function StatusBar() {
  const { winner, isDraw, currentPlayer, playerNames, isViewingLatest, step, history } = useGame()

  let statusText
  let statusClass = 'status'

  if (winner) {
    statusText = `Winner: ${playerNames[winner]}`
    statusClass += ' status--winner'
  } else if (isDraw) {
    statusText = 'Draw!'
    statusClass += ' status--draw'
  } else {
    statusText = `Next Player: ${playerNames[currentPlayer]}`
    statusClass += currentPlayer === 'X' ? ' status--x' : ' status--o'
  }

  return (
    <div className="status-wrap">
      <p className={statusClass}>{statusText}</p>
      {!isViewingLatest && (
        <p className="status-subnote">
          Viewing move {step} of {history.length - 1} — jump to the latest move to keep playing.
        </p>
      )}
    </div>
  )
}
