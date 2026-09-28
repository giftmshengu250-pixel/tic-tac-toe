// -----------------------------------------------------------------------
// gameReducer.js
//
// This is the SINGLE SOURCE OF TRUTH for the entire game.
// Every state change in the app happens by dispatching an ACTION object
// ({ type: '...', payload: ... }) through this reducer — components never
// mutate state directly. This is the "Option B: Context + useReducer"
// approach from the assignment brief.
//
// WHY A REDUCER (instead of useState x 10)?
//  - `board`, `history`, `scores`, `mode`, `difficulty`... often change
//    TOGETHER in response to one event (e.g. "switch to Solo mode" resets
//    the board AND changes the mode). A reducer updates them atomically.
//  - Time-travel / undo is basically free: we keep a `history` array of
//    every board snapshot and a `step` pointer into it.
// -----------------------------------------------------------------------

import { calculateWinner, isDraw } from '../utils/gameLogic'
import { readStorage } from '../utils/storage'

// -------------------------------
// 1. CONSTANTS
// -------------------------------
export const MODES = { LOCAL: 'local', SOLO: 'solo', ONLINE: 'online' }
export const DIFFICULTIES = ['easy', 'medium', 'hard', 'impossible']
export const THEMES = ['neon', 'dark', 'light', 'wooden']
export const DEFAULT_NAMES = { X: 'Player X', O: 'Player O' }

// Label + one-line description for each AI difficulty (used by the Main
// Menu and the Game Mode selector). The AI itself lives in utils/gameLogic.js.
export const DIFFICULTY_INFO = {
  easy: { label: 'Easy', desc: 'Random moves' },
  medium: { label: 'Medium', desc: 'Blocks and takes wins' },
  hard: { label: 'Hard', desc: 'Smart, but slips up sometimes' },
  impossible: { label: 'Impossible', desc: 'Unbeatable — best you can do is draw' },
}

// Using constants (instead of raw strings scattered everywhere) avoids
// typos like 'MAKE_MOOVE' silently doing nothing.
export const ACTIONS = {
  MAKE_MOVE: 'MAKE_MOVE',
  UNDO: 'UNDO',
  JUMP_TO: 'JUMP_TO',
  RESET: 'RESET',
  RECORD_SCORE: 'RECORD_SCORE',
  CLEAR_SCORES: 'CLEAR_SCORES',
  SET_PLAYER_NAMES: 'SET_PLAYER_NAMES',
  SET_MODE: 'SET_MODE', // NEW: switch Local <-> Solo (clears any online room)
  SET_DIFFICULTY: 'SET_DIFFICULTY', // NEW: AI strength
  SET_THEME: 'SET_THEME', // NEW: visual skin
  START_ONLINE: 'START_ONLINE', // NEW: create/join an online room
  ONLINE_CONNECTED: 'ONLINE_CONNECTED', // NEW: opponent is present
  ONLINE_PEER_LEFT: 'ONLINE_PEER_LEFT', // NEW: opponent left the room
  GO_TO_MENU: 'GO_TO_MENU', // NEW: back to the Main Menu screen
  OPEN_MODAL: 'OPEN_MODAL', // NEW: show a pop-up (help / score / leaderboard / online)
  CLOSE_MODAL: 'CLOSE_MODAL',
}

// Online sub-state when we are NOT in an online room.
const IDLE_ONLINE = { room: null, mySymbol: null, status: 'idle', opponentName: null }

const emptyBoard = () => Array(9).fill(null)

// Read a saved setting, but only accept it if it's a valid option.
function savedOrDefault(key, allowed, fallback) {
  const saved = readStorage(key)
  return allowed.includes(saved) ? saved : fallback
}

// -------------------------------
// 2. INITIAL STATE (a function, so it can read saved settings once)
// -------------------------------
// `history` is an array of board snapshots. history[0] is always the
// empty board. Every move APPENDS a new 9-cell snapshot. This powers the
// "Move History + Time Travel" advanced feature.
//
// `step` is which snapshot we are currently LOOKING AT.
export function createInitialState() {
  return {
    history: [emptyBoard()], // [ [null x9], [board after move 1], ... ]
    step: 0, // pointer into `history`
    scores: { X: 0, O: 0, Draws: 0 }, // scoreboard feature
    playerNames: { ...DEFAULT_NAMES }, // player-name feature
    scored: false, // guards against double-counting a finished game
    mode: MODES.LOCAL, // 'local' | 'solo' | 'online'
    difficulty: savedOrDefault('ttt:difficulty', DIFFICULTIES, 'medium'),
    theme: savedOrDefault('ttt:theme', THEMES, 'neon'),
    online: IDLE_ONLINE,
    screen: 'menu', // NEW: 'menu' (Main Menu) | 'game' (the board)
    modal: null, // NEW: which pop-up is open, or null
  }
}

// -------------------------------
// 3. THE REDUCER
// -------------------------------
// A reducer is just: (currentState, action) => newState
// It must be a PURE function — no mutation, no side effects, no randomness.
// (The computer's *choice* of move is made outside, in GameContext, and
// then arrives here as an ordinary MAKE_MOVE action.)
export function gameReducer(state, action) {
  switch (action.type) {
    // ---------------------------------------------------------------
    // MAKE_MOVE — a square was played (by a human, the AI, or a remote player)
    // ---------------------------------------------------------------
    case ACTIONS.MAKE_MOVE: {
      const { index } = action.payload
      const currentBoard = state.history[state.step]

      // Whose turn? Step parity: step 0 -> X, step 1 -> O, etc.
      const player = state.step % 2 === 0 ? 'X' : 'O'

      // Guard clauses: ignore illegal moves instead of throwing.
      const alreadyDecided = calculateWinner(currentBoard) || isDraw(currentBoard)
      if (alreadyDecided || currentBoard[index] !== null) {
        return state // no-op: return the SAME state reference
      }

      // Immutably build the next board (never mutate currentBoard!)
      const nextBoard = currentBoard.slice()
      nextBoard[index] = player

      // If the user had rewound (Undo / time travel) and THEN plays, we
      // discard the "future" moves after the current step (branching).
      const truncatedHistory = state.history.slice(0, state.step + 1)

      return {
        ...state,
        history: [...truncatedHistory, nextBoard],
        step: truncatedHistory.length, // pointer -> new last entry
        scored: false, // new position -> re-arm the scorer
      }
    }

    // ---------------------------------------------------------------
    // UNDO — step back one move.
    //  - Solo: rewinds to YOUR previous turn (undoes your move AND the
    //    computer's reply), otherwise the computer would just replay.
    //  - Online: disabled (can't rewind a shared game).
    // ---------------------------------------------------------------
    case ACTIONS.UNDO: {
      if (state.mode === MODES.ONLINE || state.step === 0) return state
      let target = state.step - 1
      if (state.mode === MODES.SOLO && target % 2 === 1) target -= 1
      return { ...state, step: Math.max(0, target) }
    }

    // ---------------------------------------------------------------
    // JUMP_TO — time travel: click any move in the history list
    // ---------------------------------------------------------------
    case ACTIONS.JUMP_TO: {
      if (state.mode === MODES.ONLINE) return state
      const { step } = action.payload
      if (step < 0 || step >= state.history.length) return state
      return { ...state, step }
    }

    // ---------------------------------------------------------------
    // RESET — fresh board; keeps scoreboard, names, mode, online room
    // ---------------------------------------------------------------
    case ACTIONS.RESET: {
      return { ...state, history: [emptyBoard()], step: 0, scored: false }
    }

    // ---------------------------------------------------------------
    // RECORD_SCORE — called once when a game reaches Win/Draw
    // ---------------------------------------------------------------
    case ACTIONS.RECORD_SCORE: {
      if (state.scored) return state // already counted this game
      const board = state.history[state.step]
      const result = calculateWinner(board)

      const nextScores = { ...state.scores }
      if (result) {
        nextScores[result.winner] += 1
      } else if (isDraw(board)) {
        nextScores.Draws += 1
      } else {
        return state // game isn't actually over — ignore
      }
      return { ...state, scores: nextScores, scored: true }
    }

    // ---------------------------------------------------------------
    // CLEAR_SCORES — "Scoreboard / Reset": wipe the session's wins/ties.
    // `scored` is left alone so a game already finished isn't re-counted.
    // ---------------------------------------------------------------
    case ACTIONS.CLEAR_SCORES: {
      return { ...state, scores: { X: 0, O: 0, Draws: 0 } }
    }

    // ---------------------------------------------------------------
    // SET_PLAYER_NAMES — rename "X" / "O" in the UI
    // ---------------------------------------------------------------
    case ACTIONS.SET_PLAYER_NAMES: {
      const { x, o } = action.payload
      return {
        ...state,
        playerNames: {
          X: x?.trim() ? x.trim() : DEFAULT_NAMES.X,
          O: o?.trim() ? o.trim() : DEFAULT_NAMES.O,
        },
      }
    }

    // ---------------------------------------------------------------
    // SET_MODE — Local Multiplayer or Solo (vs computer).
    // Switching modes starts a fresh board and leaves any online room.
    // ---------------------------------------------------------------
    case ACTIONS.SET_MODE: {
      return {
        ...state,
        screen: 'game', // picking a mode (Main Menu or menu bar) starts the game
        mode: action.payload.mode,
        history: [emptyBoard()],
        step: 0,
        scored: false,
        online: IDLE_ONLINE,
      }
    }

    // ---------------------------------------------------------------
    // SET_DIFFICULTY / SET_THEME — simple setting changes
    // ---------------------------------------------------------------
    case ACTIONS.SET_DIFFICULTY: {
      if (!DIFFICULTIES.includes(action.payload.difficulty)) return state
      return { ...state, difficulty: action.payload.difficulty }
    }

    case ACTIONS.SET_THEME: {
      if (!THEMES.includes(action.payload.theme)) return state
      return { ...state, theme: action.payload.theme }
    }

    // ---------------------------------------------------------------
    // ONLINE — room lifecycle
    //  START_ONLINE:     I created (I'm X) or joined (I'm O) a room -> "waiting"
    //  ONLINE_CONNECTED: both players are in the room -> fresh shared board
    //  ONLINE_PEER_LEFT: the other player closed the tab / left
    // ---------------------------------------------------------------
    case ACTIONS.START_ONLINE: {
      const { room, symbol } = action.payload
      return {
        ...state,
        screen: 'game',
        mode: MODES.ONLINE,
        history: [emptyBoard()],
        step: 0,
        scored: false,
        online: { room, mySymbol: symbol, status: 'waiting', opponentName: null },
      }
    }

    case ACTIONS.ONLINE_CONNECTED: {
      return {
        ...state,
        history: [emptyBoard()],
        step: 0,
        scored: false,
        online: { ...state.online, status: 'connected', opponentName: action.payload.opponentName },
      }
    }

    case ACTIONS.ONLINE_PEER_LEFT: {
      return { ...state, online: { ...state.online, status: 'disconnected' } }
    }

    // ---------------------------------------------------------------
    // GO_TO_MENU — return to the Main Menu. Resets the board, leaves any
    // online room, and closes pop-ups. Scores are kept for the session.
    // ---------------------------------------------------------------
    case ACTIONS.GO_TO_MENU: {
      return {
        ...state,
        screen: 'menu',
        mode: MODES.LOCAL,
        history: [emptyBoard()],
        step: 0,
        scored: false,
        online: IDLE_ONLINE,
        modal: null,
      }
    }

    // OPEN_MODAL / CLOSE_MODAL — UI pop-up state lives here too, so the
    // Main Menu, Game Mode selector and menu bar can all open the same pop-ups.
    case ACTIONS.OPEN_MODAL:
      return { ...state, modal: action.payload.modal }

    case ACTIONS.CLOSE_MODAL:
      return { ...state, modal: null }

    default:
      // Unknown action — return state unchanged.
      return state
  }
}
