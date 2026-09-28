// -----------------------------------------------------------------------
// GameContext.jsx
//
// This is the "Context + useReducer" wiring. It does four jobs:
//   1. Runs the single useReducer for the whole app.
//   2. Derives read-only values (board, winner, canPlay, displayNames...)
//      from state so components don't repeat that logic.
//   3. Runs the SIDE EFFECTS the pure reducer can't: the computer's
//      turn, the online-room connection, saving settings, theming.
//   4. Exposes a small, readable API (makeMove, undo, setMode, ...) via a
//      custom hook, so components NEVER call `dispatch` directly.
// -----------------------------------------------------------------------
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react'
import { ACTIONS, DEFAULT_NAMES, MODES, createInitialState, gameReducer } from '../reducer/gameReducer'
import { calculateWinner, isDraw, getComputerMove } from '../utils/gameLogic'
import { recordOnlineResult } from '../utils/leaderboard'
import { writeStorage } from '../utils/storage'
 
const GameContext = createContext(null)
 
// How long the computer "thinks" before playing (ms) — purely cosmetic.
const COMPUTER_DELAY = 600
 
export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState)
  const { mode, difficulty, theme, online, playerNames, screen, modal } = state
 
  // ----- Derived state (computed fresh every render, not stored) -----
  const board = state.history[state.step]
  const currentPlayer = state.step % 2 === 0 ? 'X' : 'O'
  const result = calculateWinner(board) // { winner, line } | null
  const draw = isDraw(board)
  const isGameOver = Boolean(result || draw)
  const isViewingLatest = state.step === state.history.length - 1
 
  // Is it a HUMAN's turn on THIS device?
  //  - local:  always (two people share the screen)
  //  - solo:   only when it's X (you). O belongs to the computer.
  //  - online: only when connected AND it's my symbol's turn.
  const isMyTurn =
    mode === MODES.LOCAL
      ? true
      : mode === MODES.SOLO
        ? currentPlayer === 'X'
        : online.status === 'connected' && currentPlayer === online.mySymbol
  const canPlay = isMyTurn && !isGameOver
  const isComputerThinking = mode === MODES.SOLO && currentPlayer === 'O' && !isGameOver && isViewingLatest
 
  // Names shown in the UI: "You/Computer" in solo, real names online.
  const displayNames = useMemo(() => {
    if (mode === MODES.SOLO) {
      return { X: playerNames.X !== DEFAULT_NAMES.X ? playerNames.X : 'You', O: 'Computer' }
    }
    if (mode === MODES.ONLINE && online.mySymbol) {
      const opp = online.mySymbol === 'X' ? 'O' : 'X'
      return { [online.mySymbol]: playerNames[online.mySymbol], [opp]: online.opponentName || 'Opponent' }
    }
    return playerNames
  }, [mode, playerNames, online])
 
  // Refs let long-lived callbacks (like the channel listener) read the
  // latest values without having to be re-created on every render.
  const channelRef = useRef(null)
  const namesRef = useRef(playerNames)
  namesRef.current = playerNames
 
  // ---------------- EFFECT: apply + save the theme ----------------
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    writeStorage('ttt:theme', theme)
  }, [theme])
 
  useEffect(() => {
    writeStorage('ttt:difficulty', difficulty)
  }, [difficulty])
 
  // ---------------- EFFECT: record finished games ----------------
  // Whenever a game finishes, update the scoreboard exactly once. In
  // online games, also record MY result on the leaderboard (each player
  // only records their own result, so nothing is double-counted).
  useEffect(() => {
    if (isGameOver && isViewingLatest && !state.scored) {
      dispatch({ type: ACTIONS.RECORD_SCORE })
      if (mode === MODES.ONLINE && online.mySymbol) {
        const outcome = result ? (result.winner === online.mySymbol ? 'win' : 'loss') : 'draw'
        recordOnlineResult(displayNames[online.mySymbol], outcome)
      }
    }
  }, [isGameOver, isViewingLatest, state.scored, mode, online.mySymbol, result, displayNames])
 
  // ---------------- EFFECT: the computer takes its turn ----------------
  // The AI picks a square (impure / random -> so it lives here, NOT in the
  // reducer) and then dispatches an ordinary MAKE_MOVE. The timer is
  // cleaned up if the game changes before the computer "finishes thinking".
  useEffect(() => {
    if (!isComputerThinking) return
    const timer = setTimeout(() => {
      const index = getComputerMove(board, difficulty, 'O')
      if (index !== null) dispatch({ type: ACTIONS.MAKE_MOVE, payload: { index } })
    }, COMPUTER_DELAY)
    return () => clearTimeout(timer)
  }, [isComputerThinking, board, difficulty])
 
  // ---------------- EFFECT: online room connection ----------------
  // "Online" here uses the browser's BroadcastChannel: two tabs/windows
  // that open the same room code talk to each other. (True internet play
  // between different computers needs a server - see README.)
  useEffect(() => {
    if (!online.room || typeof BroadcastChannel === 'undefined') return
    const symbol = online.mySymbol
    const channel = new BroadcastChannel(`ttt-room-${online.room}`)
    channelRef.current = channel
 
    channel.onmessage = ({ data }) => {
      switch (data.type) {
        case 'JOIN': // a guest arrived -> I'm the host (X): welcome them
          if (symbol === 'X') {
            channel.postMessage({ type: 'WELCOME', name: namesRef.current.X })
            dispatch({ type: ACTIONS.ONLINE_CONNECTED, payload: { opponentName: data.name } })
          }
          break
        case 'WELCOME': // the host answered -> I'm connected
          dispatch({ type: ACTIONS.ONLINE_CONNECTED, payload: { opponentName: data.name } })
          break
        case 'MOVE': // opponent played a square
          dispatch({ type: ACTIONS.MAKE_MOVE, payload: { index: data.index } })
          break
        case 'RESET': // opponent restarted the board
          dispatch({ type: ACTIONS.RESET })
          break
        case 'LEAVE':
          dispatch({ type: ACTIONS.ONLINE_PEER_LEFT })
          break
        default:
      }
    }
 
    // Guests announce themselves as soon as they connect.
    if (symbol === 'O') channel.postMessage({ type: 'JOIN', name: namesRef.current.O })
 
    return () => {
      channel.postMessage({ type: 'LEAVE' })
      channel.close()
      channelRef.current = null
    }
  }, [online.room, online.mySymbol])
 
  // ----- Public API — plain functions, no dispatch/action leakage -----
  const makeMove = useCallback(
    (index) => {
      if (!canPlay) return
      dispatch({ type: ACTIONS.MAKE_MOVE, payload: { index } })
      if (mode === MODES.ONLINE) channelRef.current?.postMessage({ type: 'MOVE', index })
    },
    [canPlay, mode]
  )
 
  const undo = useCallback(() => dispatch({ type: ACTIONS.UNDO }), [])
  const jumpTo = useCallback((step) => dispatch({ type: ACTIONS.JUMP_TO, payload: { step } }), [])
 
  const reset = useCallback(() => {
    dispatch({ type: ACTIONS.RESET })
    if (mode === MODES.ONLINE) channelRef.current?.postMessage({ type: 'RESET' })
  }, [mode])
 
  const clearScores = useCallback(() => dispatch({ type: ACTIONS.CLEAR_SCORES }), [])
  const setPlayerNames = useCallback((x, o) => dispatch({ type: ACTIONS.SET_PLAYER_NAMES, payload: { x, o } }), [])
  const setMode = useCallback((m) => dispatch({ type: ACTIONS.SET_MODE, payload: { mode: m } }), [])
  const setDifficulty = useCallback((d) => dispatch({ type: ACTIONS.SET_DIFFICULTY, payload: { difficulty: d } }), [])
  const setTheme = useCallback((t) => dispatch({ type: ACTIONS.SET_THEME, payload: { theme: t } }), [])
  // NEW: navigation + pop-ups
  const goToMenu = useCallback(() => dispatch({ type: ACTIONS.GO_TO_MENU }), [])
  const openModal = useCallback((name) => dispatch({ type: ACTIONS.OPEN_MODAL, payload: { modal: name } }), [])
  const closeModal = useCallback(() => dispatch({ type: ACTIONS.CLOSE_MODAL }), [])
  const startOnline = useCallback(
    (room, symbol) => dispatch({ type: ACTIONS.START_ONLINE, payload: { room, symbol } }),
    []
  )
 
  const value = useMemo(
    () => ({
      // raw-ish state
      history: state.history,
      step: state.step,
      scores: state.scores,
      playerNames,
      mode,
      difficulty,
      theme,
      online,
      screen,
      modal,
      // derived
      board,
      currentPlayer,
      displayNames,
      winner: result?.winner ?? null,
      winningLine: result?.line ?? null,
      isDraw: draw,
      isGameOver,
      isViewingLatest,
      canPlay,
      isComputerThinking,
      // actions
      makeMove,
      undo,
      jumpTo,
      reset,
      clearScores,
      setPlayerNames,
      setMode,
      setDifficulty,
      setTheme,
      startOnline,
      goToMenu,
      openModal,
      closeModal,
    }),
    [
      state, playerNames, mode, difficulty, theme, online, board, currentPlayer, displayNames, result, draw,
      isGameOver, isViewingLatest, canPlay, isComputerThinking, makeMove, undo, jumpTo, reset, clearScores,
      setPlayerNames, setMode, setDifficulty, setTheme, startOnline, screen, modal, goToMenu, openModal, closeModal,
    ]
  )
 
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}
 
// Custom hook — components call useGame() instead of useContext(GameContext).
export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) {
    throw new Error('useGame() must be used inside a <GameProvider>')
  }
  return ctx
}