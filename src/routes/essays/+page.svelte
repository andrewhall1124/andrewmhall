<script lang="ts">
	let { data } = $props();
</script>

<style>
	.title {
		font-weight: bold;
	}

	.page {
		padding: 1rem;
	}
</style>
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
</div>
