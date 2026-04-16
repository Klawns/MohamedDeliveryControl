'use client';

import type { KeyboardEvent, ReactNode } from 'react';
import { useLongPress } from '@/hooks/use-long-press';
import { cn } from '@/lib/utils';

interface SelectableCardShellProps {
  className?: string;
  children: ReactNode;
  isSelectionMode: boolean;
  isSelected: boolean;
  selectionDisabled?: boolean;
  canEnterSelectionWithLongPress?: boolean;
  onEnterSelectionMode: () => void;
  onToggleSelection: () => void;
}

export function SelectableCardShell({
  className,
  children,
  isSelectionMode,
  isSelected,
  selectionDisabled = false,
  canEnterSelectionWithLongPress = false,
  onEnterSelectionMode,
  onToggleSelection,
}: SelectableCardShellProps) {
  const longPressHandlers = useLongPress({
    onLongPress: onEnterSelectionMode,
    disabled: selectionDisabled || isSelectionMode || !canEnterSelectionWithLongPress,
    shouldHandleEvent: (event) => {
      const target = event.target as HTMLElement | null;
      return (
        event.pointerType !== 'mouse' &&
        !target?.closest('[data-selection-ignore="true"]')
      );
    },
  });

  const handleClick = () => {
    if (!isSelectionMode || selectionDisabled) {
      return;
    }

    onToggleSelection();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!isSelectionMode || selectionDisabled) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onToggleSelection();
    }
  };

  return (
    <div
      className={cn(
        isSelectionMode && !selectionDisabled && 'cursor-pointer',
        className,
      )}
      role={isSelectionMode ? 'button' : undefined}
      tabIndex={isSelectionMode ? 0 : undefined}
      aria-pressed={isSelectionMode ? isSelected : undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      {...longPressHandlers}
    >
      {children}
    </div>
  );
}
