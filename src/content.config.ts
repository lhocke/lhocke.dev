import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    tag: z.string(),              // e.g. "Live · Playable"
    blurb: z.string(),
    href: z.string().optional(),  // omitted = no outbound link
    linkLabel: z.string().optional(),
    order: z.number(),
  }),
});

const notes = defineCollection({
  loader: glob({ base: './src/content/notes', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    dek: z.string(),                       // italic kicker under the title
    abstract: z.string(),                  // TL;DR box + meta description
    tags: z.array(z.string()).default([]), // source-tool pills
    publishDate: z.coerce.date().optional(),
    order: z.number().default(0),
    draft: z.boolean().default(false),     // excluded from the index in prod
  }),
});

export const collections = { projects, notes };
