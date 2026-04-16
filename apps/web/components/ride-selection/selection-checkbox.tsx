'use client';

import { Checkbox } from '@/components/ui/checkbox';

interface SelectionCheckboxProps {
  checked: boolean | 'indeterminate';
  ariaLabel: string;
  disabled?: boolean;
  onToggle: () => void;
}

export function SelectionCheckbox({
  checked,
  ariaLabel,
  disabled,
  onToggle,
}: SelectionCheckboxProps) {
  return (
    <Checkbox
      checked={checked}
      onCheckedChange={onToggle}
      aria-label={ariaLabel}
      disabled={disabled}
      className="size-5 data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-500"
    />
  );
}
