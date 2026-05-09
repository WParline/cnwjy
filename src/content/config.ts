import { defineCollection, z } from "astro:content";

const posts = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()).optional(),
    category: z.string().optional(),
    coverImage: z.string().optional(),
    draft: z.boolean().optional().default(false),
  }),
});

export const collections = { posts };
