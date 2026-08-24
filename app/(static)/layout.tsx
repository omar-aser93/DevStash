import HomeNavbar from "@/components/homepage/HomeNavbar";
import Footer from "@/components/homepage/Footer";

export default function StaticLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="bg-[#0a0a0f] text-[#e4e4ef] min-h-screen flex flex-col">
      <HomeNavbar />
      <div className="flex-1 pt-16">{children}</div>
      <Footer />
    </main>
  );
}