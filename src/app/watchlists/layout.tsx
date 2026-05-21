import { requireProOrElite } from "@/lib/auth-helpers";
import { ReactNode } from "react";

export default async function WatchlistsLayout({ children }: { children: ReactNode }) {
  await requireProOrElite();
  return <>{children}</>;
}
