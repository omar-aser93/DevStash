import { z } from "zod";

export const tagSchema = z.array(z.string().trim().min(1)).default([]);

export const baseItemFields = {
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().optional().nullable(),
  tags: tagSchema,
};

export const fileFields = {
  fileUrl: z.url().optional().nullable(),
  fileName: z.string().optional().nullable(),
  fileSize: z.number().int().nonnegative().optional().nullable(),
  fileKey: z.string().optional().nullable(),
};


// Create schema – includes typeName and fields based on type
export const createItemSchema = z
  .object({
    typeName: z.string().min(1, "Type is required"),
    title: baseItemFields.title,
    description: baseItemFields.description,
    tags: baseItemFields.tags,
    content: z.string().optional().nullable(),
    url: z.url("Invalid URL").optional().nullable(),
    language: z.string().optional().nullable(),
    fileUrl: fileFields.fileUrl,
    fileName: fileFields.fileName,
    fileSize: fileFields.fileSize,   
    fileKey: fileFields.fileKey, 
    collectionIds: z.array(z.string()).optional().default([]),
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
    if (
      (type === "file" || type === "image") && (!data.fileUrl || !data.fileName) ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${type === "image" ? "Image" : "File"} upload is required`,
        path: ["fileUrl"],
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
    url: z.url("Invalid URL").optional().nullable(),
    language: z.string().optional().nullable(),
    fileUrl: fileFields.fileUrl,
    fileName: fileFields.fileName,
    fileSize: fileFields.fileSize,
    fileKey: fileFields.fileKey,
    isFavorite: z.boolean().optional(),
    isPinned: z.boolean().optional(),
    collectionIds: z.array(z.string()).optional().default([]),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });


/*********************************************************/

// Create collection schema
export const createCollectionSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().optional().nullable(),
  defaultTypeId: z.string().optional().nullable(), // optional for now
});

// Update collection schema
export const updateCollectionSchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().trim().optional().nullable(),
  isFavorite: z.boolean().optional(),
  defaultTypeId: z.string().optional().nullable(),
});


/*********************************************************/

// Change password schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});


// Editor preferences schema
export const editorPreferencesSchema = z.object({
  fontSize: z.number().int().min(8).max(24).default(13),
  tabSize: z.number().int().min(1).max(8).default(2),
  wordWrap: z.boolean().default(true),
  minimap: z.boolean().default(false),
  theme: z.enum(["vs-dark", "monokai", "github-dark"]).default("vs-dark"),
});

