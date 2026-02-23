export async function load({ params }) {
	const essays = import.meta.glob('/src/lib/essays/*.md');
	const essay = (await essays[`/src/lib/essays/${params.slug}.md`]()) as {
		default: import('svelte').Component;
	};

	return {
		content: essay.default,
	};
}
