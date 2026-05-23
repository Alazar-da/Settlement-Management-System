// components/reports/PaymentsTable.tsx

'use client';

export default function PaymentsTable({
  payments,
}: any) {
  return (
    <div className="glass-card p-5 rounded-2xl">
      <h2 className="font-bold text-lg mb-4">
        Recent Payments
      </h2>

      <div className="overflow-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3">
                Date
              </th>

              <th className="text-left py-3">
                Agent
              </th>

              <th className="text-left py-3">
                Amount
              </th>

              <th className="text-left py-3">
                Note
              </th>
            </tr>
          </thead>

          <tbody>
            {payments.map((item: any) => (
              <tr
                key={item.id}
                className="border-b"
              >
                <td className="py-3">
                  {new Date(
                    item.payment_date
                  ).toLocaleDateString()}
                </td>

                <td className="py-3">
                  {
                    item
                      .revenue_settlements
                      ?.agents?.name
                  }
                </td>

                <td className="py-3">
                  {Number(
                    item.amount
                  ).toLocaleString()}
                </td>

                <td className="py-3">
                  {item.note}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}