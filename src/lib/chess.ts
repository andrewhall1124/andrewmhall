const DEPTH = 3;

export type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';

export interface Piece {
	type: PieceType;
	color: 0 | 1; // 0 = white, 1 = black
}

export type Square = Piece | null;
export type Board = Square[][];

export interface Move {
	from: [number, number];
	to: [number, number];
	promotion?: PieceType;
	castle?: 'kingside' | 'queenside';
	enPassant?: boolean;
}

export interface GameState {
	board: Board;
	turn: 0 | 1;
	castlingRights: { whiteKing: boolean; whiteQueen: boolean; blackKing: boolean; blackQueen: boolean };
	enPassantTarget: [number, number] | null;
}

function piece(type: PieceType, color: 0 | 1): Piece {
	return { type, color };
}

export function initialGameState(): GameState {
	const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));

	// Black pieces (row 0)
	board[0] = [
		piece('rook', 1), piece('knight', 1), piece('bishop', 1), piece('queen', 1),
		piece('king', 1), piece('bishop', 1), piece('knight', 1), piece('rook', 1)
	];
	// Black pawns (row 1)
	for (let j = 0; j < 8; j++) board[1][j] = piece('pawn', 1);
	// White pawns (row 6)
	for (let j = 0; j < 8; j++) board[6][j] = piece('pawn', 0);
	// White pieces (row 7)
	board[7] = [
		piece('rook', 0), piece('knight', 0), piece('bishop', 0), piece('queen', 0),
		piece('king', 0), piece('bishop', 0), piece('knight', 0), piece('rook', 0)
	];

	return {
		board,
		turn: 0,
		castlingRights: { whiteKing: true, whiteQueen: true, blackKing: true, blackQueen: true },
		enPassantTarget: null
	};
}

function inBounds(r: number, c: number): boolean {
	return r >= 0 && r < 8 && c >= 0 && c < 8;
}

export function isSquareAttacked(board: Board, row: number, col: number, byColor: 0 | 1): boolean {
	const enemy = byColor;

	// Knight attacks
	const knightOffsets = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
	for (const [dr, dc] of knightOffsets) {
		const r = row + dr, c = col + dc;
		if (inBounds(r, c) && board[r][c]?.type === 'knight' && board[r][c]?.color === enemy) return true;
	}

	// King attacks
	const kingOffsets = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
	for (const [dr, dc] of kingOffsets) {
		const r = row + dr, c = col + dc;
		if (inBounds(r, c) && board[r][c]?.type === 'king' && board[r][c]?.color === enemy) return true;
	}

	// Pawn attacks
	const pawnDir = enemy === 0 ? 1 : -1; // white pawns attack upward (lower row), black downward
	for (const dc of [-1, 1]) {
		const r = row + pawnDir, c = col + dc;
		if (inBounds(r, c) && board[r][c]?.type === 'pawn' && board[r][c]?.color === enemy) return true;
	}

	// Sliding pieces: bishop/queen (diagonals)
	const diagonals = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
	for (const [dr, dc] of diagonals) {
		let r = row + dr, c = col + dc;
		while (inBounds(r, c)) {
			const p = board[r][c];
			if (p) {
				if (p.color === enemy && (p.type === 'bishop' || p.type === 'queen')) return true;
				break;
			}
			r += dr; c += dc;
		}
	}

	// Sliding pieces: rook/queen (orthogonals)
	const orthogonals = [[-1, 0], [1, 0], [0, -1], [0, 1]];
	for (const [dr, dc] of orthogonals) {
		let r = row + dr, c = col + dc;
		while (inBounds(r, c)) {
			const p = board[r][c];
			if (p) {
				if (p.color === enemy && (p.type === 'rook' || p.type === 'queen')) return true;
				break;
			}
			r += dr; c += dc;
		}
	}

	return false;
}

export function isInCheck(board: Board, color: 0 | 1): boolean {
	for (let r = 0; r < 8; r++) {
		for (let c = 0; c < 8; c++) {
			if (board[r][c]?.type === 'king' && board[r][c]?.color === color) {
				return isSquareAttacked(board, r, c, color === 0 ? 1 : 0);
			}
		}
	}
	return false;
}

function cloneBoard(board: Board): Board {
	return board.map(row => row.map(sq => sq ? { ...sq } : null));
}

function cloneState(state: GameState): GameState {
	return {
		board: cloneBoard(state.board),
		turn: state.turn,
		castlingRights: { ...state.castlingRights },
		enPassantTarget: state.enPassantTarget ? [...state.enPassantTarget] as [number, number] : null
	};
}

function generatePseudoLegalMoves(state: GameState): Move[] {
	const moves: Move[] = [];
	const { board, turn } = state;

	for (let r = 0; r < 8; r++) {
		for (let c = 0; c < 8; c++) {
			const p = board[r][c];
			if (!p || p.color !== turn) continue;

			switch (p.type) {
				case 'pawn': {
					const dir = turn === 0 ? -1 : 1;
					const startRow = turn === 0 ? 6 : 1;
					const promoRow = turn === 0 ? 0 : 7;

					// Forward one
					const fr = r + dir;
					if (inBounds(fr, c) && !board[fr][c]) {
						if (fr === promoRow) {
							for (const pt of ['queen', 'rook', 'bishop', 'knight'] as PieceType[]) {
								moves.push({ from: [r, c], to: [fr, c], promotion: pt });
							}
						} else {
							moves.push({ from: [r, c], to: [fr, c] });
						}

						// Forward two from starting position
						const fr2 = r + dir * 2;
						if (r === startRow && !board[fr2][c]) {
							moves.push({ from: [r, c], to: [fr2, c] });
						}
					}

					// Diagonal captures
					for (const dc of [-1, 1]) {
						const nc = c + dc;
						if (!inBounds(fr, nc)) continue;

						if (board[fr][nc] && board[fr][nc]!.color !== turn) {
							if (fr === promoRow) {
								for (const pt of ['queen', 'rook', 'bishop', 'knight'] as PieceType[]) {
									moves.push({ from: [r, c], to: [fr, nc], promotion: pt });
								}
							} else {
								moves.push({ from: [r, c], to: [fr, nc] });
							}
						}

						// En passant
						if (state.enPassantTarget && state.enPassantTarget[0] === fr && state.enPassantTarget[1] === nc) {
							moves.push({ from: [r, c], to: [fr, nc], enPassant: true });
						}
					}
					break;
				}

				case 'knight': {
					const offsets = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
					for (const [dr, dc] of offsets) {
						const nr = r + dr, nc = c + dc;
						if (inBounds(nr, nc) && board[nr][nc]?.color !== turn) {
							moves.push({ from: [r, c], to: [nr, nc] });
						}
					}
					break;
				}

				case 'bishop': {
					const dirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
					for (const [dr, dc] of dirs) {
						let nr = r + dr, nc = c + dc;
						while (inBounds(nr, nc)) {
							if (board[nr][nc]) {
								if (board[nr][nc]!.color !== turn) moves.push({ from: [r, c], to: [nr, nc] });
								break;
							}
							moves.push({ from: [r, c], to: [nr, nc] });
							nr += dr; nc += dc;
						}
					}
					break;
				}

				case 'rook': {
					const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
					for (const [dr, dc] of dirs) {
						let nr = r + dr, nc = c + dc;
						while (inBounds(nr, nc)) {
							if (board[nr][nc]) {
								if (board[nr][nc]!.color !== turn) moves.push({ from: [r, c], to: [nr, nc] });
								break;
							}
							moves.push({ from: [r, c], to: [nr, nc] });
							nr += dr; nc += dc;
						}
					}
					break;
				}

				case 'queen': {
					const dirs = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
					for (const [dr, dc] of dirs) {
						let nr = r + dr, nc = c + dc;
						while (inBounds(nr, nc)) {
							if (board[nr][nc]) {
								if (board[nr][nc]!.color !== turn) moves.push({ from: [r, c], to: [nr, nc] });
								break;
							}
							moves.push({ from: [r, c], to: [nr, nc] });
							nr += dr; nc += dc;
						}
					}
					break;
				}

				case 'king': {
					const dirs = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
					for (const [dr, dc] of dirs) {
						const nr = r + dr, nc = c + dc;
						if (inBounds(nr, nc) && board[nr][nc]?.color !== turn) {
							moves.push({ from: [r, c], to: [nr, nc] });
						}
					}

					// Castling
					const enemy = turn === 0 ? 1 : 0;
					if (!isSquareAttacked(board, r, c, enemy)) {
						// Kingside
						const canKingside = turn === 0 ? state.castlingRights.whiteKing : state.castlingRights.blackKing;
						if (canKingside && !board[r][5] && !board[r][6] &&
							!isSquareAttacked(board, r, 5, enemy) && !isSquareAttacked(board, r, 6, enemy)) {
							moves.push({ from: [r, c], to: [r, 6], castle: 'kingside' });
						}
						// Queenside
						const canQueenside = turn === 0 ? state.castlingRights.whiteQueen : state.castlingRights.blackQueen;
						if (canQueenside && !board[r][3] && !board[r][2] && !board[r][1] &&
							!isSquareAttacked(board, r, 3, enemy) && !isSquareAttacked(board, r, 2, enemy)) {
							moves.push({ from: [r, c], to: [r, 2], castle: 'queenside' });
						}
					}
					break;
				}
			}
		}
	}

	return moves;
}

export function getValidMoves(state: GameState): Move[] {
	const pseudoMoves = generatePseudoLegalMoves(state);
	return pseudoMoves.filter(move => {
		const newState = applyMove(state, move);
		return !isInCheck(newState.board, state.turn);
	});
}

function applyMove(state: GameState, move: Move): GameState {
	const newState = cloneState(state);
	const { board } = newState;
	const [fr, fc] = move.from;
	const [tr, tc] = move.to;
	const movingPiece = board[fr][fc]!;

	// Move piece
	board[tr][tc] = movingPiece;
	board[fr][fc] = null;

	// Handle promotion
	if (move.promotion) {
		board[tr][tc] = { type: move.promotion, color: movingPiece.color };
	}

	// Handle en passant capture
	if (move.enPassant) {
		const capturedRow = movingPiece.color === 0 ? tr + 1 : tr - 1;
		board[capturedRow][tc] = null;
	}

	// Handle castling
	if (move.castle) {
		if (move.castle === 'kingside') {
			board[fr][5] = board[fr][7];
			board[fr][7] = null;
		} else {
			board[fr][3] = board[fr][0];
			board[fr][0] = null;
		}
	}

	// Update en passant target
	if (movingPiece.type === 'pawn' && Math.abs(tr - fr) === 2) {
		newState.enPassantTarget = [(fr + tr) / 2, fc];
	} else {
		newState.enPassantTarget = null;
	}

	// Update castling rights
	if (movingPiece.type === 'king') {
		if (movingPiece.color === 0) {
			newState.castlingRights.whiteKing = false;
			newState.castlingRights.whiteQueen = false;
		} else {
			newState.castlingRights.blackKing = false;
			newState.castlingRights.blackQueen = false;
		}
	}
	if (movingPiece.type === 'rook') {
		if (fr === 7 && fc === 0) newState.castlingRights.whiteQueen = false;
		if (fr === 7 && fc === 7) newState.castlingRights.whiteKing = false;
		if (fr === 0 && fc === 0) newState.castlingRights.blackQueen = false;
		if (fr === 0 && fc === 7) newState.castlingRights.blackKing = false;
	}
	// If a rook is captured, remove its castling right
	if (tr === 7 && tc === 0) newState.castlingRights.whiteQueen = false;
	if (tr === 7 && tc === 7) newState.castlingRights.whiteKing = false;
	if (tr === 0 && tc === 0) newState.castlingRights.blackQueen = false;
	if (tr === 0 && tc === 7) newState.castlingRights.blackKing = false;

	// Switch turn
	newState.turn = state.turn === 0 ? 1 : 0;

	return newState;
}

export function makeMove(state: GameState, move: Move): GameState {
	return applyMove(state, move);
}

export function getWinner(state: GameState): 0 | 1 | 'draw' | null {
	const moves = getValidMoves(state);
	if (moves.length > 0) return null;

	if (isInCheck(state.board, state.turn)) {
		// Checkmate — the other player wins
		return state.turn === 0 ? 1 : 0;
	}
	// Stalemate
	return 'draw';
}

// --- AI Evaluation ---

const PIECE_VALUES: Record<PieceType, number> = {
	pawn: 100,
	knight: 320,
	bishop: 330,
	rook: 500,
	queen: 900,
	king: 20000
};

// Piece-square tables (from white's perspective, row 0 = rank 8)
const PAWN_TABLE = [
	[0,  0,  0,  0,  0,  0,  0,  0],
	[50, 50, 50, 50, 50, 50, 50, 50],
	[10, 10, 20, 30, 30, 20, 10, 10],
	[5,  5, 10, 25, 25, 10,  5,  5],
	[0,  0,  0, 20, 20,  0,  0,  0],
	[5, -5,-10,  0,  0,-10, -5,  5],
	[5, 10, 10,-20,-20, 10, 10,  5],
	[0,  0,  0,  0,  0,  0,  0,  0]
];

const KNIGHT_TABLE = [
	[-50,-40,-30,-30,-30,-30,-40,-50],
	[-40,-20,  0,  0,  0,  0,-20,-40],
	[-30,  0, 10, 15, 15, 10,  0,-30],
	[-30,  5, 15, 20, 20, 15,  5,-30],
	[-30,  0, 15, 20, 20, 15,  0,-30],
	[-30,  5, 10, 15, 15, 10,  5,-30],
	[-40,-20,  0,  5,  5,  0,-20,-40],
	[-50,-40,-30,-30,-30,-30,-40,-50]
];

const BISHOP_TABLE = [
	[-20,-10,-10,-10,-10,-10,-10,-20],
	[-10,  0,  0,  0,  0,  0,  0,-10],
	[-10,  0, 10, 10, 10, 10,  0,-10],
	[-10,  5,  5, 10, 10,  5,  5,-10],
	[-10,  0,  5, 10, 10,  5,  0,-10],
	[-10, 10, 10, 10, 10, 10, 10,-10],
	[-10,  5,  0,  0,  0,  0,  5,-10],
	[-20,-10,-10,-10,-10,-10,-10,-20]
];

const ROOK_TABLE = [
	[0,  0,  0,  0,  0,  0,  0,  0],
	[5, 10, 10, 10, 10, 10, 10,  5],
	[-5,  0,  0,  0,  0,  0,  0, -5],
	[-5,  0,  0,  0,  0,  0,  0, -5],
	[-5,  0,  0,  0,  0,  0,  0, -5],
	[-5,  0,  0,  0,  0,  0,  0, -5],
	[-5,  0,  0,  0,  0,  0,  0, -5],
	[0,  0,  0,  5,  5,  0,  0,  0]
];

const QUEEN_TABLE = [
	[-20,-10,-10, -5, -5,-10,-10,-20],
	[-10,  0,  0,  0,  0,  0,  0,-10],
	[-10,  0,  5,  5,  5,  5,  0,-10],
	[-5,  0,  5,  5,  5,  5,  0, -5],
	[0,  0,  5,  5,  5,  5,  0, -5],
	[-10,  5,  5,  5,  5,  5,  0,-10],
	[-10,  0,  5,  0,  0,  0,  0,-10],
	[-20,-10,-10, -5, -5,-10,-10,-20]
];

const KING_TABLE = [
	[-30,-40,-40,-50,-50,-40,-40,-30],
	[-30,-40,-40,-50,-50,-40,-40,-30],
	[-30,-40,-40,-50,-50,-40,-40,-30],
	[-30,-40,-40,-50,-50,-40,-40,-30],
	[-20,-30,-30,-40,-40,-30,-30,-20],
	[-10,-20,-20,-20,-20,-20,-20,-10],
	[20, 20,  0,  0,  0,  0, 20, 20],
	[20, 30, 10,  0,  0, 10, 30, 20]
];

const PIECE_TABLES: Record<PieceType, number[][]> = {
	pawn: PAWN_TABLE,
	knight: KNIGHT_TABLE,
	bishop: BISHOP_TABLE,
	rook: ROOK_TABLE,
	queen: QUEEN_TABLE,
	king: KING_TABLE
};

function evaluatePosition(state: GameState, rootPlayer: 0 | 1): number {
	let score = 0;

	for (let r = 0; r < 8; r++) {
		for (let c = 0; c < 8; c++) {
			const p = state.board[r][c];
			if (!p) continue;

			let value = PIECE_VALUES[p.type];
			// Piece-square table value (tables are from white's perspective)
			const tableRow = p.color === 0 ? r : 7 - r;
			value += PIECE_TABLES[p.type][tableRow][c];

			if (p.color === rootPlayer) {
				score += value;
			} else {
				score -= value;
			}
		}
	}

	return score;
}

function minimax(
	state: GameState,
	rootPlayer: 0 | 1,
	maximizing: boolean,
	depth: number,
	alpha: number,
	beta: number
): number {
	const moves = getValidMoves(state);
	const winner = getWinner(state);

	if (winner !== null) {
		if (winner === 'draw') return 0;
		return winner === rootPlayer ? 100000 + depth : -100000 - depth;
	}

	if (depth === 0) {
		return evaluatePosition(state, rootPlayer);
	}

	// Order moves: captures first for better pruning
	moves.sort((a, b) => {
		const aCapture = state.board[a.to[0]][a.to[1]] ? 1 : 0;
		const bCapture = state.board[b.to[0]][b.to[1]] ? 1 : 0;
		return bCapture - aCapture;
	});

	if (maximizing) {
		let best = -Infinity;
		for (const move of moves) {
			const newState = applyMove(state, move);
			const score = minimax(newState, rootPlayer, false, depth - 1, alpha, beta);
			best = Math.max(best, score);
			alpha = Math.max(alpha, best);
			if (beta <= alpha) break;
		}
		return best;
	} else {
		let best = Infinity;
		for (const move of moves) {
			const newState = applyMove(state, move);
			const score = minimax(newState, rootPlayer, true, depth - 1, alpha, beta);
			best = Math.min(best, score);
			beta = Math.min(beta, best);
			if (beta <= alpha) break;
		}
		return best;
	}
}

function randomPlayer(state: GameState): Move {
	const moves = getValidMoves(state);
	return moves[Math.floor(Math.random() * moves.length)];
}

function minimaxPlayer(state: GameState): Move {
	const moves = getValidMoves(state);
	let bestScore = -Infinity;
	let bestMove = moves[0];
	let alpha = -Infinity;
	const beta = Infinity;

	// Order moves: captures and promotions first
	moves.sort((a, b) => {
		const aScore = (state.board[a.to[0]][a.to[1]] ? 10 : 0) + (a.promotion ? 5 : 0);
		const bScore = (state.board[b.to[0]][b.to[1]] ? 10 : 0) + (b.promotion ? 5 : 0);
		return bScore - aScore;
	});

	for (const move of moves) {
		const newState = applyMove(state, move);
		const score = minimax(newState, state.turn, false, DEPTH, alpha, beta);
		if (score > bestScore) {
			bestScore = score;
			bestMove = move;
		}
		alpha = Math.max(alpha, score);
	}

	return bestMove;
}

export function getComputerMove(state: GameState, player: string): Move {
	switch (player) {
		case 'random':
			return randomPlayer(state);
		case 'minimax':
			return minimaxPlayer(state);
		default:
			throw new Error('Invalid player selected');
	}
}
