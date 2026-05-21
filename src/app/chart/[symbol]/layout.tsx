import { requireProOrElite } from "@/lib/auth-helpers";
import { ReactNode } from "react";

export default async function ChartLayout({ children }: { children: ReactNode }) {
  await requireProOrElite();
  return <>{children}</>;
}
