<script lang="ts">
  import {
    getPoints,
    getWinner,
    getValidMoves,
    getComputerMove,
    flipChips,
  } from "$lib/othello";

  function createSquares(
    m: number,
    n: number,
    v: number | null
  ): (number | null)[][] {
    const squares = Array(n)
      .fill(0)
      .map(() => Array(m).fill(v));

    let i = 0;
    for (const [y, x] of centerSquares) {
      let color = i % 2 == 0 ? 1 : 0;
      squares[y][x] = color;
      i += 1;
    }
    return squares;
  }

  let gameSize = $state(8);
  let blackPlayer = $state("human");
  let whitePlayer = $state("minimax");
  let centerSquares = $derived.by(() => {
    return [
      [gameSize / 2 - 1, gameSize / 2 - 1], // Upper Left
      [gameSize / 2 - 1, gameSize / 2], // Upper Right
      [gameSize / 2, gameSize / 2], // Bottom Right
      [gameSize / 2, gameSize / 2 - 1], // Bottom Left
    ];
  });

  let turn = $state(0);
  let squares = $derived(createSquares(gameSize, gameSize, null));
  let validMoves = $derived(getValidMoves(squares, turn));
  let lastMove: (number | null)[] = $state([null]);
  let whitePoints = $derived(getPoints(0, squares));
  let blackPoints = $derived(getPoints(1, squares));
  let winner = $derived(getWinner(squares, turn));

  function squareToColor(value: number | null): string {
    if (value != null) {
      return value == 0 ? "black" : "white";
    } else {
      return "";
    }
  }

  function move(coordinates: number[]): void {
    lastMove = coordinates;
    const [i, j] = coordinates;
    const newSquares = JSON.parse(JSON.stringify(squares));
    newSquares[i][j] = turn;
    squares = flipChips(newSquares, turn, [i, j]);
    changeTurn();
  }

  function changeTurn(): void {
    if (turn == 0) {
      turn = 1;
    } else {
      turn = 0;
    }
  }

  function isValidSquare(i: number, j: number): boolean {
    for (const move of validMoves) {
      if (i == move[0] && j == move[1]) {
        return true;
      }
    }
    return false;
  }

  function isLastSquare(i: number, j: number): boolean {
    return i == lastMove[0] && j == lastMove[1];
  }

  function resetBoard(): void {
    squares = createSquares(gameSize, gameSize, null);
    turn = 0;
    lastMove = [null];
  }

  $effect(() => {
    if (turn == 0 && blackPlayer != "human" && winner == null) {
      const computerMove = getComputerMove(squares, turn, blackPlayer);
      if (computerMove) {
        move(computerMove);
      }
    }
  });

  $effect(() => {
    if (turn == 1 && whitePlayer != "human" && winner == null) {
      const computerMove = getComputerMove(squares, turn, whitePlayer);
      if (computerMove) {
        move(computerMove);
      }
    }
  });

  const gameSizeOptions = [
    { value: 8, name: "8x8" },
    { value: 6, name: "6x6" },
    { value: 4, name: "4x4" },
  ];

  const playerOptions = ["human", "minimax", "random"];
  // $inspect(lastMove)
  // $inspect(winner)
  // $inspect(turn)
  // $inspect(blackPlayer)
  // $inspect(whitePlayer)
</script>

<div class="page">
  <div class="title">Othello</div>
  <div class="optionsContainer">
    <div>Game Board Size:</div>
    <select bind:value={gameSize} onchange={() => resetBoard()}>
      {#each gameSizeOptions as gameSizeOption}
        <option value={gameSizeOption.value}>{gameSizeOption.name}</option>
      {/each}
    </select>
  </div>
  <div class="optionsContainer">
    <div>Black Player:</div>
    <select bind:value={blackPlayer} onchange={() => resetBoard()}>
      {#each playerOptions as playerOption}
        <option value={playerOption}>{playerOption}</option>
      {/each}
    </select>
  </div>
  <div class="optionsContainer">
    <div>White Player:</div>
    <select bind:value={whitePlayer} onchange={() => resetBoard()}>
      {#each playerOptions as playerOption}
        <option value={playerOption}>{playerOption}</option>
      {/each}
    </select>
  </div>
  <div class="scoreBoard">
    <div class="title">Score</div>
    <div class="score">Black: {whitePoints} {turn == 0 ? "🟢" : ""}</div>
    <div class="score">White: {blackPoints} {turn == 1 ? "🟢" : ""}</div>
  </div>
  <button class='reset' onclick={() => resetBoard()}>Reset</button>
  <div class="boardContainer">
    <div class="board">
      {#each squares as row, i}
        <div class="row">
          {#each row as square, j}
            <button
              disabled={!isValidSquare(i, j)}
              class={`square ${isValidSquare(i, j) && "valid"} ${isLastSquare(i, j) && "lastSquare"}`}
              onclick={() => move([i, j])}
              aria-label={squareToColor(square)}
            >
              <div class={`circle ${squareToColor(square)}`}></div>
            </button>
          {/each}
        </div>
      {/each}
    </div>
    {#if winner != null}
      <div class="winner">{squareToColor(winner)} player wins!</div>
    {/if}
  </div>
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    /* gap: .5rem; */
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

  .scoreBoard {
    width: 100%;
    display: flex;
    flex-direction: column;
  }

  .boardContainer {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
  }

  .board {
    background-color: lightgreen;
    display: flex;
    flex-direction: column;
    width: fit-content;
    border: 1px solid black;
  }

  .row {
    display: flex;
  }

  .square {
    border: 1px solid black;
    height: 50px;
    width: 50px;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0;
    cursor: pointer;
  }

  .valid {
    background-color: lightblue;
  }

  .lastSquare {
    background-color: lightcoral;
  }

  .circle {
    height: 75%;
    width: 75%;
    border-radius: 50%;
  }

  .black {
    background-color: black;
  }

  .white {
    background-color: white;
  }

  .reset {
      color: red;
      cursor: pointer;
  }
</style>
