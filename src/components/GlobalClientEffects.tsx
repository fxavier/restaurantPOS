"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useZoerIframe } from "@/hooks/useZoerIframe";
import { Theme } from "@npm_chat2db/zoer-copilot";

function GlobalClientEffectsContent() {
  const { theme } = useTheme();

  // Global hooks
  useZoerIframe();

  const ZoerCopilot = dynamic(
    async () => {
      const mod = await import("@npm_chat2db/zoer-copilot");
      return mod.ZoerCopilot;
    },
    { ssr: false }
  );

  // Only render ZoerCopilot if we have a valid API key
  const postgrestApiKey = process.env.NEXT_PUBLIC_ZOER_API_KEY || '';
  
  if (!postgrestApiKey) {
    return null; // Don't render if no API key is provided
  }
  
  return <ZoerCopilot theme={theme as Theme} postgrestApiKey={postgrestApiKey} />;
}

export default function GlobalClientEffects() {
  return (
    <Suspense fallback={null}>
      <GlobalClientEffectsContent />
    </Suspense>
  );
}

