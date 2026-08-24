// import { Metadata } from "next";

// export const metadata: Metadata = {
//   title: "Terms of Service | DevStash",
//   description: "DevStash terms of service.",
// };

// export default function TermsPage() {
//   return (
//     <div className="min-h-screen bg-[#0a0a0f] text-[#e4e4ef] px-6 py-24">
//       <div className="max-w-3xl mx-auto">
//         <h1 className="text-4xl font-extrabold mb-6">Terms of Service</h1>
//         <p className="text-[#8888a4] mb-4 leading-relaxed">
//           By using DevStash, you agree to the following terms.
//         </p>
//         <h2 className="text-2xl font-bold mt-8 mb-3">Acceptance of Terms</h2>
//         <p className="text-[#8888a4] mb-4 leading-relaxed">
//           By accessing or using DevStash, you agree to be bound by these terms. If you do not agree, please do not use the service.
//         </p>
//         <h2 className="text-2xl font-bold mt-8 mb-3">User Responsibilities</h2>
//         <ul className="list-disc pl-6 text-[#8888a4] space-y-2">
//           <li>You are responsible for the content you store.</li>
//           <li>You must not upload illegal or harmful content.</li>
//           <li>You must not misuse the service (e.g., excessive API calls, scraping).</li>
//         </ul>
//         <h2 className="text-2xl font-bold mt-8 mb-3">Account Termination</h2>
//         <p className="text-[#8888a4] mb-4 leading-relaxed">
//           We reserve the right to suspend or terminate accounts that violate these terms.
//         </p>
//         <p className="text-[#8888a4] mt-8 text-sm">Last updated: {new Date().toLocaleDateString()}</p>
//       </div>
//     </div>
//   );
// }

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | DevStash",
  description: "DevStash terms of service – your agreement with us.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e4e4ef] px-6 py-24">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-extrabold mb-2">Terms of Service</h1>
        <p className="text-[#8888a4] mb-4 leading-relaxed"><strong>Last updated:</strong> {new Date().toLocaleDateString()}</p>
        <p className="text-[#8888a4] mb-4 leading-relaxed">
          By using DevStash, you agree to these terms. Please read them carefully.
        </p>
        <h2 className="text-2xl font-bold mt-8 mb-3">1. Your account</h2>
         <p className="text-[#8888a4] mb-4 leading-relaxed">
          You are responsible for your account credentials and for all activity
          that occurs under your account.
        </p>
        <h2 className="text-2xl font-bold mt-8 mb-3">2. Content ownership</h2>
        <p className="text-[#8888a4] mb-4 leading-relaxed">
          You retain full ownership of all content you create. We do not claim any
          rights to your data.
        </p>
        <h2 className="text-2xl font-bold mt-8 mb-3">3. Fair use</h2>
        <p className="text-[#8888a4] mb-4 leading-relaxed">
          We reserve the right to suspend accounts that violate our fair use policy,
          such as abusive behaviour or attempting to bypass our limits.
        </p>
        <h2 className="text-2xl font-bold mt-8 mb-3">4. Changes to terms</h2>
        <p className="text-[#8888a4] mb-4 leading-relaxed">
          We may update these terms from time to time. Continued use of DevStash
          constitutes acceptance of the updated terms.
        </p>
      </div>
    </div>
  );
}