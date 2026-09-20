<script lang="ts">
	let { data } = $props();
</script>

<div class="flex size-fit flex-col gap-2 p-4">
	<div>Andrew Hall</div>
	<enhanced:img
		class="h-24 w-24 rounded-full border"
		src="$lib/assets/evil-kermit.jpg"
		alt="profile"
	/>
	<div>It's not easy being green.</div>

	{#if data.contributions}
		<a
			href="https://github.com/andrewhall1124"
			target="_blank"
			rel="noopener"
			class="mt-4 block w-fit text-green-700 no-underline hover:text-green-900"
			aria-label="GitHub contributions in the last year"
		>
			<pre class="max-w-[calc(100vw-2rem)] overflow-x-auto font-mono text-xs leading-none">{data
					.contributions.months}
{data.contributions.rows.join('\n')}

{data.contributions.total !== null
					? `${data.contributions.total} contributions in the last year`
					: ''}   {data.contributions.legend}</pre>
		</a>
	{/if}
</div>
