"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DepositRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/funds");
  }, [router]);

  return null;
}
