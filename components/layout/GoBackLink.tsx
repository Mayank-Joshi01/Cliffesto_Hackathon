"use client";

import { useRouter } from "next/navigation";

export function GoBackLink() {
  const router = useRouter();

  function goBack() {
    const hasSameOriginReferrer = document.referrer
      ? new URL(document.referrer).origin === window.location.origin
      : false;

    if (window.history.length > 1 && hasSameOriginReferrer) {
      window.history.back();
      return;
    }

    router.push("/");
  }

  return (
    <button type="button" onClick={goBack} className="not-found-back">
      Go back
    </button>
  );
}
