const DEPTH = 4;

export function getPoints(color: number, squares: (number | null)[][]): number {
    let count = 0;
    for (const row of squares) {
        for (const square of row) {
            if (square === color) {
                count += 1;
            }
        }
    }
    return count;
}


export function getWinner(squares: (number | null)[][], turn: number): number | null {
    const totalSquares = squares.length * squares[0]?.length || 0;
    const blackPoints = getPoints(0, squares);
    const whitePoints = getPoints(1, squares);

    const currentMoves = getValidMoves(squares, turn);

    // Game is over when neither player has valid moves
    if (currentMoves.length === 0) {
        if (blackPoints > whitePoints) return 0;  // Black wins
        if (whitePoints > blackPoints) return 1;  // White wins
        return -1;  // Tie
    }

    // Game is over when all squares are filled
    if (blackPoints + whitePoints === totalSquares) {
        if (blackPoints > whitePoints) return 0;  // Black wins
        if (whitePoints > blackPoints) return 1;  // White wins
        return -1;  // Tie
    }

    // Game continues
    return null;
}

function getNeighboringSquares(squares: (number | null)[][], turn: number): number[][] {
    const m = squares.length;
    const opponent = turn === 0 ? 1 : 0;
    const neighboringSquares: number[][] = [];

    const directions = [
        [-1, 0], [1, 0], [0, -1], [0, 1],     // orthogonal
        [-1, -1], [-1, 1], [1, -1], [1, 1],   // diagonal
    ];

    for (let i = 0; i < m; i++) {
        for (let j = 0; j < m; j++) {
            if (squares[i][j] == null) {
                for (const [di, dj] of directions) {
                    const ni = i + di;
                    const nj = j + dj;
                    if (ni >= 0 && ni < m && nj >= 0 && nj < m && squares[ni][nj] === opponent) {
                        neighboringSquares.push([i, j]);
                        break;
                    }
                }
            }
        }
    }

    return neighboringSquares;
}

export function getValidMoves(squares: (number | null)[][], turn: number): number[][] {
    const validMoves: Set<string> = new Set();
    const opponent = turn === 0 ? 1 : 0;
    const neighborSquares = getNeighboringSquares(squares, turn);
    const m = squares.length;

    const directions = [
        [-1, 0], [1, 0], [0, -1], [0, 1],
        [-1, -1], [-1, 1], [1, -1], [1, 1],
    ];

    for (const [i, j] of neighborSquares) {
        if (validMoves.has(`${i},${j}`)) continue;

        for (const [dx, dy] of directions) {
            let ni = i + dx;
            let nj = j + dy;

            if (ni >= 0 && ni < m && nj >= 0 && nj < m && squares[ni][nj] === opponent) {
                let found = false;
                ni += dx;
                nj += dy;

                while (ni >= 0 && ni < m && nj >= 0 && nj < m) {
                    if (squares[ni][nj] === turn) {
                        found = true;
                        break;
                    } else if (squares[ni][nj] !== opponent) {
                        break;
                    }
                    ni += dx;
                    nj += dy;
                }

                if (found) {
                    validMoves.add(`${i},${j}`);
                    break;
                }
            }
        }
    }

    return Array.from(validMoves).map(coords => coords.split(",").map(Number));
}

export function flipChips(squares: (number | null)[][], turn: number, move: number[]): (number | null)[][] {
    const [i, j] = move;
    const size = squares.length;
    const opponent = turn === 0 ? 1 : 0;

    const directions = [
        [-1, 0], [1, 0], [0, -1], [0, 1],
        [-1, -1], [-1, 1], [1, -1], [1, 1],
    ];

    const newSquares = JSON.parse(JSON.stringify(squares));
    const chipsToFlip: number[][] = [];

    for (const [dr, dc] of directions) {
        let r = i + dr;
        let c = j + dc;
        const possibleFlips: number[][] = [];

        while (r >= 0 && r < size && c >= 0 && c < size && squares[r][c] === opponent) {
            possibleFlips.push([r, c]);
            r += dr;
            c += dc;
        }

        if (possibleFlips.length > 0 && r >= 0 && r < size && c >= 0 && c < size && squares[r][c] === turn) {
            chipsToFlip.push(...possibleFlips);
        }
    }

    for (const [y, x] of chipsToFlip) {
        newSquares[y][x] = turn;
    }

    newSquares[i][j] = turn;
    return newSquares;
}

function randomPlayer(squares: (number | null)[][], turn: number): number[] {
    const moves = getValidMoves(squares, turn);
    const randomIndex = Math.floor(Math.random() * moves.length);
    return moves[randomIndex];
}

function minimaxPlayer(squares: (number | null)[][], turn: number): number[] {
    const moves = getValidMoves(squares, turn);
    let bestScore = -Infinity;
    let bestMove = moves[0];
    let alpha = -Infinity;
    const beta = Infinity;

    for (const [y, x] of moves) {
        const newSquares = flipChips(JSON.parse(JSON.stringify(squares)), turn, [y, x]);
        const score = minimax(newSquares, turn, false, DEPTH, alpha, beta);

        if (score > bestScore) {
            bestScore = score;
            bestMove = [y, x];
        }

        alpha = Math.max(alpha, score);
        // No need to check beta pruning at root level since we want all moves evaluated
    }

    return bestMove;
}

// Positional weights for an 8x8 board (corners are most valuable)
const POSITION_WEIGHTS = [
    [100, -20,  10,   5,   5,  10, -20, 100],
    [-20, -50,  -2,  -2,  -2,  -2, -50, -20],
    [ 10,  -2,  -1,  -1,  -1,  -1,  -2,  10],
    [  5,  -2,  -1,  -1,  -1,  -1,  -2,   5],
    [  5,  -2,  -1,  -1,  -1,  -1,  -2,   5],
    [ 10,  -2,  -1,  -1,  -1,  -1,  -2,  10],
    [-20, -50,  -2,  -2,  -2,  -2, -50, -20],
    [100, -20,  10,   5,   5,  10, -20, 100]
];

function evaluatePosition(squares: (number | null)[][], player: number): number {
    const opponent = player === 0 ? 1 : 0;
    const boardSize = squares.length;
    
    let score = 0;
    
    // 1. Piece Count (less important in early game, more important in endgame)
    let playerPieces = 0;
    let opponentPieces = 0;
    let totalPieces = 0;
    
    // 2. Positional Value
    let positionalScore = 0;
    
    // 3. Corner Control
    let cornerScore = 0;
    const corners = [[0, 0], [0, boardSize-1], [boardSize-1, 0], [boardSize-1, boardSize-1]];
    
    // Count pieces and calculate positional score
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            if (squares[i][j] !== null) {
                totalPieces++;
                if (squares[i][j] === player) {
                    playerPieces++;
                    // Use position weights if board is 8x8, otherwise use simplified weights
                    if (boardSize === 8) {
                        positionalScore += POSITION_WEIGHTS[i][j];
                    } else {
                        // Simplified positional scoring for non-8x8 boards
                        if ((i === 0 || i === boardSize-1) && (j === 0 || j === boardSize-1)) {
                            positionalScore += 100; // Corners
                        } else if (i === 0 || i === boardSize-1 || j === 0 || j === boardSize-1) {
                            positionalScore += 10; // Edges
                        }
                    }
                } else {
                    opponentPieces++;
                    if (boardSize === 8) {
                        positionalScore -= POSITION_WEIGHTS[i][j];
                    } else {
                        if ((i === 0 || i === boardSize-1) && (j === 0 || j === boardSize-1)) {
                            positionalScore -= 100;
                        } else if (i === 0 || i === boardSize-1 || j === 0 || j === boardSize-1) {
                            positionalScore -= 10;
                        }
                    }
                }
            }
        }
    }
    
    // Corner control bonus
    for (const [i, j] of corners) {
        if (squares[i][j] === player) {
            cornerScore += 25;
        } else if (squares[i][j] === opponent) {
            cornerScore -= 25;
        }
    }
    
    // 4. Mobility (number of valid moves)
    const playerMoves = getValidMoves(squares, player).length;
    const opponentMoves = getValidMoves(squares, opponent).length;
    const mobilityScore = (playerMoves - opponentMoves) * 2;
    
    // 5. Stability (pieces that cannot be flipped)
    const stabilityScore = calculateStability(squares, player) - calculateStability(squares, opponent);
    
    // 6. Edge occupancy
    let edgeScore = 0;
    for (let i = 0; i < boardSize; i++) {
        // Top and bottom edges
        if (squares[0][i] === player) edgeScore += 5;
        else if (squares[0][i] === opponent) edgeScore -= 5;
        if (squares[boardSize-1][i] === player) edgeScore += 5;
        else if (squares[boardSize-1][i] === opponent) edgeScore -= 5;
        
        // Left and right edges
        if (squares[i][0] === player) edgeScore += 5;
        else if (squares[i][0] === opponent) edgeScore -= 5;
        if (squares[i][boardSize-1] === player) edgeScore += 5;
        else if (squares[i][boardSize-1] === opponent) edgeScore -= 5;
    }
    
    // Weight factors based on game phase
    const gamePhase = totalPieces / (boardSize * boardSize);
    const isEndgame = gamePhase > 0.8;
    const isEarlyGame = gamePhase < 0.3;
    
    if (isEndgame) {
        // In endgame, piece count matters most
        const pieceScore = ((playerPieces - opponentPieces) / (playerPieces + opponentPieces)) * 100;
        score = pieceScore * 4 + positionalScore * 0.5 + cornerScore * 2 + mobilityScore * 0.5;
    } else if (isEarlyGame) {
        // In early game, mobility and position matter most
        score = positionalScore * 2 + cornerScore * 3 + mobilityScore * 3 + stabilityScore * 2 + edgeScore;
    } else {
        // Mid game - balanced approach
        const pieceScore = ((playerPieces - opponentPieces) / Math.max(playerPieces + opponentPieces, 1)) * 50;
        score = pieceScore + positionalScore + cornerScore * 2 + mobilityScore * 2 + stabilityScore + edgeScore;
    }
    
    return Math.round(score);
}

function calculateStability(squares: (number | null)[][], player: number): number {
    const boardSize = squares.length;
    let stability = 0;
    
    // Simple stability calculation - pieces in corners and along completed edges
    const corners = [[0, 0], [0, boardSize-1], [boardSize-1, 0], [boardSize-1, boardSize-1]];
    
    for (const [i, j] of corners) {
        if (squares[i][j] === player) {
            stability += 10;
            
            // Add stability for pieces extending from secure corners
            const directions = [
                [0, 1], [0, -1], [1, 0], [-1, 0],
                [1, 1], [1, -1], [-1, 1], [-1, -1]
            ];
            
            for (const [di, dj] of directions) {
                let ni = i + di;
                let nj = j + dj;
                while (ni >= 0 && ni < boardSize && nj >= 0 && nj < boardSize && squares[ni][nj] === player) {
                    stability += 2;
                    ni += di;
                    nj += dj;
                }
            }
        }
    }
    
    return stability;
}

function minimax(
    squares: (number | null)[][], 
    rootPlayer: number, 
    maximizing: boolean, 
    depth: number,
    alpha: number,
    beta: number
): number {
    const currentPlayer = maximizing ? rootPlayer : (rootPlayer === 0 ? 1 : 0);
    const moves = getValidMoves(squares, currentPlayer);
    const winner = getWinner(squares, currentPlayer);

    // Terminal node evaluation
    if (winner !== null || depth === 0) {
        if (winner !== null) {
            if (winner === -1) return 0; // Tie
            return winner === rootPlayer ? 10000 + depth : -10000 - depth;
        }
        // Use advanced heuristic evaluation at leaf nodes
        return evaluatePosition(squares, rootPlayer);
    }

    if (moves.length === 0) {
        const opponentMoves = getValidMoves(squares, currentPlayer === 0 ? 1 : 0);
        if (opponentMoves.length === 0) {
            const finalWinner = getWinner(squares, rootPlayer);
            if (finalWinner === -1) return 0;
            return finalWinner === rootPlayer ? 10000 : -10000;
        }
        return minimax(squares, rootPlayer, !maximizing, depth - 1, alpha, beta);
    }

    if (maximizing) {
        let best = -Infinity;
        for (const [y, x] of moves) {
            const newSquares = flipChips(JSON.parse(JSON.stringify(squares)), currentPlayer, [y, x]);
            const score = minimax(newSquares, rootPlayer, false, depth - 1, alpha, beta);
            best = Math.max(best, score);
            alpha = Math.max(alpha, best);
            
            if (beta <= alpha) {
                break; // Beta cutoff
            }
        }
        return best;
    } else {
        let best = Infinity;
        for (const [y, x] of moves) {
            const newSquares = flipChips(JSON.parse(JSON.stringify(squares)), currentPlayer, [y, x]);
            const score = minimax(newSquares, rootPlayer, true, depth - 1, alpha, beta);
            best = Math.min(best, score);
            beta = Math.min(beta, best);
            
            if (beta <= alpha) {
                break; // Alpha cutoff
            }
        }
        return best;
    }
}

export function getComputerMove(squares: (number | null)[][], turn: number, player: string): number[] {
    switch (player) {
        case 'random':
            return randomPlayer(squares, turn);
        case 'minimax':
            return minimaxPlayer(squares, turn);
        default:
            throw new Error("Invalid player selected");
    }
}
