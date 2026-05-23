'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function DeleteBatchModal({
  batch,
  onClose,
  onSuccess,
}: any) {
  const [loading, setLoading] =
    useState(false);

  async function handleDelete() {
    try {
      setLoading(true);

      await supabase
        .from('upload_batches')
        .delete()
        .eq('id', batch.id);
        await supabase
      .from('revenue_settlements')
      .delete()
      .eq('batch_id', batch.id);

      onSuccess();
      onClose();
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-6 w-[450px]">
        <h2 className="text-xl font-bold mb-4 text-red-600">
          Delete Batch
        </h2>

        <p className="text-gray-600">
          Are you sure you want to delete:
        </p>

        <div className="mt-3 p-3 rounded bg-gray-100">
          <p>
            <strong>File:</strong>{' '}
            {batch.uploaded_file_name}
          </p>

          <p>
            <strong>Week:</strong>{' '}
            {batch.settlement_week}
          </p>
        </div>

        <p className="text-red-500 text-sm mt-4">
          This will also delete:
        </p>

        <ul className="text-sm text-gray-600 list-disc ml-5 mt-2">
          <li>Revenue settlements</li>
          <li>Payments</li>
        </ul>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded"
          >
            Cancel
          </button>

          <button
            onClick={handleDelete}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded"
          >
            {loading
              ? 'Deleting...'
              : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}