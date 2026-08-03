export type ContentType = "text" | "url" | "file";

export interface MockUser {
  id: string;
  name: string;
  email: string;
  imageUrl: string | null;
  isPro: boolean;
}

export interface MockItemType {
  id: string;
  name: string;
  slug: string;
  contentType: ContentType;
  icon: string;
  color: string;
  isSystem: boolean;
}

export interface MockCollection {
  id: string;
  name: string;
  description: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MockItem {
  id: string;
  title: string;
  description: string;
  contentType: ContentType;
  content: string | null;
  url: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  language: string | null;
  itemTypeId: string;
  collectionIds: string[];
  tags: string[];
  isFavorite: boolean;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MockDashboardData {
  currentUser: MockUser;
  itemTypes: MockItemType[];
  collections: MockCollection[];
  items: MockItem[];
}

export const mockDashboardData: MockDashboardData = {
  currentUser: {
    id: "user-john-doe",
    name: "John Doe",
    email: "john@example.com",
    imageUrl: null,
    isPro: true,
  },
  itemTypes: [
    { id: "snippet", name: "Snippet", slug: "snippets", contentType: "text", icon: "Code", color: "#3b82f6", isSystem: true },
    { id: "prompt", name: "Prompt", slug: "prompts", contentType: "text", icon: "Sparkles", color: "#8b5cf6", isSystem: true },
    { id: "command", name: "Command", slug: "commands", contentType: "text", icon: "Terminal", color: "#f97316", isSystem: true },
    { id: "note", name: "Note", slug: "notes", contentType: "text", icon: "StickyNote", color: "#fde047", isSystem: true },
    { id: "file", name: "File", slug: "files", contentType: "file", icon: "File", color: "#6b7280", isSystem: true },
    { id: "image", name: "Image", slug: "images", contentType: "file", icon: "Image", color: "#ec4899", isSystem: true },
    { id: "link", name: "Link", slug: "links", contentType: "url", icon: "Link", color: "#10b981", isSystem: true },
  ],
  collections: [
    { id: "react-patterns", name: "React Patterns", description: "Common React patterns and hooks", isFavorite: true, createdAt: "2026-01-05T09:00:00.000Z", updatedAt: "2026-01-15T10:30:00.000Z" },
    { id: "python-snippets", name: "Python Snippets", description: "Useful Python code snippets", isFavorite: false, createdAt: "2026-01-07T09:00:00.000Z", updatedAt: "2026-01-14T08:45:00.000Z" },
    { id: "context-files", name: "Context Files", description: "AI context files for projects", isFavorite: true, createdAt: "2026-01-08T09:00:00.000Z", updatedAt: "2026-01-13T15:10:00.000Z" },
    { id: "interview-prep", name: "Interview Prep", description: "Technical interview preparation", isFavorite: false, createdAt: "2026-01-10T09:00:00.000Z", updatedAt: "2026-01-12T16:20:00.000Z" },
    { id: "git-commands", name: "Git Commands", description: "Frequently used git commands", isFavorite: true, createdAt: "2026-01-11T09:00:00.000Z", updatedAt: "2026-01-15T09:15:00.000Z" },
    { id: "ai-prompts", name: "AI Prompts", description: "Curated AI prompts for coding", isFavorite: false, createdAt: "2026-01-12T09:00:00.000Z", updatedAt: "2026-01-15T11:00:00.000Z" },
  ],
  items: [
    {
      id: "use-auth-hook",
      title: "useAuth Hook",
      description: "Custom authentication hook for React applications",
      contentType: "text",
      content: "export function useAuth() {\n  // Authentication state and helpers\n}",
      url: null,
      fileUrl: null,
      fileName: null,
      fileSize: null,
      language: "tsx",
      itemTypeId: "snippet",
      collectionIds: ["react-patterns"],
      tags: ["react", "auth", "hooks"],
      isFavorite: true,
      isPinned: true,
      createdAt: "2026-01-10T09:00:00.000Z",
      updatedAt: "2026-01-15T10:30:00.000Z",
    },
    {
      id: "api-error-handling",
      title: "API Error Handling Pattern",
      description: "Fetch wrapper with exponential backoff retry logic",
      contentType: "text",
      content: "async function fetchWithRetry(url: string) {\n  // Retry failed requests with backoff\n}",
      url: null,
      fileUrl: null,
      fileName: null,
      fileSize: null,
      language: "ts",
      itemTypeId: "snippet",
      collectionIds: ["react-patterns", "interview-prep"],
      tags: ["api", "error-handling", "typescript"],
      isFavorite: false,
      isPinned: true,
      createdAt: "2026-01-08T09:00:00.000Z",
      updatedAt: "2026-01-12T14:15:00.000Z",
    },
    {
      id: "rebase-before-push",
      title: "Rebase before pushing",
      description: "Update a feature branch with the latest main branch commits",
      contentType: "text",
      content: "git fetch origin\ngit rebase origin/main",
      url: null,
      fileUrl: null,
      fileName: null,
      fileSize: null,
      language: "bash",
      itemTypeId: "command",
      collectionIds: ["git-commands"],
      tags: ["git", "rebase"],
      isFavorite: true,
      isPinned: false,
      createdAt: "2026-01-11T11:00:00.000Z",
      updatedAt: "2026-01-15T09:15:00.000Z",
    },
    {
      id: "project-context-template",
      title: "Project Context Template",
      description: "A starter context file for AI-assisted projects",
      contentType: "file",
      content: null,
      url: null,
      fileUrl: "/mock/project-context.md",
      fileName: "project-context.md",
      fileSize: 2048,
      language: "markdown",
      itemTypeId: "file",
      collectionIds: ["context-files", "ai-prompts"],
      tags: ["ai", "context", "template"],
      isFavorite: false,
      isPinned: false,
      createdAt: "2026-01-09T13:00:00.000Z",
      updatedAt: "2026-01-13T15:10:00.000Z",
    },
    {
      id: "interview-story-framework",
      title: "STAR Story Framework",
      description: "Structure behavioral interview answers with Situation, Task, Action, and Result",
      contentType: "text",
      content: "Use STAR to keep answers concise and outcome-focused.",
      url: null,
      fileUrl: null,
      fileName: null,
      fileSize: null,
      language: null,
      itemTypeId: "note",
      collectionIds: ["interview-prep"],
      tags: ["interview", "career"],
      isFavorite: false,
      isPinned: false,
      createdAt: "2026-01-10T16:00:00.000Z",
      updatedAt: "2026-01-12T16:20:00.000Z",
    },
    {
      id: "code-review-prompt",
      title: "Code Review Prompt",
      description: "Ask an AI to review code for correctness, security, and maintainability",
      contentType: "text",
      content: "Review this code. Identify bugs, security concerns, and practical improvements.",
      url: null,
      fileUrl: null,
      fileName: null,
      fileSize: null,
      language: null,
      itemTypeId: "prompt",
      collectionIds: ["ai-prompts"],
      tags: ["ai", "code-review"],
      isFavorite: false,
      isPinned: false,
      createdAt: "2026-01-12T12:00:00.000Z",
      updatedAt: "2026-01-15T11:00:00.000Z",
    },
  ],
};

export const { collections, currentUser, items, itemTypes } = mockDashboardData;
