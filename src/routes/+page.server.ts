import { fetchContributions } from '$lib/contributions';

export async function load() {
	return { contributions: await fetchContributions() };
}
