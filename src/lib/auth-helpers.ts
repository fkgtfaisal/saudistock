import { auth } from "@/auth";
import { redirect } from "next/navigation";

/**
 * Ensures the user has at least a PRO or ELITE subscription.
 * If they are FREE or not logged in, they are redirected to the subscriptions page.
 */
export async function requireProOrElite() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/subscriptions");
  }

  const tier = (session.user as any).subscriptionTier || "FREE";
  
  if (tier !== "PRO" && tier !== "ELITE") {
    // Redirect to subscriptions and let them know they need to upgrade
    redirect("/subscriptions?upgrade_required=PRO");
  }
}

/**
 * Ensures the user has an ELITE subscription.
 * If they are FREE, PRO or not logged in, they are redirected to the subscriptions page.
 */
export async function requireElite() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/subscriptions");
  }

  const tier = (session.user as any).subscriptionTier || "FREE";
  
  if (tier !== "ELITE") {
    // Redirect to subscriptions and let them know they need to upgrade
    redirect("/subscriptions?upgrade_required=ELITE");
  }
}
