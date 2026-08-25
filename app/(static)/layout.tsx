import HomeNavbar from "@/components/homepage/HomeNavbar";
import Footer from "@/components/homepage/Footer";
import { auth } from "@/lib/auth";

export default async function StaticLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user ?? null;
  return (
    <main className="bg-[#0a0a0f] text-[#e4e4ef] min-h-screen flex flex-col">
      <HomeNavbar user={user}/>
      <div className="flex-1 pt-16">{children}</div>
      <Footer />
    </main>
  );
}