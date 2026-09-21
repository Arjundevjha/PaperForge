'use client';

import React, { useState } from 'react';
import {
  FileArchive,
  CheckCircle2,
  RefreshCw,
  Upload,
  X,
  FileText,
  Sparkles,
  Trash2,
  AlertCircle,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { SourceDocument, SINGAPORE_SCHOOLS } from '@paperforge/shared';

export interface SourcesConsoleProps {
  sources: SourceDocument[];
}

interface IngestionLog {
  step: string;
  status: 'pending' | 'active' | 'done';
}

export const SourcesConsole: React.FC<SourcesConsoleProps> = ({ sources: initialSources }) => {
  const [sources, setSources] = useState<SourceDocument[]>(initialSources);
  const [reprocessingId, setReprocessingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isIngesting, setIsIngesting] = useState<boolean>(false);
  const [ingestionLogs, setIngestionLogs] = useState<IngestionLog[]>([]);
  const [ingestionMessage, setIngestionMessage] = useState<string | null>(null);
  const [ingestionError, setIngestionError] = useState<string | null>(null);

  const fetchSources = async () => {
    try {
      const res = await fetch('/api/sources');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setSources(data.data);
      }
    } catch {
      // ignore fetch errors
    }
  };

  const handleReprocess = (id: string) => {
    setReprocessingId(id);
    setTimeout(() => {
      setReprocessingId(null);
    }, 1000);
  };

  const handleReset = async () => {
    if (!window.confirm('Reset PaperForge to clean production state (0 sources, 0 questions)?')) {
      return;
    }
    try {
      const res = await fetch('/api/sources', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setSources([]);
        setIngestionMessage('Clean slate: All sources and questions cleared.');
      }
    } catch {
      setIngestionError('Failed to reset store.');
    }
  };

  const simulateIngestion = async (paperType: 'paper_3' | 'paper_4') => {
    setIsIngesting(true);
    setIngestionError(null);
    setIngestionMessage(null);

    setIngestionLogs([
      { step: 'Computing SHA-256 cryptographic source hash for idempotency...', status: 'active' },
      { step: 'Extracting questions, mark allocations and vector diagram boundaries...', status: 'pending' },
      { step: 'Classifying topics against Singapore-Cambridge H2 Math (9758) taxonomy...', status: 'pending' },
      { step: 'Synchronizing 1:1 step-by-step marking scheme answers...', status: 'pending' },
      { step: 'Committing to persistent Question Bank and Review Queue...', status: 'pending' },
    ]);

    try {
      // Progress animation
      setTimeout(() => {
        setIngestionLogs((prev) =>
          prev.map((log, idx) =>
            idx === 0 ? { ...log, status: 'done' } : idx === 1 ? { ...log, status: 'active' } : log
          )
        );
      }, 400);

      setTimeout(() => {
        setIngestionLogs((prev) =>
          prev.map((log, idx) =>
            idx <= 1 ? { ...log, status: 'done' } : idx === 2 ? { ...log, status: 'active' } : log
          )
        );
      }, 900);

      const res = await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ simulate: paperType }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setIngestionLogs((prev) => prev.map((log) => ({ ...log, status: 'done' })));
        setIngestionError(data.message || data.error || 'Ingestion failed or duplicate detected.');
        setIsIngesting(false);
        return;
      }

      setIngestionLogs((prev) => prev.map((log) => ({ ...log, status: 'done' })));
      setIngestionMessage(
        `✓ ${data.message} (${data.questionsIngested} questions, ${data.telemetry?.totalMarks} marks in ${data.telemetry?.processingTimeMs}ms)`
      );
      await fetchSources();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error during ingestion.';
      setIngestionError(msg);
    } finally {
      setIsIngesting(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#f1f5f9] tracking-tight flex items-center gap-2">
            <FileArchive size={20} className="text-primary-cyan" />
            <span>Singapore Junior College Source Documents</span>
          </h1>
          <p className="text-xs text-[#94a3b8] font-mono mt-1">
            Immutable Storage & SHA-256 Idempotency Engine • Real A-Level Assessment Pipeline
          </p>
        </div>

        <div className="flex items-center gap-3">
          {sources.length > 0 && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface-2 hover:bg-red-500/20 border border-border-subdued hover:border-red-500/40 text-xs text-[#94a3b8] hover:text-red-400 font-medium transition-all"
              title="Reset to 0 papers"
            >
              <Trash2 size={13} />
              <span>Reset State</span>
            </button>
          )}

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded bg-primary-cyan hover:bg-primary-cyan/90 text-surface-0 font-semibold text-xs transition-all shadow-lg shadow-primary-cyan/20"
          >
            <Upload size={14} />
            <span>Upload Source Paper</span>
          </button>
        </div>
      </div>

      {ingestionMessage && (
        <div className="p-3 rounded bg-status-approved/15 border border-status-approved/30 text-xs text-status-approved flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} />
            <span>{ingestionMessage}</span>
          </div>
          <button onClick={() => setIngestionMessage(null)} className="text-status-approved/70 hover:text-status-approved">
            <X size={14} />
          </button>
        </div>
      )}

      {ingestionError && (
        <div className="p-3 rounded bg-status-rejected/15 border border-status-rejected/30 text-xs text-status-rejected flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{ingestionError}</span>
          </div>
          <button onClick={() => setIngestionError(null)} className="text-status-rejected/70 hover:text-status-rejected">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="rounded-lg bg-surface-1 border border-border-subdued overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface-2 border-b border-border-subdued text-[#64748b] font-mono text-[11px] uppercase">
            <tr>
              <th className="py-3 px-4">JC Source</th>
              <th className="py-3 px-4">Filename</th>
              <th className="py-3 px-4">Subject</th>
              <th className="py-3 px-4">SHA-256 Hash</th>
              <th className="py-3 px-4">Pages</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subdued font-mono">
            {sources.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-xs font-sans text-[#94a3b8]">
                  <FileArchive size={32} className="mx-auto text-[#64748b] mb-3" />
                  <div className="font-semibold text-sm text-[#f1f5f9]">No Examination Papers Ingested Yet</div>
                  <p className="mt-1 text-xs text-[#64748b] max-w-md mx-auto">
                    Production simulation mode: 0 source documents. Click &quot;Upload Source Paper&quot; above to simulate ingestion of authentic Singapore JC papers.
                  </p>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-surface-2 hover:bg-surface-3 border border-border-active hover:border-primary-cyan text-xs text-primary-cyan font-medium transition-all"
                  >
                    <Upload size={13} />
                    <span>Open Ingestion Console</span>
                  </button>
                </td>
              </tr>
            ) : (
              sources.map((s) => {
                const isReprocessing = reprocessingId === s.id;
                return (
                  <tr key={s.id} className="hover:bg-surface-2/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-[#f1f5f9]">
                      {s.school} ({SINGAPORE_SCHOOLS[s.school]?.name})
                    </td>
                    <td className="py-3 px-4 text-[#dee2f1] font-sans">
                      {s.filename}
                    </td>
                    <td className="py-3 px-4 uppercase text-primary-cyan">
                      {s.subject} P{s.paperNumber}
                    </td>
                    <td className="py-3 px-4 text-[10px] text-[#64748b]">
                      {s.sourceHash.slice(0, 16)}...
                    </td>
                    <td className="py-3 px-4 text-[#dee2f1]">
                      {s.pageCount} pages
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-status-approved/20 text-status-approved border border-status-approved/30">
                        <CheckCircle2 size={11} />
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleReprocess(s.id)}
                        disabled={isReprocessing}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-surface-2 hover:bg-surface-3 border border-border-subdued text-[11px] text-[#cbd5e1] transition-all"
                      >
                        <RefreshCw size={11} className={isReprocessing ? 'animate-spin' : ''} />
                        <span>Reprocess</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Upload & Production Simulation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-surface-1 border border-border-active rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-6 text-[#f1f5f9]">
            <div className="flex items-center justify-between border-b border-border-subdued pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded bg-primary-cyan/15 text-primary-cyan">
                  <Upload size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#f1f5f9]">Ingest Examination Paper & Solutions</h2>
                  <p className="text-xs text-[#94a3b8] font-mono">
                    SHA-256 Idempotency • Vector Slicing • 1:1 Answer Key Synchronization
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!isIngesting) setIsModalOpen(false);
                }}
                className="p-1 rounded hover:bg-surface-2 text-[#94a3b8] hover:text-[#f1f5f9]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Simulation Cards */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Sparkles size={13} className="text-primary-cyan" />
                <span>Simulate Production Upload (Authentic Examination Papers)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Paper 3 Card */}
                <div className="p-4 rounded-lg bg-surface-2 border border-border-subdued hover:border-primary-cyan/50 transition-all flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-primary-cyan/15 text-primary-cyan border border-primary-cyan/30">
                        JPJC 2022
                      </span>
                      <span className="text-[11px] font-mono text-[#94a3b8]">104 Marks</span>
                    </div>
                    <h3 className="font-semibold text-xs text-[#f1f5f9] mt-2">Promo Practise Paper 3</h3>
                    <p className="text-[11px] text-[#94a3b8] mt-1 line-clamp-2">
                      13 questions + 14 pages of step-by-step solutions: Inequalities, Calculus (differentiation, integration), Vectors, Curve transformations.
                    </p>
                  </div>

                  <button
                    onClick={() => simulateIngestion('paper_3')}
                    disabled={isIngesting}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded bg-primary-cyan/20 hover:bg-primary-cyan/30 text-primary-cyan border border-primary-cyan/40 text-xs font-medium transition-all disabled:opacity-50"
                  >
                    <Layers size={13} />
                    <span>Ingest Paper 3 (JPJC)</span>
                    <ChevronRight size={13} />
                  </button>
                </div>

                {/* Paper 4 Card */}
                <div className="p-4 rounded-lg bg-surface-2 border border-border-subdued hover:border-primary-cyan/50 transition-all flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-primary-cyan/15 text-primary-cyan border border-primary-cyan/30">
                        EJC + DHS 2022
                      </span>
                      <span className="text-[11px] font-mono text-[#94a3b8]">102 Marks</span>
                    </div>
                    <h3 className="font-semibold text-xs text-[#f1f5f9] mt-2">Promo Practise Paper 4</h3>
                    <p className="text-[11px] text-[#94a3b8] mt-1 line-clamp-2">
                      13 questions + 14 pages of step-by-step solutions: Polynomials Remainder Theorem, AP/GP sequences, 3D Vectors, Tent optimization.
                    </p>
                  </div>

                  <button
                    onClick={() => simulateIngestion('paper_4')}
                    disabled={isIngesting}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded bg-primary-cyan/20 hover:bg-primary-cyan/30 text-primary-cyan border border-primary-cyan/40 text-xs font-medium transition-all disabled:opacity-50"
                  >
                    <Layers size={13} />
                    <span>Ingest Paper 4 (EJC/DHS)</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            </div>

            {/* Ingestion Telemetry & Logs */}
            {isIngesting && (
              <div className="p-4 rounded-lg bg-surface-0 border border-border-active space-y-2.5">
                <div className="flex items-center justify-between text-xs font-mono text-primary-cyan">
                  <span className="flex items-center gap-2">
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Ingestion Pipeline In Progress...</span>
                  </span>
                </div>
                <div className="space-y-1.5 font-mono text-[11px]">
                  {ingestionLogs.map((log, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      {log.status === 'done' ? (
                        <CheckCircle2 size={12} className="text-status-approved shrink-0" />
                      ) : log.status === 'active' ? (
                        <RefreshCw size={12} className="text-primary-cyan animate-spin shrink-0" />
                      ) : (
                        <div className="w-3 h-3 rounded-full border border-border-subdued shrink-0" />
                      )}
                      <span
                        className={
                          log.status === 'done'
                            ? 'text-[#94a3b8]'
                            : log.status === 'active'
                            ? 'text-[#f1f5f9] font-semibold'
                            : 'text-[#64748b]'
                        }
                      >
                        {log.step}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-border-subdued">
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isIngesting}
                className="px-4 py-2 rounded bg-surface-2 hover:bg-surface-3 text-xs text-[#cbd5e1] font-medium transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
