<script lang="ts">
	import {
		initialGameState,
		getValidMoves,
		makeMove,
		getWinner,
		isInCheck,
		getComputerMove
	} from '$lib/chess';
	import type { Move, Piece } from '$lib/chess';

	let whitePlayer = $state('human');
	let blackPlayer = $state('minimax');
	let gameState = $state(initialGameState());
	let selectedSquare: [number, number] | null = $state(null);
	let lastMove: Move | null = $state(null);
	let promotionPending: { from: [number, number]; to: [number, number] } | null = $state(null);

	let allValidMoves = $derived(getValidMoves(gameState));
	let winner = $derived(getWinner(gameState));
	let inCheck = $derived(isInCheck(gameState.board, gameState.turn));

	let movesForSelected = $derived.by(() => {
		if (!selectedSquare) return [];
		return allValidMoves.filter(
			(m) => m.from[0] === selectedSquare![0] && m.from[1] === selectedSquare![1]
		);
	});

	const pieceSymbols: Record<number, Record<string, string>> = {
		0: { king: '♔', queen: '♕', rook: '♖', bishop: '♗', knight: '♘', pawn: '♙' },
		1: { king: '♚', queen: '♛', rook: '♜', bishop: '♝', knight: '♞', pawn: '♟' }
	};

	function pieceToUnicode(p: Piece): string {
		return pieceSymbols[p.color][p.type];
	}

	function isCurrentPlayerHuman(): boolean {
		return gameState.turn === 0 ? whitePlayer === 'human' : blackPlayer === 'human';
	}

	function handleSquareClick(row: number, col: number): void {
		if (promotionPending || winner !== null || !isCurrentPlayerHuman()) return;

		const piece = gameState.board[row][col];

		if (selectedSquare) {
			// Check if clicking a valid destination
			const move = movesForSelected.find((m) => m.to[0] === row && m.to[1] === col);
			if (move) {
				// Check if this is a pawn promotion
				if (
					gameState.board[selectedSquare[0]][selectedSquare[1]]?.type === 'pawn' &&
					(row === 0 || row === 7)
				) {
					promotionPending = { from: selectedSquare, to: [row, col] };
					return;
				}
				executeMove(move);
				return;
			}

			// Click on own piece — reselect
			if (piece && piece.color === gameState.turn) {
				selectedSquare = [row, col];
				return;
			}

			// Click elsewhere — deselect
			selectedSquare = null;
		} else {
			// Select own piece
			if (piece && piece.color === gameState.turn) {
				selectedSquare = [row, col];
			}
		}
	}

	function selectPromotion(pieceType: 'queen' | 'rook' | 'bishop' | 'knight'): void {
		if (!promotionPending) return;
		const move: Move = {
			from: promotionPending.from,
			to: promotionPending.to,
			promotion: pieceType
		};
		promotionPending = null;
		executeMove(move);
	}

	function executeMove(move: Move): void {
		gameState = makeMove(gameState, move);
		lastMove = move;
		selectedSquare = null;
	}

	function resetBoard(): void {
		gameState = initialGameState();
		selectedSquare = null;
		lastMove = null;
		promotionPending = null;
	}

	async function makeComputerMoveAsync(player: string): Promise<void> {
		return new Promise((resolve) => {
			setTimeout(() => {
				const move = getComputerMove(gameState, player);
				if (move) {
					executeMove(move);
				}
				resolve();
			}, 0);
		});
	}

	$effect(() => {
		if (gameState.turn === 0 && whitePlayer !== 'human' && winner === null) {
			makeComputerMoveAsync(whitePlayer);
		}
	});

	$effect(() => {
		if (gameState.turn === 1 && blackPlayer !== 'human' && winner === null) {
			makeComputerMoveAsync(blackPlayer);
		}
	});

	function isValidDestination(row: number, col: number): boolean {
		return movesForSelected.some((m) => m.to[0] === row && m.to[1] === col);
	}

	function isLastMove(row: number, col: number): boolean {
		if (!lastMove) return false;
		return (
			(lastMove.from[0] === row && lastMove.from[1] === col) ||
			(lastMove.to[0] === row && lastMove.to[1] === col)
		);
	}

	function isKingInCheck(row: number, col: number): boolean {
		const p = gameState.board[row][col];
		return inCheck && p?.type === 'king' && p?.color === gameState.turn;
	}

	const playerOptions = ['human', 'minimax', 'random'];

	function statusText(): string {
		if (winner === 0) return 'White wins by checkmate!';
		if (winner === 1) return 'Black wins by checkmate!';
		if (winner === 'draw') return 'Stalemate — draw!';
		const turnLabel = gameState.turn === 0 ? "White's turn" : "Black's turn";
		return inCheck ? `${turnLabel} — Check!` : turnLabel;
	}
</script>

<div class="page">
	<div class="title">Chess</div>
	<div class="optionsContainer">
		<div>White Player:</div>
		<select bind:value={whitePlayer} onchange={() => resetBoard()}>
			{#each playerOptions as opt}
				<option value={opt}>{opt}</option>
			{/each}
		</select>
	</div>
	<div class="optionsContainer">
		<div>Black Player:</div>
		<select bind:value={blackPlayer} onchange={() => resetBoard()}>
			{#each playerOptions as opt}
				<option value={opt}>{opt}</option>
			{/each}
		</select>
	</div>
	<div class="status">{statusText()}</div>
	<button class="reset" onclick={() => resetBoard()}>Reset</button>
	<div class="boardContainer">
		<div class="board">
			{#each gameState.board as row, i}
				<div class="row">
					{#each row as square, j}
						<button
							class="square"
							class:light={(i + j) % 2 === 0}
							class:dark={(i + j) % 2 === 1}
							class:selected={selectedSquare?.[0] === i && selectedSquare?.[1] === j}
							class:validMove={isValidDestination(i, j)}
							class:lastMove={isLastMove(i, j)}
							class:inCheck={isKingInCheck(i, j)}
							onclick={() => handleSquareClick(i, j)}
							aria-label={square ? `${square.color === 0 ? 'White' : 'Black'} ${square.type}` : 'Empty'}
						>
							{#if square}
								<span class="piece">{pieceToUnicode(square)}</span>
							{/if}
							{#if isValidDestination(i, j) && !square}
								<span class="dot"></span>
							{/if}
						</button>
					{/each}
				</div>
			{/each}
		</div>
		{#if promotionPending}
			<div class="promotionOverlay">
				<div class="promotionLabel">Promote to:</div>
				<div class="promotionOptions">
					{#each ['queen', 'rook', 'bishop', 'knight'] as pt}
						<button class="promotionBtn" onclick={() => selectPromotion(pt as 'queen' | 'rook' | 'bishop' | 'knight')}>
							{pieceSymbols[gameState.turn][pt]}
						</button>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem;
		align-items: start;
	}

	.title {
		font-weight: bold;
	}

	div {
		font-size: medium;
	}

	.optionsContainer {
		display: flex;
	}

	.status {
		font-weight: bold;
	}

	.boardContainer {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 100%;
	}

	.board {
		display: flex;
		flex-direction: column;
		width: fit-content;
		border: 2px solid #333;
	}

	.row {
		display: flex;
	}

	.square {
		height: 3rem;
		width: 3rem;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 0;
		border: none;
		cursor: pointer;
		position: relative;
	}

	.light {
		background-color: #f0d9b5;
	}

	.dark {
		background-color: #b58863;
	}

	.selected {
		background-color: #7fc97f !important;
	}

	.validMove {
		background-color: #aad4aa !important;
	}

	.lastMove {
		background-color: #cdd26a !important;
	}

	.inCheck {
		background-color: #e74c3c !important;
	}

	.piece {
		font-size: 1.8rem;
		line-height: 1;
		user-select: none;
	}

	.dot {
		width: 0.6rem;
		height: 0.6rem;
		border-radius: 50%;
		background-color: rgba(0, 0, 0, 0.25);
	}

	.promotionOverlay {
		margin-top: 0.5rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.promotionLabel {
		font-weight: bold;
	}

	.promotionOptions {
		display: flex;
		gap: 0.25rem;
	}

	.promotionBtn {
		font-size: 1.8rem;
		padding: 0.25rem 0.5rem;
		cursor: pointer;
		border: 1px solid #333;
		background: #f0d9b5;
		border-radius: 4px;
	}

	.promotionBtn:hover {
		background: #d4a76a;
	}

	.reset {
		color: red;
		cursor: pointer;
	}
</style>
