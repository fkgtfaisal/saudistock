"use server";

export async function getMoyasarKeysAction() {
  // Read at runtime to bypass Next.js static build caching of NEXT_PUBLIC variables
  return {
    publishableKey: process.env.NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY || process.env.MOYASAR_PUBLISHABLE_KEY || "pk_test_EtHFV4BuPQokJT6jiROls87Y",
  };
}
