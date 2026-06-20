// Jest stub for react-markdown (pure-ESM) so barrel imports that transitively
// pull it in can be tested under Jest's CommonJS transform. Renders children as-is.
import type * as React from "react";

export default function ReactMarkdown({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}
