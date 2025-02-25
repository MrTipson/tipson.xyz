import { z, defineCollection, reference } from 'astro:content';

const changeSchema = z.array(z.object({
	author: reference('authors'),
	date: z.date(),
	comment: z.string(),
}));
export type ChangeType = z.infer<typeof changeSchema>;


const markdownSchema = z.object({
	title: z.string(),
	description: z.string(),
	draft: z.boolean(),
	changes: changeSchema,
});
export type MarkdownType = z.infer<typeof markdownSchema>;


const authorSchema = z.object({
	'display-name': z.string(),
});
export type AuthorType = z.infer<typeof authorSchema>;

export const collections = {
	'compiler': defineCollection({
		type: 'content',
		schema: markdownSchema,
	}),
	'authors': defineCollection({
		type: 'data',
		schema: authorSchema,
	}),
	'projects': defineCollection({
		type: 'content',
		schema: z.object({
			title: z.string(),
			technologies: z.array(z.string()),
			links: z.record(z.string(), z.string()).default({}),
			image: z.string().optional(),
		}),
	}),
	'simple': defineCollection({
		type: 'content',
	})
};