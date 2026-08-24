import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changelog | DevStash",
  description: "What's new in DevStash – latest features and improvements.",
};

const CHANGELOG = [
  {
    version: "0.3.0",
    date: "2026-08-24",
    changes: [
      "Added homepage with hero, features, AI section, pricing, and CTA",
      "Added About, Privacy, Terms, and Changelog pages",
      "Improved mobile navigation",
    ],
  },
  {
    version: "0.2.0",
    date: "2026-08-20",
    changes: [
      "Added full‑text search with Cmd+K command palette",
      "Added file/image upload with Cloudflare R2",
      "Added pagination for items and collections",
    ],
  },
  {
    version: "0.1.0",
    date: "2026-08-10",
    changes: [
      "Initial release of DevStash",
      "Core features: items, collections, tags, favorites",
      "Authentication with email and GitHub",
    ],
  },
];

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e4e4ef] px-6 py-24">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-extrabold mb-3">Changelog</h1>
        <p className="text-[#8888a4] mb-4 leading-relaxed">All notable changes to DevStash.</p>
        <div className="space-y-8 mt-6">
            {CHANGELOG.map((entry) => (
            <div key={entry.version} className="border-b border-[#1e1e2e] pb-6 last:border-0">
                <h2 className="text-2xl font-bold mt-8 mb-3">
                v{entry.version}{" "}
                <span className="text-sm font-normal text-[#8888a4]">
                    {new Date(entry.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    })}
                </span>
                </h2>
                <ul className="list-disc list-inside space-y-1 text-[#8888a4]">
                {entry.changes.map((change, idx) => (
                    <li key={idx}>{change}</li>
                ))}
                </ul>
            </div>
            ))}
        </div>
        </div>
    </div>
  );
}