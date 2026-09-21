'use client';

import React, { useState, useRef } from 'react';
import {
  FileArchive,
  CheckCircle2,
  RefreshCw,
  Upload,
  X,
  FileText,
  Trash2,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { SourceDocument, SINGAPORE_SCHOOLS, SingaporeSchoolCode } from '@paperforge/shared';

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [school, setSchool] = useState<SingaporeSchoolCode>('JPJC');
  const [year, setYear] = useState<number>(2022);
  const [subject, setSubject] = useState<string>('mathematics');
  const [paperNumber, setPaperNumber] = useState<number>(1);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const fname = file.name.toLowerCase();
      if (fname.includes('ejc')) setSchool('EJC');
      else if (fname.includes('jpjc')) setSchool('JPJC');
      else if (fname.includes('ri')) setSchool('RI');
      else if (fname.includes('hci')) setSchool('HCI');
      else if (fname.includes('nyjc')) setSchool('NYJC');
      else if (fname.includes('vjc')) setSchool('VJC');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        setSelectedFile(file);
        const fname = file.name.toLowerCase();
        if (fname.includes('ejc')) setSchool('EJC');
        else if (fname.includes('jpjc')) setSchool('JPJC');
        else if (fname.includes('ri')) setSchool('RI');
        else if (fname.includes('hci')) setSchool('HCI');
        else if (fname.includes('nyjc')) setSchool('NYJC');
        else if (fname.includes('vjc')) setSchool('VJC');
      } else {
        setIngestionError('Only PDF files are supported.');
      }
    }
  };

  const handleDirectUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setIngestionError('Please select an Examination Question Paper PDF to upload.');
      return;
    }

    setIsIngesting(true);
    setIngestionError(null);
    setIngestionMessage(null);

    setIngestionLogs([
      { step: 'Uploading file and computing cryptographic SHA-256 source hash...', status: 'active' },
      { step: 'Extracting question stems, marks allocation and diagram boundaries...', status: 'pending' },
      { step: 'Classifying syllabus taxonomy and scoring confidence...', status: 'pending' },
      { step: 'Synchronizing 1:1 step-by-step worked solutions...', status: 'pending' },
      { step: 'Committing to Question Bank and Review Queue...', status: 'pending' },
    ]);

    try {
      setTimeout(() => {
        setIngestionLogs((prev) =>
          prev.map((log, idx) =>
            idx === 0 ? { ...log, status: 'done' } : idx === 1 ? { ...log, status: 'active' } : log
          )
        );
      }, 500);

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('school', school);
      formData.append('year', year.toString());
      formData.append('subject', subject);
      formData.append('paperNumber', paperNumber.toString());

      const res = await fetch('/api/sources', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setIngestionLogs((prev) => prev.map((log) => ({ ...log, status: 'done' })));
        setIngestionError(data.message || data.error || 'Upload failed.');
        setIsIngesting(false);
        return;
      }

      setIngestionLogs((prev) => prev.map((log) => ({ ...log, status: 'done' })));
      setIngestionMessage(
        `✓ ${data.message} (${data.questionsIngested} questions, ${data.telemetry?.totalMarks} marks in ${data.telemetry?.processingTimeMs}ms)`
      );
      setSelectedFile(null);
      await fetchSources();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error during upload.';
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
            Immutable Storage & SHA-256 Idempotency Engine • Examination Paper Ingestion
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
                    Clean production state: 0 source documents. Click &quot;Upload Source Paper&quot; above to select and upload an official Singapore JC examination PDF.
                  </p>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-surface-2 hover:bg-surface-3 border border-border-active hover:border-primary-cyan text-xs text-primary-cyan font-medium transition-all"
                  >
                    <Upload size={13} />
                    <span>Upload Examination PDF</span>
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

      {/* Upload & Ingestion Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-surface-1 border border-border-active rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-5 text-[#f1f5f9]">
            <div className="flex items-center justify-between border-b border-border-subdued pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded bg-primary-cyan/15 text-primary-cyan">
                  <Upload size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#f1f5f9]">Upload Examination Paper</h2>
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

            {/* Direct File Upload Form */}
            <form onSubmit={handleDirectUpload} className="space-y-4">
              {/* Drag and drop zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-primary-cyan bg-primary-cyan/10'
                    : selectedFile
                    ? 'border-status-approved/50 bg-status-approved/5'
                    : 'border-border-active bg-surface-2 hover:border-primary-cyan/50 hover:bg-surface-3'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="flex items-center justify-center gap-3 text-left">
                    <div className="p-3 rounded-lg bg-status-approved/20 text-status-approved">
                      <FileCheck size={24} />
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-[#f1f5f9]">{selectedFile.name}</div>
                      <div className="text-[11px] font-mono text-[#94a3b8]">
                        {(selectedFile.size / 1024).toFixed(1)} KB • PDF Document
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                      }}
                      className="ml-4 p-1 rounded hover:bg-surface-1 text-[#94a3b8] hover:text-red-400"
                      title="Remove file"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-full bg-primary-cyan/10 text-primary-cyan flex items-center justify-center mx-auto">
                      <FileText size={20} />
                    </div>
                    <div className="text-xs font-medium text-[#f1f5f9]">
                      Click to browse or drag and drop examination PDF
                    </div>
                    <div className="text-[11px] text-[#64748b]">
                      Supports official Singapore Junior College Question Papers (`.pdf`)
                    </div>
                  </div>
                )}
              </div>

              {/* Metadata Settings */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-[#94a3b8] mb-1">Junior College</label>
                  <select
                    value={school}
                    onChange={(e) => setSchool(e.target.value as SingaporeSchoolCode)}
                    className="w-full bg-surface-2 border border-border-subdued rounded px-2.5 py-1.5 text-xs text-[#f1f5f9] focus:border-primary-cyan focus:outline-none"
                  >
                    {Object.keys(SINGAPORE_SCHOOLS).map((code) => (
                      <option key={code} value={code}>
                        {code} - {SINGAPORE_SCHOOLS[code as SingaporeSchoolCode].name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-[#94a3b8] mb-1">Exam Year</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value, 10))}
                    min={2018}
                    max={2026}
                    className="w-full bg-surface-2 border border-border-subdued rounded px-2.5 py-1.5 text-xs text-[#f1f5f9] focus:border-primary-cyan focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-[#94a3b8] mb-1">Subject</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-surface-2 border border-border-subdued rounded px-2.5 py-1.5 text-xs text-[#f1f5f9] focus:border-primary-cyan focus:outline-none"
                  >
                    <option value="mathematics">H2 Mathematics (9758)</option>
                    <option value="chemistry">H2 Chemistry (9476)</option>
                    <option value="physics">H2 Physics (9749)</option>
                    <option value="biology">H2 Biology (9744)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-[#94a3b8] mb-1">Paper Number</label>
                  <select
                    value={paperNumber}
                    onChange={(e) => setPaperNumber(parseInt(e.target.value, 10))}
                    className="w-full bg-surface-2 border border-border-subdued rounded px-2.5 py-1.5 text-xs text-[#f1f5f9] focus:border-primary-cyan focus:outline-none font-mono"
                  >
                    <option value={1}>Paper 1</option>
                    <option value={2}>Paper 2</option>
                    <option value={3}>Paper 3</option>
                    <option value={4}>Paper 4</option>
                  </select>
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
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isIngesting}
                  className="px-4 py-2 rounded bg-surface-2 hover:bg-surface-3 text-xs text-[#cbd5e1] font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedFile || isIngesting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded bg-primary-cyan hover:bg-primary-cyan/90 text-surface-0 font-semibold text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary-cyan/20"
                >
                  <Upload size={14} />
                  <span>Upload & Ingest Examination Paper</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
