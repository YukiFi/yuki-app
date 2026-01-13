"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  return (
    <div className="relative z-10">
      {!isLoginPage && <Navbar />}
      <main className={isLoginPage ? "" : "pt-8 px-2 mx-auto"}>
        {children}
      </main>
    </div>
  );
}

