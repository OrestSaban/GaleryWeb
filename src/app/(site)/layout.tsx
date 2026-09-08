import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SetupNotice } from "@/components/SetupNotice";
import { CursorFlower } from "@/components/CursorFlower";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen justify-center bg-base px-3 py-6 sm:px-6 sm:py-9">
      <div className="w-full max-w-[1280px] bg-surface shadow-[0_1px_2px_rgba(30,28,25,0.05),0_24px_60px_-30px_rgba(30,28,25,0.28)]">
        <div className="h-[3px] bg-accent" />
        <SetupNotice />
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
        <CursorFlower />
      </div>
    </div>
  );
}
