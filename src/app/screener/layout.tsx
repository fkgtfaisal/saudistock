import { requireProOrElite } from "@/lib/auth-helpers";
import { ReactNode } from "react";

export default async function ScreenerLayout({ children }: { children: ReactNode }) {
  await requireProOrElite();
  return <>{children}</>;
}
