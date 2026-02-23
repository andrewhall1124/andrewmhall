<script lang="ts">
	let { data } = $props();
</script>

<h1>Essays</h1>
<ul>
	{#each data.essays as essay}
		<li>
			<a href="/essays/{essay.slug}">{essay.title}</a>
			<span> — {essay.date}</span>
		</li>
	{/each}
</ul>
