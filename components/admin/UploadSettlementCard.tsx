'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

export default function UploadSettlementCard() {
  const [file, setFile] = useState<File | null>(null);
  const [systemType, setSystemType] = useState('KIRON2');
  const [commission, setCommission] = useState(10);
  const [systemPayment, setSystemPayment] = useState(30);
  const [week, setWeek] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return toast.error('Select file');

    setLoading(true);

    try {
      const formData = new FormData();

      formData.append('file', file);
      formData.append('systemType', systemType);
      formData.append('commission', String(commission));
      formData.append('systemPayment', String(systemPayment));
      formData.append('week', week);

      const response = await fetch('/api/upload-settlement', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error);
      } else {
        toast.success('Settlement uploaded');
      }
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
      <h2 className="text-xl font-bold mb-5">Upload Settlement</h2>

      <div className="grid md:grid-cols-2 gap-4">
        <select
          value={systemType}
          onChange={(e) => setSystemType(e.target.value)}
          className="p-3 rounded-lg border"
        >
          <option value="KIRON2">Kiron 2</option>
          <option value="ALPHA">Alpha</option>
        </select>

        <input
          type="date"
          value={week}
          onChange={(e) => setWeek(e.target.value)}
          className="p-3 rounded-lg border"
        />

        <input
          type="number"
          placeholder="Commission %"
          value={commission}
          onChange={(e) => setCommission(Number(e.target.value))}
          className="p-3 rounded-lg border"
        />

        <input
          type="number"
          placeholder="System Payment %"
          value={systemPayment}
          onChange={(e) => setSystemPayment(Number(e.target.value))}
          className="p-3 rounded-lg border"
        />

        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="md:col-span-2"
        />
      </div>

      <button
        onClick={handleUpload}
        disabled={loading}
        className="mt-5 bg-primary-600 text-white px-5 py-3 rounded-xl"
      >
        {loading ? 'Processing...' : 'Upload Settlement'}
      </button>
    </div>
  );
}