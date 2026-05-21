import { requireElite } from "@/lib/auth-helpers";
import { ReactNode } from "react";

export default async function AIAnalysisLayout({ children }: { children: ReactNode }) {
  await requireElite();
  return <>{children}</>;
}
