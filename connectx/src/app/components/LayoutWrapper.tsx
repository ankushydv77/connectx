"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const fullScreenRoutes = ["/dashboard", "/meet-v2", "/chat", "/profile"];
  const isFullScreen = fullScreenRoutes.some(route => pathname?.startsWith(route));

  return (
    <>
      {!isFullScreen && <Navbar />}
      <div className={isFullScreen ? "" : "pt-28"}>{children}</div>
    </>
  );
}
