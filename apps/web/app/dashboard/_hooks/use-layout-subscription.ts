"use client";

import { useEffect, useMemo, useState } from "react";
import { useFreeTrial } from "@/hooks/use-free-trial";
import { type User } from "@/hooks/use-auth";

export function useLayoutSubscription(user: User | null) {
  const trial = useFreeTrial(user);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (trial.isStarter || !user?.subscription?.validUntil) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [trial.isStarter, user?.subscription?.validUntil]);

  return useMemo(() => {
    const premiumExpirationDate =
      !trial.isStarter && user?.subscription?.validUntil
        ? new Date(user.subscription.validUntil)
        : null;
    const premiumDiffInMs = premiumExpirationDate
      ? premiumExpirationDate.getTime() - now
      : 0;
    const premiumDaysRemaining =
      premiumDiffInMs > 0
        ? Math.ceil(premiumDiffInMs / (1000 * 60 * 60 * 24))
        : 0;

    return {
      isExpired: trial.isExpired,
      isExpiringSoon: trial.isStarter
        ? trial.isExpiringSoon
        : Boolean(
            premiumExpirationDate &&
            premiumDiffInMs > 0 &&
            premiumDiffInMs < 5 * 24 * 60 * 60 * 1000,
          ),
      daysRemaining: trial.isStarter
        ? trial.daysRemaining
        : premiumDaysRemaining,
      showExpiringPopup:
        !trial.isStarter &&
        premiumDaysRemaining > 0 &&
        premiumDaysRemaining <= 3,
      trial,
    };
  }, [now, trial, user]);
}
