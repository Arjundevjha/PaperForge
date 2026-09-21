'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  ShieldCheck,
} from 'lucide-react';
import { ReviewItem } from '@paperforge/shared';

export interface ReviewQueueProps {
  initialItems: ReviewItem[];
  onRefresh?: () => void;
}

export const ReviewQueue: React.FC<ReviewQueueProps> = ({ initialItems, onRefresh }) => {
  const [items, setItems] = useState<ReviewItem[]>(initialItems);
  const [selectedId, setSelectedId] = useState<string>(initialItems[0]?.id || '');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setItems(initialItems);
    if (initialItems.length > 0 && (!selectedId || !initialItems.some((i) => i.id === selectedId))) {
      setSelectedId(initialItems[0].id);
    }
  }, [initialItems, selectedId]);

  const selectedItem = items.find((i) => i.id === selectedId) || items[0];

  const handleResolve = async (decision: 'APPROVE' | 'REJECT' | 'OVERRIDE') => {
    if (!selectedItem) return;

    setSubmitting(true);
    try {
      await fetch('/api/review', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedItem.id,
          decision,
          reviewerId: 'Arjun Dev Jha',
          notes: resolutionNotes,
        }),
      });

      setItems((prev) =>
        prev.map((item) =>
          item.id === selectedItem.id
            ? {
                ...item,
                status: decision === 'REJECT' ? 'DISMISSED' : 'RESOLVED',
                reviewedBy: 'Arjun Dev Jha',
                reviewedAt: new Date().toISOString(),
                details: { ...item.details, decision, resolutionNotes },
              }
            : item
        )
      );
      setResolutionNotes('');
      if (onRefresh) onRefresh();
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = items.filter((i) => i.status === 'PENDING').length;

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
          <span
            className={`text-xs font-mono px-2 py-0.5 rounded border ${
              pendingCount > 0
                ? 'text-status-warning bg-status-warning/20 border-status-warning/40'
                : 'text-status-approved bg-status-approved/20 border-status-approved/40'
            }`}
          >
            {pendingCount} Pending
          </span>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-border-subdued">
          {items.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#94a3b8] space-y-2">
              <CheckCircle2 size={32} className="mx-auto text-status-approved" />
              <div className="font-semibold text-sm text-[#f1f5f9]">Review Queue is Empty</div>
              <p className="text-[11px] text-[#64748b]">
                All ingested questions meet high-confidence classification thresholds.
              </p>
            </div>
          ) : (
            items.map((item) => {
              const isSelected = item.id === selectedItem?.id;
              return (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  aria-selected={isSelected}
                  onClick={() => setSelectedId(item.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedId(item.id);
                    }
                  }}
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

                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-[#94a3b8] font-mono">
                    <span>Confidence: {(item.confidence * 100).toFixed(0)}%</span>
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Detail & Decision Pane (~55%) */}
      <div className="w-[55%] h-full flex flex-col bg-surface-1 p-6 overflow-y-auto space-y-6">
        {selectedItem ? (
          <>
            <div>
              <div className="text-xs font-mono text-[#94a3b8]">
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
              <div className="text-xs font-mono text-[#94a3b8] uppercase">
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
                  aria-label="Reviewer decision resolution notes"
                  placeholder="Add notes for audit log (e.g. verified against official 9758 syllabus guidelines)..."
                  className="w-full h-20 p-2.5 rounded bg-surface-1 border border-border-subdued text-xs text-[#dee2f1] focus:outline-none focus:border-primary-cyan"
                />

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleResolve('APPROVE')}
                    disabled={submitting}
                    className="flex items-center gap-1.5 px-4 py-2 rounded bg-status-approved hover:bg-emerald-500 text-[#090e18] text-xs font-semibold transition-all disabled:opacity-50"
                  >
                    <CheckCircle2 size={15} />
                    <span>Approve Classification</span>
                  </button>

                  <button
                    onClick={() => handleResolve('REJECT')}
                    disabled={submitting}
                    className="flex items-center gap-1.5 px-4 py-2 rounded bg-surface-1 hover:bg-surface-3 border border-border-subdued hover:border-status-error text-status-error text-xs font-medium transition-all disabled:opacity-50"
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
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 max-w-md mx-auto">
            <div className="w-14 h-14 rounded-full bg-status-approved/15 border border-status-approved/30 flex items-center justify-center text-status-approved">
              <ShieldCheck size={32} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#f1f5f9]">Review Queue Clear</h2>
              <p className="text-xs text-[#94a3b8] leading-relaxed mt-1">
                All questions and marking schemes from ingested Singapore Junior College papers have been classified with high confidence against official SEAB GCE A-Level syllabi.
              </p>
            </div>
            <div className="p-3.5 rounded bg-surface-2 border border-border-subdued text-xs font-mono text-[#cbd5e1] w-full text-left space-y-1.5">
              <div className="text-primary-cyan font-semibold flex items-center gap-1.5">
                <CheckCircle2 size={13} />
                <span>Automated Classification Confidence: &gt; 85%</span>
              </div>
              <div className="text-[#94a3b8]">Verified Syllabus: Singapore SEAB H2 Mathematics (9758)</div>
              <div className="text-[#94a3b8]">Status: Zero items requiring manual tutor intervention</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
