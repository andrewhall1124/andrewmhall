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
			name: 'Tic Tac Toe',
			ref: '/tic-tac-toe'
		},
		{
			name: 'Photos',
			ref: '/photos'
		}
	];
</script>

<div class="flex gap-4 p-4">
	{#each pages as page}
		<a class="" href={page.ref}>{page.name}</a>
	{/each}
</div>
<div class="px-4">
	{@render children()}
</div>
