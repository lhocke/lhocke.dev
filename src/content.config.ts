import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    tag: z.string(),              // e.g. "Live · Playable"
    blurb: z.string(),
    href: z.string().optional(),  // omitted = no outbound link (e.g. athena)
    linkLabel: z.string().optional(),
    order: z.number(),
  }),
});

export const collections = { projects };
