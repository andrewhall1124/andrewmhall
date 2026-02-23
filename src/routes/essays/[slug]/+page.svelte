<script lang="ts">
	let { data } = $props();
</script>

<article class="essay">
	<data.content />
</article>

<style>
	.essay {
		max-width: 700px;
		margin: 0 auto;
		padding: 2rem 1.5rem;
		font-family: system-ui, -apple-system, sans-serif;
		color: #1a1a1a;
		line-height: 1.7;
	}

	.essay :global(h1) {
		font-size: 2rem;
		font-weight: 700;
		margin: 0 0 1.5rem;
		line-height: 1.2;
	}

	.essay :global(h2) {
		font-size: 1.4rem;
		font-weight: 600;
		margin: 2rem 0 0.75rem;
		line-height: 1.3;
	}

	.essay :global(p) {
		margin: 0 0 1.25rem;
	}

	.essay :global(a) {
		color: #2563eb;
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.essay :global(a:hover) {
		color: #1d4ed8;
	}

	.essay :global(pre) {
		background: #f5f5f5;
		border-radius: 6px;
		padding: 1rem 1.25rem;
		overflow-x: auto;
		margin: 0 0 1.25rem;
		font-size: 0.875rem;
		line-height: 1.5;
	}

	.essay :global(code) {
		font-family: ui-monospace, 'Cascadia Code', 'Fira Code', Menlo, monospace;
	}

	.essay :global(:not(pre) > code) {
		background: #f0f0f0;
		padding: 0.15em 0.35em;
		border-radius: 3px;
		font-size: 0.9em;
	}
</style>
