"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

export const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!); 

interface ConvexProviderWrapperProps {
  children: ReactNode;
}

export default function ConvexProviderWrapper({ children }: ConvexProviderWrapperProps) {
  return (
    <ConvexProvider client={convex}>
      {children}
    </ConvexProvider>
  );
}