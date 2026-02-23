export async function load() {
	const essayFiles = import.meta.glob('/src/lib/essays/*.md', { eager: true });

	const essays = Object.entries(essayFiles).map(([path, module]) => {
		const slug = path.split('/').pop()!.replace('.md', '');
		const { metadata } = module as { metadata: { title: string; date: string; summary: string } };
		return {
			slug,
			title: metadata.title,
			date: metadata.date,
			summary: metadata.summary
		};
	});

	essays.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

	return { essays };
}
