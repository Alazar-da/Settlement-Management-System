// components/reports/TopAgentsTable.tsx

'use client';

export default function TopAgentsTable({
  settlements,
}: any) {
  const top =
    [...settlements]
      .sort(
        (a, b) =>
          Number(
            b.total_net_revenue_collect
          ) -
          Number(
            a.total_net_revenue_collect
          )
      )
      .slice(0, 10);

  return (
    <div className="glass-card p-5 rounded-2xl">
      <h2 className="font-bold text-lg mb-4">
        Top Agents
      </h2>

      <div className="overflow-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3">
                Agent
              </th>

              <th className="text-left py-3">
                System
              </th>

              <th className="text-left py-3">
                Expected
              </th>

              <th className="text-left py-3">
                Paid
              </th>

              <th className="text-left py-3">
                Status
              </th>
            </tr>
          </thead>

          <tbody>
            {top.map((item: any) => (
              <tr
                key={item.id}
                className="border-b"
              >
                <td className="py-3">
                  {
                    item.agents?.name
                  }
                </td>

                <td className="py-3">
                  {item.system_type}
                </td>

                <td className="py-3">
                  {Number(
                    item.total_net_revenue_collect
                  ).toLocaleString()}
                </td>

                <td className="py-3">
                  {Number(
                    item.total_paid
                  ).toLocaleString()}
                </td>

                <td className="py-3">
                  {
                    item.payment_status
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}