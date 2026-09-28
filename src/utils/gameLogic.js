// -----------------------------------------------------------------------
// gameLogic.js
// Pure, framework-free helper functions for TicTacToe rules.
// Includes the computer opponent (bottom of file). Keeping these OUTSIDE the reducer/components keeps the reducer readable
// and makes the logic independently testable.
// -----------------------------------------------------------------------

// Every possible way to win on a 3x3 board (rows, columns, diagonals),
// expressed as index triplets into a flat 9-item board array:
//  0 | 1 | 2
//  --+---+--
//  3 | 4 | 5
//  --+---+--
//  6 | 7 | 8
export const WIN_LINES = [
  [0, 1, 2], // top row
  [3, 4, 5], // middle row
  [6, 7, 8], // bottom row
  [0, 3, 6], // left column
  [1, 4, 7], // middle column
  [2, 5, 8], // right column
  [0, 4, 8], // diagonal \
  [2, 4, 6], // diagonal /
]

/**
 * Checks a board for a winner.
 * @param {Array<string|null>} board - 9-item array of 'X' | 'O' | null
 * @returns {{winner: string, line: number[]} | null}
 *   Returns the winning symbol + the winning line (for highlighting),
 *   or null if nobody has won yet.
 */
export function calculateWinner(board) {
  for (const line of WIN_LINES) {
    const [a, b, c] = line
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line }
    }
  }
  return null
}

/**
 * A draw is: no winner AND every square filled.
 */
export function isDraw(board) {
  return !calculateWinner(board) && board.every((cell) => cell !== null)
}

/**
 * Picks a random empty square. Used by the computer opponent
 * (see utils/ai.js) for Easy mode and as a fallback in other modes.
 */
export function getRandomEmptyIndex(board) {
  const empties = board
    .map((cell, i) => (cell === null ? i : null))
    .filter((i) => i !== null)
  if (empties.length === 0) return null
  return empties[Math.floor(Math.random() * empties.length)]
}

// =======================================================================
// COMPUTER OPPONENT (Solo mode) + DIFFICULTY
// Pure functions: give getComputerMove() a board + difficulty and it
// returns the index (0-8) the computer wants to play.
//
//  easy       -> random empty square
//  medium     -> wins if it can, blocks you if it must, else centre/random
//  hard       -> minimax (perfect play) but blunders randomly ~20% of moves
//  impossible -> minimax every move (can never lose - best you get is a draw)
//
// GameContext.jsx calls getComputerMove() when it's the computer's turn,
// passing the difficulty stored in the reducer.
// =======================================================================
function emptyIndices(board) {
  return board.reduce((acc, cell, i) => (cell === null ? [...acc, i] : acc), [])
}

// Is there a square where `player` would win RIGHT NOW? Return it (or null).
function findWinningMove(board, player) {
  for (const i of emptyIndices(board)) {
    const test = board.slice()
    test[i] = player
    if (calculateWinner(test)?.winner === player) return i
  }
  return null
}

// Minimax: try every possible future and assume both sides play perfectly.
// Score is positive if the AI wins, negative if the human wins, 0 for a
// draw. `depth` makes the AI prefer faster wins / slower losses.
function minimax(board, isAiTurn, ai, human, depth) {
  const result = calculateWinner(board)
  if (result) return result.winner === ai ? 10 - depth : depth - 10
  if (isDraw(board)) return 0

  const player = isAiTurn ? ai : human
  const scores = emptyIndices(board).map((i) => {
    const next = board.slice()
    next[i] = player
    return minimax(next, !isAiTurn, ai, human, depth + 1)
  })
  return isAiTurn ? Math.max(...scores) : Math.min(...scores)
}

function bestMove(board, ai, human) {
  let bestScore = -Infinity
  let bestMoves = []
  for (const i of emptyIndices(board)) {
    const next = board.slice()
    next[i] = ai
    const score = minimax(next, false, ai, human, 1)
    if (score > bestScore) {
      bestScore = score
      bestMoves = [i]
    } else if (score === bestScore) {
      bestMoves.push(i)
    }
  }
  // Pick randomly among equally good moves so games feel less repetitive.
  return bestMoves[Math.floor(Math.random() * bestMoves.length)] ?? null
}

function mediumMove(board, ai, human) {
  return (
    findWinningMove(board, ai) ?? // 1. win if possible
    findWinningMove(board, human) ?? // 2. otherwise block the human
    (board[4] === null ? 4 : null) ?? // 3. otherwise take the centre
    getRandomEmptyIndex(board) // 4. otherwise anything
  )
}

export function getComputerMove(board, difficulty, ai = 'O') {
  const human = ai === 'O' ? 'X' : 'O'
  if (emptyIndices(board).length === 0) return null

  switch (difficulty) {
    case 'easy':
      return getRandomEmptyIndex(board)
    case 'medium':
      return mediumMove(board, ai, human)
    case 'hard':
      return Math.random() < 0.2 ? getRandomEmptyIndex(board) : bestMove(board, ai, human)
    case 'impossible':
    default:
      return bestMove(board, ai, human)
  }
}