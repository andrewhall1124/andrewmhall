<script lang="ts">
	import { computerMove, computerPlayers, getWinner, getDraw } from '$lib/tic-tac-toe';

	let side: string = $state('X');
	let opponentSide: string = $derived(side == 'X' ? 'O' : 'X');
	let type: string = $state('random');
	let squares: (null | string)[] = $state(Array(9).fill(null));
	let turn: string = $state('X');

	const sides: string[] = ['X', 'O'];

	const changeTurn = () => {
		turn = turn === 'X' ? 'O' : 'X';
	};

	function playerMove(index: number): void {
		squares[index] = turn;
		changeTurn();
	}

	let winner: string | null = $derived(getWinner(squares));
	let draw: boolean = $derived(getDraw(squares));

	const reset = () => {
		squares = Array(9).fill(null);
		turn = 'X';
	};

	$effect(() => {
		if (turn != side && winner == null) {
			const index = computerMove(opponentSide, type, squares);
			squares[index] = turn;
			changeTurn();
		}
	});
</script>

<div class="page">
	<div class="header">
		<h1>Tic-Tac-Toe</h1>
		<div>
			Player 1:
			<select bind:value={side} onchange={() => reset()}>
				{#each sides as value}
					<option {value}>{value}</option>
				{/each}
			</select>
		</div>
		<div>
			Player 2:
			<select bind:value={type} onchange={() => reset()}>
				{#each computerPlayers as value}
					<option {value}>{value}</option>
				{/each}
			</select>
		</div>
		<div>
			<button class="reset" onclick={() => reset()}> Reset </button>
		</div>
	</div>
	{#if winner !== null}
		<div>Player {winner} wins!</div>
	{:else if draw}
		<div>It's a draw!</div>
	{:else}
		<div>Player {turn} turn.</div>
	{/if}

	<div class="board">
		{#each squares as square, index}
			<button
				class="square"
				onclick={() => playerMove(index)}
				disabled={square !== null || winner !== null}
			>
				{square}
			</button>
		{/each}
	</div>
</div>

<style>
	.page {
		display: flex;
		height: 100vh;
		flex-direction: column;
		align-items: center;
		padding: 1rem;
	}

	.header {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		width: 100%;
	}

	h1 {
		font-weight: bold;
	}

	.reset {
		color: red;
	}

	.board {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
	}

	.square {
		/* class="h-16 w-16 border border-black" */
		height: 64px;
		width: 64px;
		border-color: black;
		border-width: 1px;
	}
</style>
