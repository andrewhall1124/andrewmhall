<script lang="ts">
	const projects = [
		{
			name: 'Magic 8 Ball',
			href: 'https://eightball.andrewmhall.com',
			description:
				'A Magic 8-Ball whose replies are picked by Jev, a decision model, with the full probability distribution shown under the ball.'
		},
		{
			name: 'Nameless Trading',
			href: 'https://namelesstrading.com',
			description:
				'A systematic trading operation with its own data pipelines, backtester, and live portfolio dashboard.'
		}
	];
</script>

<div class="page">
	<div class="title">Projects</div>
	<ul>
		{#each projects as project}
			<li>
				<a href={project.href} target="_blank" rel="noopener">{project.name}</a>
				<span> — {project.description}</span>
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
</style>
