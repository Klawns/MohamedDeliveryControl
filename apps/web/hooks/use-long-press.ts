'use client';

import type { MouseEvent, PointerEvent } from 'react';
import { useCallback, useEffect, useRef } from 'react';

type PressPosition = {
  x: number;
  y: number;
};

export function shouldCancelLongPress(
  startPosition: PressPosition,
  currentPosition: PressPosition,
  moveTolerance: number,
) {
  return (
    Math.abs(currentPosition.x - startPosition.x) > moveTolerance ||
    Math.abs(currentPosition.y - startPosition.y) > moveTolerance
  );
}

interface UseLongPressOptions {
  onLongPress: () => void;
  disabled?: boolean;
  thresholdMs?: number;
  moveTolerance?: number;
  shouldHandleEvent?: (event: PointerEvent<HTMLElement>) => boolean;
}

export function useLongPress({
  onLongPress,
  disabled = false,
  thresholdMs = 400,
  moveTolerance = 12,
  shouldHandleEvent,
}: UseLongPressOptions) {
  const timerRef = useRef<number | null>(null);
  const startPositionRef = useRef<PressPosition | null>(null);
  const suppressNextClickRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (disabled || (shouldHandleEvent && !shouldHandleEvent(event))) {
        return;
      }

      startPositionRef.current = {
        x: event.clientX,
        y: event.clientY,
      };
      timerRef.current = window.setTimeout(() => {
        suppressNextClickRef.current = true;
        onLongPress();
        clearTimer();
      }, thresholdMs);
    },
    [clearTimer, disabled, onLongPress, shouldHandleEvent, thresholdMs],
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (!startPositionRef.current || timerRef.current === null) {
        return;
      }

      if (
        shouldCancelLongPress(
          startPositionRef.current,
          {
            x: event.clientX,
            y: event.clientY,
          },
          moveTolerance,
        )
      ) {
        clearTimer();
        startPositionRef.current = null;
      }
    },
    [clearTimer, moveTolerance],
  );

  const handlePressEnd = useCallback(() => {
    clearTimer();
    startPositionRef.current = null;
  }, [clearTimer]);

  const handleClickCapture = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      if (!suppressNextClickRef.current) {
        return;
      }

      suppressNextClickRef.current = false;
      event.preventDefault();
      event.stopPropagation();
    },
    [],
  );

  return {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePressEnd,
    onPointerCancel: handlePressEnd,
    onPointerLeave: handlePressEnd,
    onClickCapture: handleClickCapture,
  };
}
