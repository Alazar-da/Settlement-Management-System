'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import DeleteBatchModal from './DeleteBatchModal';
import EditBatchModal from './EditBatchModal';

export default function UploadedBatchTable({ onView }: any) {
  const [batches, setBatches] = useState<any[]>([]);
  const [editBatch, setEditBatch] = useState<any>(null);

const [deleteBatch, setDeleteBatch] =
  useState<any>(null);

  useEffect(() => {
    fetchBatches();
  }, []);

  async function fetchBatches() {
    const { data, error } = await supabase
      .from('upload_batches')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) {
      setBatches(data || []);
    }
  }

/*   async function deleteBatch(id: string) {
    const confirmDelete = confirm('Delete this batch?');

    if (!confirmDelete) return;

    await supabase
      .from('upload_batches')
      .delete()
      .eq('id', id);

    await supabase
      .from('revenue_settlements')
      .delete()
      .eq('batch_id', id);

    fetchBatches();
  } */

  return (
    <div className="glass-card p-6">
      <h2 className="text-xl font-bold mb-4">
        Uploaded Settlement Batches
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3">Week</th>
              <th className="text-left py-3">System</th>
              <th className="text-left py-3">File</th>
              <th className="text-left py-3">Commission %</th>
              <th className="text-left py-3">System Payment %</th>
              <th className="text-left py-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {batches.map((batch) => (
              <tr key={batch.id} className="border-b">
                <td className="py-3">
                  {batch.settlement_week}
                </td>

                <td className="py-3">
                  {batch.system_type}
                </td>

                <td className="py-3">
                  {batch.uploaded_file_name}
                </td>

                <td className="py-3">
                  {batch.commission_percent}%
                </td>

                <td className="py-3">
                  {batch.system_payment_percent}%
                </td>

                <td className="py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onView(batch)}
                      className="px-3 py-1 rounded bg-blue-500 text-white"
                    >
                      View
                    </button>

                    <button
                     onClick={() => setEditBatch(batch)}
                      className="px-3 py-1 rounded bg-yellow-500 text-white"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => setDeleteBatch(batch)}
                      className="px-3 py-1 rounded bg-red-500 text-white"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {
  editBatch && (
    <EditBatchModal
      batch={editBatch}
      onClose={() => setEditBatch(null)}
      onSuccess={fetchBatches}
    />
  )
}

{
  deleteBatch && (
    <DeleteBatchModal
      batch={deleteBatch}
      onClose={() => setDeleteBatch(null)}
      onSuccess={fetchBatches}
    />
  )
}
    </div>
  );
}