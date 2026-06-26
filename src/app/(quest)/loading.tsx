"use client";

import { TFLoader } from "@/features/quest";

export default function Loading() {
  return (
    <div className="fixed inset-0 grid place-items-center bg-black z-50">
      <TFLoader />
    </div>
  );
}
