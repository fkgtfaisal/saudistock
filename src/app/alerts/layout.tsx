import { requireProOrElite } from "@/lib/auth-helpers";
import { ReactNode } from "react";

export default async function AlertsLayout({ children }: { children: ReactNode }) {
  await requireProOrElite();
  return <>{children}</>;
}
