import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { icsLoader } from './loaders/ics';

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			// Transform string to Date object
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: z.optional(image()),
		}),
});

const events = defineCollection({
	// Fetched from the published Outlook calendar on every build.
	loader: icsLoader({ url: import.meta.env.EVENTS_ICS_URL ?? process.env.EVENTS_ICS_URL }),
	schema: z.object({
		title: z.string(),
		start: z.coerce.date(),
		end: z.coerce.date(),
		allDay: z.boolean(),
		location: z.string().optional(),
		description: z.string().optional(),
	}),
});

export const collections = { blog, events };
