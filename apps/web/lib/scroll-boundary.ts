export const SCROLL_BOUNDARY_EPSILON = 1;

export interface ScrollMetrics {
  scrollTop: number;
  clientHeight: number;
  scrollHeight: number;
}

export function getElementScrollMetrics(element: HTMLElement): ScrollMetrics {
  return {
    scrollTop: element.scrollTop,
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
  };
}

export function hasScrollableOverflow(
  metrics: ScrollMetrics,
  epsilon = SCROLL_BOUNDARY_EPSILON,
) {
  return metrics.scrollHeight - metrics.clientHeight > epsilon;
}

export function isScrollAtTop(
  metrics: Pick<ScrollMetrics, "scrollTop">,
  epsilon = SCROLL_BOUNDARY_EPSILON,
) {
  return metrics.scrollTop <= epsilon;
}

export function isScrollAtBottom(
  metrics: ScrollMetrics,
  epsilon = SCROLL_BOUNDARY_EPSILON,
) {
  return metrics.scrollHeight - metrics.clientHeight - metrics.scrollTop <= epsilon;
}

export function shouldHandoffScroll(
  metrics: ScrollMetrics,
  deltaY: number,
  epsilon = SCROLL_BOUNDARY_EPSILON,
) {
  if (deltaY === 0) {
    return false;
  }

  if (!hasScrollableOverflow(metrics, epsilon)) {
    return true;
  }

  if (deltaY < 0) {
    return isScrollAtTop(metrics, epsilon);
  }

  return isScrollAtBottom(metrics, epsilon);
}

export function normalizeWheelDelta(
  event: Pick<WheelEvent, "deltaMode" | "deltaY">,
  containerHeight: number,
) {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
    return event.deltaY * 16;
  }

  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
    return event.deltaY * containerHeight;
  }

  return event.deltaY;
}
