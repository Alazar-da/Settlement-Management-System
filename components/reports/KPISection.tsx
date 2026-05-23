// components/reports/KPISection.tsx

'use client';

export default function KPISection({
  settlements,
}: any) {
  const totalGGR = settlements.reduce(
    (sum: number, item: any) =>
      sum + Number(item.total_ggr),
    0
  );

  const totalExpected = settlements.reduce(
    (sum: number, item: any) =>
      sum +
      Number(
        item.total_net_revenue_collect
      ),
    0
  );

  const totalPaid = settlements.reduce(
    (sum: number, item: any) =>
      sum + Number(item.total_paid),
    0
  );

  const remaining = settlements.reduce(
    (sum: number, item: any) =>
      sum +
      Number(item.remaining_balance),
    0
  );

  const cards = [
    {
      title: 'Total GGR',
      value: totalGGR,
    },
    {
      title: 'Expected Collection',
      value: totalExpected,
    },
    {
      title: 'Collected',
      value: totalPaid,
    },
    {
      title: 'Remaining',
      value: remaining,
    },
    {
      title: 'Agents',
      value: settlements.length,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="glass-card p-5 rounded-2xl"
        >
          <p className="text-sm text-muted-foreground">
            {card.title}
          </p>

          <h2 className="text-2xl font-bold mt-2">
            {Number(
              card.value
            ).toLocaleString()}
          </h2>
        </div>
      ))}
    </div>
  );
}