import { Suspense } from "react";
import LegalAcceptClient from "./LegalAcceptClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <LegalAcceptClient />
    </Suspense>
  );
}
