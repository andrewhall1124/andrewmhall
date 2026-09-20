<script lang="ts">
	import { papers } from '$lib/papers';

	let { data } = $props();
</script>

<div class="page">
	<div class="title">Essays</div>
	<ul>
		{#each data.essays as essay}
			<li>
				<a href="/essays/{essay.slug}">{essay.title}</a>
				<span> — {essay.date}</span>
			</li>
		{/each}
	</ul>

	<div class="title section">Papers</div>
	<ul>
		{#each papers as paper}
			<li>
				<a href="/papers/{paper.file}" target="_blank" rel="noopener">{paper.title}</a>
				<span> — {paper.date}</span>
				<span> — {paper.description}</span>
			</li>
		{/each}
	</ul>
</div>

<style>
	.title {
		font-weight: bold;
	}

	.page {
		padding: 1rem;
	}

	.section {
		margin-top: 1.5rem;
	}
</style>
