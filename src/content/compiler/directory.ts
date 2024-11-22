import type { SidebarEntry } from "@/layout/markdown.astro";
const devSidebar: SidebarEntry[] = [
];
const prodSidebar: SidebarEntry[] = [
	{ label: 'Intro', link: '/compiler/intro' },
	{
		label: 'Language definitions', items: [
			{ label: 'p0 language', link: '/compiler/p0-language' },
			{ label: 'p1 language', link: '/compiler/p1-language' },
		]
	},
	{
		label: 'Compilers', items: [
			{ label: 'Stage 0', link: '/compiler/p0' },
			{ label: 'Stage 1', link: '/compiler/p1' },
			{ label: 'Inspecting stage 1', link: '/compiler/p1-inspecting' },
		]
	},
	{ label: 'Running', link: '/compiler/running' },
];

const isProd = import.meta.env.PROD;
export const sidebar: SidebarEntry[] = (isProd ? [] : devSidebar).concat(prodSidebar);
