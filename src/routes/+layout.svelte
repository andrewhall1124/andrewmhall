<script lang="ts">
	import '../app.css';

	let { children } = $props();

	const pages = [
		{
			name: 'Home',
			ref: '/'
		},
		{
			name: 'Projects',
			ref: '/projects'
		},
		{
			name: 'Games',
			ref: '/games'
		},
		{
			name: 'Essays',
			ref: '/essays'
		}
	];
</script>

<div class="flex gap-4 border-b p-4">
	{#each pages as page}
		<a href={page.ref}>{page.name}</a>
	{/each}
</div>
<div>
	{@render children()}
</div>
