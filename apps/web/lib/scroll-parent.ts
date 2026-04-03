import {
  BACKGROUND_SCROLL_LOCK_TARGET_SELECTOR,
  getDashboardScrollRoot,
} from "./dashboard-scroll-root";

export function resolveScrollParent(
  element: HTMLElement | null,
  preferredParent?: HTMLElement | null,
) {
  if (preferredParent && preferredParent !== element) {
    return preferredParent;
  }

  if (!element) {
    return getDashboardScrollRoot();
  }

  const nearestScrollRoot = element.closest<HTMLElement>(
    BACKGROUND_SCROLL_LOCK_TARGET_SELECTOR,
  );

  if (nearestScrollRoot && nearestScrollRoot !== element) {
    return nearestScrollRoot;
  }

  const dashboardScrollRoot = getDashboardScrollRoot();

  if (dashboardScrollRoot && dashboardScrollRoot !== element) {
    return dashboardScrollRoot;
  }

  return null;
}
