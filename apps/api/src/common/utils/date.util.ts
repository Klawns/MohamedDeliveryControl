/**
 * Transforms a period string into explicit Start and End dates.
 */
export function getDatesFromPeriod(
  period: 'today' | 'week' | 'month' | 'year' | 'custom',
  start?: string,
  end?: string,
): { startDate: Date; endDate: Date } {
  let startDate = new Date();
  let endDate = new Date();

  if (period === 'today') {
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
  } else if (period === 'week') {
    const day = startDate.getDay();
    startDate.setDate(startDate.getDate() - day);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
  } else if (period === 'month') {
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
  } else if (period === 'year') {
    startDate.setMonth(0, 1);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
  } else if (period === 'custom' && start && end) {
    startDate = new Date(start);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);
  } else {
    // Fallback default
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
  }

  return { startDate, endDate };
}

export function getDaysArray(start: Date, end: Date): string[] {
  const arr: string[] = [];
  const dt = new Date(start);
  while (dt <= end) {
    const year = dt.getFullYear();
    const month = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    arr.push(`${year}-${month}-${day}`);
    dt.setDate(dt.getDate() + 1);
  }
  return arr;
}
