import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation | DevStash",
  description: "Learn how to use DevStash – guides, API, and more.",
};

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e4e4ef] px-6 py-10">
      <div className="max-w-3xl mx-auto">
      <h1 className="text-4xl font-extrabold mb-2">Documentation</h1>
      <p className="text-[#8888a4] mb-4 leading-relaxed">
        Welcome to the DevStash documentation. This section will grow as we add
        more features and guides.
      </p>
      <h2 className="text-2xl font-bold mt-8 mb-3">Getting Started</h2>
      <ul className="text-[#8888a4] mb-4 leading-relaxed">
        <li>
          <a href="/register" className="text-blue-400 hover:underline">
            Create an account
          </a>
        </li>
        <li>
          <a href="/dashboard" className="text-blue-400 hover:underline">
            Explore the dashboard
          </a>
        </li>
        <li>
          <kbd className="bg-[#1e1e2e] px-2 py-0.5 rounded text-xs">⌘K</kbd> – Global search
        </li>
      </ul>
      <h2 className="text-2xl font-bold mt-8 mb-3">Coming Soon</h2>
      <ul className="text-[#8888a4] mb-4 leading-relaxed">
        <li>API reference</li>
        <li>Advanced workflows</li>
        <li>AI feature deep‑dive</li>
      </ul>
      <p className="text-[#8888a4] text-sm mt-4">
        In the meantime, feel free to reach out via{" "}
        <a href="mailto:support@devstash.com" className="text-blue-400 hover:underline">
          email
        </a>
        .
      </p>
    </div>
  </div>
  );
}