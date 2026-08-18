import { z } from "zod";

export const tagSchema = z.array(z.string().trim().min(1)).default([]);

export const baseItemFields = {
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().optional().nullable(),
  tags: tagSchema,
};

// Create schema – includes typeName and fields based on type
export const createItemSchema = z
  .object({
    typeName: z.string().min(1, "Type is required"),
    title: baseItemFields.title,
    description: baseItemFields.description,
    tags: baseItemFields.tags,
    content: z.string().optional().nullable(),
    url: z.string().url("Invalid URL").optional().nullable(),
    language: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    const type = data.typeName.toLowerCase();
    if (type === "link" && (!data.url || data.url.trim() === "")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "URL is required for links",
        path: ["url"],
      });
    }
    // For TEXT types, content is optional – we accept empty string.
  });

// Update schema – all fields optional
export const updateItemSchema = z
  .object({
    title: baseItemFields.title.optional(),
    description: baseItemFields.description.optional(),
    tags: baseItemFields.tags.optional(),
    content: z.string().optional().nullable(),
    url: z.string().url("Invalid URL").optional().nullable(),
    language: z.string().optional().nullable(),
    isFavorite: z.boolean().optional(),
    isPinned: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });