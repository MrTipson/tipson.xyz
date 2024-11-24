// @ts-check
import { defineConfig } from 'astro/config';

import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';
import AutoImport from 'astro-auto-import';
import mdx from '@astrojs/mdx';
import MDXCodeBlocks, { mdxCodeBlockAutoImport } from 'astro-mdx-code-blocks';

// https://astro.build/config
export default defineConfig({
	integrations: [
		tailwind(),
		AutoImport({
			imports: [
				mdxCodeBlockAutoImport('@/components/CodeBlock.astro')
			],
		}),
		MDXCodeBlocks(),
		mdx()
	],
	output: 'static',
	markdown: {
		syntaxHighlight: false
	}
});