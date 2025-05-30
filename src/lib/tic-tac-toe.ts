export function getWinner(squares: (string | null)[]): string | null {
    const lines = [
        // Rows
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        // Columns
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        // Diagonals
        [0, 4, 8],
        [2, 4, 6]
    ];

    for (const line of lines) {
        const [a, b, c] = line;
        if (squares[a] != null && squares[a] == squares[b] && squares[b] == squares[c]) {
            return squares[a];
        }
    }

    return null;
}

export function getDraw(squares: (string | null)[]): boolean{
    return squares.every((square) => square !== null)
}

export const computerPlayers = [
    'random',
    'minimax'
]

export function computerMove(side: string, type: string, squares: (string | null)[]) {
    const availableMoves: number[] = getAvailableMoves(squares);

    switch (type) {
        case 'random':
            return randomPlayer(availableMoves);
        
        case 'minimax':
            return minimaxPlayer(availableMoves, squares, side)

        default:
            throw Error("Invalid player selected")
    }

}

function randomPlayer(choices: number[]): number {
    const randomIndex = Math.floor(Math.random() * choices.length);
    return choices[randomIndex];
}

export function minimaxPlayer(choices: number[], squares: (string | null)[], side: string): number {
    let bestScore = -Infinity;
    let move = choices[0];

    for (const index of choices) {
        const newSquares = [...squares]
        newSquares[index] = side;

        const score = minimax(side, false, newSquares);

        if (score > bestScore) {
            bestScore = score;
            move = index;
        }
    }

    return move;
}

function minimax(side: string, maximizing: boolean, squares: (string | null)[]): number {
    const winner = getWinner(squares);
    const draw = getDraw(squares as string[]);

    if (winner !== null) {
        if (winner === side) {
            return 1;
        } else {
            return -1;
        }
    } else if (draw) {
        return 0;
    }

    const opponent = side === 'X' ? 'O' : 'X';
    const currentPlayer = maximizing ? side : opponent;
    const moves = getAvailableMoves(squares);

    if (maximizing) {
        let bestScore = -Infinity;
        for (const move of moves) {
            const newSquares = squares.slice();
            newSquares[move] = currentPlayer;
            const score = minimax(side, false, newSquares);
            bestScore = Math.max(score, bestScore);
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (const move of moves) {
            const newSquares = squares.slice();
            newSquares[move] = currentPlayer;
            const score = minimax(side, true, newSquares);
            bestScore = Math.min(score, bestScore);
        }
        return bestScore;
    }
}

function getAvailableMoves(squares: (string | null)[]): number[] {
    const moves: number[] = [];

    for (let i = 0; i < squares.length; i++) {
        if (squares[i] === null) {
            moves.push(i);
        }
    }
    
    return moves;
}