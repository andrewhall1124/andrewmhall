<script lang="ts">
	import '../app.css';

	let { children } = $props();

	const pages = [
		{
			name: 'Home',
			ref: '/'
		},
		{
			name: 'Othello',
			ref: '/othello'
		},
		{
			name: 'Tic-Tac-Toe',
			ref: '/tic-tac-toe'
		},
	];
</script>

<div class="flex gap-4 p-4 border-b">
	{#each pages as page}
		<a href={page.ref}>{page.name}</a>
	{/each}
</div>
<div>
	{@render children()}
</div>
