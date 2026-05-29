// utils/batchWeeks.ts

export function assignWeekNumbers(
  batches: any[]
) {
  const sorted = [...batches].sort(
    (a, b) =>
      new Date(
        a.settlement_week
      ).getTime() -
      new Date(
        b.settlement_week
      ).getTime()
  );

  const weekMap = new Map<
    string,
    number
  >();

  let currentWeek = 1;

  return sorted.map((batch) => {
    const date = new Date(
      batch.settlement_week
    );

    // START OF WEEK (MONDAY)
    const day =
      date.getDay() === 0
        ? 6
        : date.getDay() - 1;

    const monday =
      new Date(date);

    monday.setDate(
      date.getDate() - day
    );

    const weekKey =
      monday
        .toISOString()
        .split('T')[0];

    if (!weekMap.has(weekKey)) {
      weekMap.set(
        weekKey,
        currentWeek
      );

      currentWeek++;
    }

    return {
      ...batch,
      week_number:
        weekMap.get(weekKey),
    };
  });
}