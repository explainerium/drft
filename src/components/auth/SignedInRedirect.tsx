"use client";

import { useEffect } from "react";
import { useIsClient } from "@/hooks/useIsClient";
import { useRouter } from "@/i18n/navigation";
import { useSession } from "@/redux/api/authApi";

/** On sign-in and register pages: someone already signed in goes straight on. */
export function SignedInRedirect({ to }: { to: string }) {
  return useIsClient() ? <Redirect to={to} /> : null;
}

function Redirect({ to }: { to: string }) {
  const { user } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (user) router.replace(to);
  }, [user, router, to]);
  return null;
}
