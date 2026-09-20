'use client';

import React, { useState } from 'react';
import {
  CheckSquare,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Copy,
  Layers,
} from 'lucide-react';
import { ReviewItem } from '@paperforge/shared';

interface ReviewQueueProps {
  initialItems: ReviewItem[];
}

export const ReviewQueue: React.FC<ReviewQueueProps> = ({ initialItems }) => {
  const [items, setItems] = useState<ReviewItem[]>(initialItems);
  const [selectedId, setSelectedId] = useState<string>(initialItems[0]?.id || '');
  const [resolutionNotes, setResolutionNotes] = useState('');

  const selectedItem = items.find((i) => i.id === selectedId) || items[0];

  const handleResolve = (decision: 'APPROVE' | 'REJECT' | 'OVERRIDE') => {
    if (!selectedItem) return;

    setItems((prev) =>
      prev.map((item) =>
        item.id === selectedItem.id
          ? {
              ...item,
              status: decision === 'REJECT' ? 'DISMISSED' : 'RESOLVED',
              reviewedBy: 'Dr. Adrian Low',
              reviewedAt: new Date().toISOString(),
              details: { ...item.details, decision, resolutionNotes },
            }
          : item
      )
    );
    setResolutionNotes('');
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Items List (~45%) */}
      <div className="w-[45%] h-full flex flex-col border-r border-border-subdued bg-chassis overflow-hidden">
        <div className="p-4 border-b border-border-subdued bg-surface-1/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare size={18} className="text-status-warning" />
            <h1 className="text-base font-bold text-[#f1f5f9]">
              Human-in-the-Loop Review Queue
            </h1>
          </div>
          <span className="text-xs font-mono text-status-warning bg-status-warning/20 px-2 py-0.5 rounded border border-status-warning/40">
            {items.filter((i) => i.status === 'PENDING').length} Pending
          </span>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-border-subdued">
          {items.map((item) => {
            const isSelected = item.id === selectedItem?.id;
            return (
              <div
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className={`p-4 cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-surface-2 border-l-2 border-primary-cyan'
                    : 'bg-surface-1/40 hover:bg-surface-2'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono font-semibold text-primary-cyan">
                    {item.issueType}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                      item.status === 'PENDING'
                        ? 'bg-status-warning/20 text-status-warning border border-status-warning/40'
                        : 'bg-status-approved/20 text-status-approved border border-status-approved/40'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="text-xs text-[#dee2f1] font-medium">
                  Entity: {item.entityId} ({item.entityType})
                </div>

                <div className="mt-1.5 flex items-center justify-between text-[11px] text-[#64748b] font-mono">
                  <span>Confidence: {(item.confidence * 100).toFixed(0)}%</span>
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail & Decision Pane (~55%) */}
      <div className="w-[55%] h-full flex flex-col bg-surface-1 p-6 overflow-y-auto space-y-6">
        {selectedItem ? (
          <>
            <div>
              <div className="text-xs font-mono text-[#64748b]">
                REVIEW ITEM #{selectedItem.id}
              </div>
              <h2 className="text-lg font-bold text-[#f1f5f9] mt-1">
                {selectedItem.issueType}
              </h2>
              <p className="text-xs text-[#94a3b8] mt-1">
                Triggered by automated confidence boundary check. Human reviewer decision required.
              </p>
            </div>

            {/* Diagnostic Information */}
            <div className="p-4 rounded-lg bg-surface-2 border border-border-subdued space-y-3">
              <div className="text-xs font-mono text-[#64748b] uppercase">
                Diagnostic Telemetry
              </div>
              <pre className="text-xs font-mono text-[#cbd5e1] p-3 rounded bg-surface-1 overflow-x-auto">
                {JSON.stringify(selectedItem.details, null, 2)}
              </pre>
            </div>

            {/* Action Box */}
            {selectedItem.status === 'PENDING' ? (
              <div className="p-5 rounded-lg bg-surface-2 border border-border-active space-y-4">
                <div className="text-xs font-bold text-[#f1f5f9]">
                  Submit Reviewer Decision
                </div>

                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Add notes for audit log (e.g. verified against 2026 syllabus guidelines)..."
                  className="w-full h-20 p-2.5 rounded bg-surface-1 border border-border-subdued text-xs text-[#dee2f1] focus:outline-none focus:border-primary-cyan"
                />

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleResolve('APPROVE')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded bg-status-approved hover:bg-emerald-500 text-[#090e18] text-xs font-semibold transition-all"
                  >
                    <CheckCircle2 size={15} />
                    <span>Approve Classification</span>
                  </button>

                  <button
                    onClick={() => handleResolve('REJECT')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded bg-surface-1 hover:bg-surface-3 border border-border-subdued hover:border-status-error text-status-error text-xs font-medium transition-all"
                  >
                    <XCircle size={15} />
                    <span>Dismiss / Reject</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-status-approved/10 border border-status-approved/30 text-xs font-mono text-status-approved flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>
                  Resolved by {selectedItem.reviewedBy || 'Admin'} at{' '}
                  {new Date(selectedItem.reviewedAt || '').toLocaleString()}
                </span>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
};
