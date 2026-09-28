import { useState } from 'react'
import { useGame } from '../context/GameContext'

// PlayerNameForm.jsx — small bonus control that lets players type their
// own names in place of raw "X" / "O". Local input state is fine here
// (it's purely a form draft) — only on submit do we dispatch into the
// global reducer via setPlayerNames().
export default function PlayerNameForm() {
  const { playerNames, setPlayerNames } = useGame()
  const [xDraft, setXDraft] = useState(playerNames.X)
  const [oDraft, setODraft] = useState(playerNames.O)

  const handleSubmit = (e) => {
    e.preventDefault()
    setPlayerNames(xDraft, oDraft)
  }

  return (
    <form className="name-form" onSubmit={handleSubmit}>
      <div className="name-form__field">
        <label htmlFor="playerX">Player X</label>
        <input
          id="playerX"
          type="text"
          maxLength={14}
          value={xDraft}
          onChange={(e) => setXDraft(e.target.value)}
          placeholder="Player X"
        />
      </div>
      <div className="name-form__field">
        <label htmlFor="playerO">Player O</label>
        <input
          id="playerO"
          type="text"
          maxLength={14}
          value={oDraft}
          onChange={(e) => setODraft(e.target.value)}
          placeholder="Player O"
        />
      </div>
      <button type="submit" className="btn btn--ghost">Save Names</button>
    </form>
  )
}
