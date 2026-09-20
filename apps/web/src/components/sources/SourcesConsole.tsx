'use client';

import React, { useState } from 'react';
import {
  FileArchive,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  Clock,
  Upload,
} from 'lucide-react';
import { SourceDocument, SINGAPORE_SCHOOLS } from '@paperforge/shared';

export interface SourcesConsoleProps {
  sources: SourceDocument[];
}

export const SourcesConsole: React.FC<SourcesConsoleProps> = ({ sources: initialSources }) => {
  const [sources, setSources] = useState<SourceDocument[]>(initialSources);
  const [reprocessingId, setReprocessingId] = useState<string | null>(null);

  const handleReprocess = (id: string) => {
    setReprocessingId(id);
    setTimeout(() => {
      setReprocessingId(null);
    }, 1000);
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
            Immutable Storage & SHA-256 Idempotency Engine
          </p>
        </div>

        <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-surface-2 hover:bg-surface-3 border border-border-active hover:border-primary-cyan text-xs text-[#dee2f1] font-medium transition-all">
          <Upload size={14} />
          <span>Upload Source Paper</span>
        </button>
      </div>

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
            {sources.map((s) => {
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
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
