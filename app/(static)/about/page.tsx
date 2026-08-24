import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About | DevStash",
  description: "Learn about DevStash – your developer knowledge hub.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e4e4ef] px-6 py-24">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-extrabold mb-3">About DevStash</h1>
        <p className="text-[#8888a4] mb-4 leading-relaxed">
          DevStash is a centralized developer knowledge hub built for developers who
          are tired of losing their best work across scattered tools.
        </p>
        <p className="text-[#8888a4] mb-4 leading-relaxed">
          We believe that your snippets, prompts, commands, notes, and files should
          live in one place – fast, searchable, and always at your fingertips.
        </p>
        <h2 className="text-2xl font-bold mt-8 mb-3">Our Mission</h2>
        <p className="text-[#8888a4] mb-4 leading-relaxed">
          To make developers more productive by eliminating context‑switching and
          providing a single source of truth for all their knowledge assets.
        </p>
        <h2 className="text-2xl font-bold mt-8 mb-3">Why DevStash?</h2>
        <ul className="text-[#8888a4] mb-4 leading-relaxed">
          <li>Built for developers, by developers.</li>
          <li>Full‑text search across everything (Cmd+K).</li>
          <li>AI‑powered features to supercharge your workflow.</li>
          <li>Privacy‑first – you own your data.</li>
        </ul>
      </div>
    </div>
  );
}