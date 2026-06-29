'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiSave, FiPercent, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { supabase } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface SystemCommission {
  id: string;
  system_name: string;
  commission_percent: number;
}

interface AgentCommissionModalProps {
  agentId: string;
  agentName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function AgentCommissionModal({
  agentId,
  agentName,
  open,
  onOpenChange,
  onSuccess,
}: AgentCommissionModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [systems, setSystems] = useState<SystemCommission[]>([]);
  const [originalSystems, setOriginalSystems] = useState<SystemCommission[]>([]);

  useEffect(() => {
    if (open && agentId) {
      fetchCommissions();
    }
  }, [open, agentId]);

  const fetchCommissions = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('agent_system_commissions')
      .select(`
        id,
        commission_percent,
        systems (
          id,
          name
        )
      `)
      .eq('agent_id', agentId);

    if (!error && data) {
      const formatted = data.map((item: any) => ({
        id: item.id,
        system_name: item.systems.name,
        commission_percent: item.commission_percent,
      }));
      setSystems(formatted);
      setOriginalSystems(JSON.parse(JSON.stringify(formatted)));
    }

    setLoading(false);
  };

  const updateCommission = (id: string, value: number) => {
    setSystems((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, commission_percent: value } : row
      )
    );
  };

  const hasChanges = () => {
    return JSON.stringify(systems) !== JSON.stringify(originalSystems);
  };

  const saveChanges = async () => {
    if (!hasChanges()) {
      toast.error('No changes to save');
      return;
    }

    setSaving(true);

    try {
      await Promise.all(
        systems.map((row) =>
          supabase
            .from('agent_system_commissions')
            .update({
              commission_percent: row.commission_percent,
            })
            .eq('id', row.id)
        )
      );

      toast.success('Commissions updated successfully');
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to save commissions');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (hasChanges()) {
      if (confirm('You have unsaved changes. Are you sure you want to close?')) {
        onOpenChange(false);
      }
    } else {
      onOpenChange(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-y-auto h-[90%]">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-600 to-secondary-600">
                <div>
                  <h2 className="text-xl font-bold text-white">Agent Commissions</h2>
                  <p className="text-sm text-primary-100 mt-1">
                    {agentName || 'Agent'} • System commission rates
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <FiX className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                      <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                        Loading commissions...
                      </p>
                    </div>
                  </div>
                ) : systems.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
                      <FiPercent className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No commissions found
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      This agent doesn't have any system commissions configured yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Info Banner */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <FiAlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          Commission percentages determine how much the agent earns from each system.
                        </p>
                      </div>
                    </div>

                    {/* Commission List */}
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {systems.map((system, idx) => (
                        <motion.div
                          key={system.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="flex items-center justify-between gap-4 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {system.system_name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Commission rate
                            </p>
                          </div>
                          <div className="relative">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step="0.01"
                              value={system.commission_percent}
                              onChange={(e) =>
                                updateCommission(system.id, Number(e.target.value))
                              }
                              className="w-28 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-right focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-400">
                              %
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Summary */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Average Commission:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {(systems.reduce((sum, s) => sum + s.commission_percent, 0) / systems.length).toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm mt-2">
                        <span className="text-gray-600 dark:text-gray-400">Total Systems:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{systems.length}</span>
                      </div>
                    </div>

                    {/* Unsaved Changes Indicator */}
                    {hasChanges() && (
                      <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
                        <p className="text-xs text-yellow-700 dark:text-yellow-400">
                          You have unsaved changes
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              {systems.length > 0 && (
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={saveChanges}
                    loading={saving}
                    disabled={!hasChanges()}
                    className='flex items-center'
                  >
                    <FiSave className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}