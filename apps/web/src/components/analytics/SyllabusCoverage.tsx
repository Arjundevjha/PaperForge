'use client';

import React, { useEffect, useState } from 'react';
import {
  SubjectId,
  SUBJECT_METADATA,
  SyllabusChapterCoverage,
  SyllabusCoverageOverall,
  SyllabusSubtopicCoverage,
} from '@paperforge/shared';

interface SyllabusCoverageApiResponse {
  success: boolean;
  subject: SubjectId;
  overall: SyllabusCoverageOverall;
  chapters: SyllabusChapterCoverage[];
  error?: string;
}

export const SyllabusCoverage: React.FC<{ activeSubject: SubjectId }> = ({ activeSubject }) => {
  const [data, setData] = useState<SyllabusCoverageApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/analytics/syllabus?subject=${activeSubject}`);
        const json = (await res.json()) as SyllabusCoverageApiResponse;
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to load syllabus coverage');
        }
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load syllabus coverage');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [activeSubject]);

  const handleDownloadCsv = () => {
    window.location.href = `/api/analytics/syllabus/export?subject=${activeSubject}`;
  };

  const meta = SUBJECT_METADATA[activeSubject];
  const overall = data?.overall;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#f1f5f9] tracking-tight">
            Syllabus Coverage Analytics
          </h1>
          <p className="text-xs text-[#94a3b8] font-mono mt-1">
            Authoritative SEAB Syllabus Code: {meta.syllabusCode} • {meta.name}
          </p>
        </div>
        <button
          onClick={handleDownloadCsv}
          className="px-4 py-2 rounded text-xs font-medium bg-surface-2 border border-active text-[#f1f5f9] hover:border-primary-cyan hover:text-primary-cyan transition-colors"
        >
          Download coverage CSV
        </button>
      </div>

      {loading && (
        <p className="text-xs text-[#94a3b8] font-mono">Computing syllabus coverage...</p>
      )}
      {error && <p className="text-xs text-status-error">{error}</p>}

      {data && overall && (
        <>
          <div className="rounded-lg bg-surface-1 border border-subdued p-5 space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold text-[#f1f5f9]">Overall Coverage</span>
              <span className="font-mono text-2xl font-bold text-primary-cyan">{overall.coveragePct}%</span>
            </div>
            <p className="text-xs text-[#94a3b8] font-mono">
              {overall.coveredSubtopics} of {overall.totalSubtopics} subtopics covered •{' '}
              {overall.questions} questions mapped • {overall.questionsWithAnswer} answered
            </p>
            <div className="h-2 w-full rounded-full bg-surface-2 overflow-hidden">
              <div
                className="h-2 bg-primary-cyan rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.max(0, overall.coveragePct))}%` }}
              />
            </div>
          </div>

          <div className="space-y-3">
            {data.chapters.map((ch) => {
              const coveredCount = ch.subtopics.filter((s) => s.covered).length;
              const questionCount = ch.subtopics.reduce(
                (acc, s) => acc + s.questions.length,
                0
              );
              const gapSubtopics = ch.subtopics.filter((s) => s.gap);
              return (
                <div
                  key={ch.id}
                  className="rounded-lg bg-surface-1 border border-subdued overflow-hidden"
                >
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-primary-cyan">
                        Chapter {ch.chapterNumber}
                      </span>
                      <span className="text-sm font-semibold text-[#f1f5f9]">{ch.name}</span>
                    </div>
                    <span className="text-xs font-mono text-[#94a3b8]">
                      {coveredCount}/{ch.totalSubtopics} subtopics covered, {questionCount} questions
                    </span>
                  </div>

                  {gapSubtopics.length > 0 && (
                    <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                      {gapSubtopics.map((s) => (
                        <span
                          key={s.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-status-error/10 border border-status-error/30 text-[10px] font-mono text-status-error"
                        >
                          Gap: {s.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="p-4 bg-surface-2/40 border-t border-subdued space-y-3">
                    {ch.subtopics.map((s) => (
                      <div
                        key={s.id}
                        className="p-3 rounded bg-surface-1/70 border border-subdued/80 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              aria-hidden="true"
                              className={`w-2 h-2 rounded-full ${
                                s.covered ? 'bg-status-approved' : 'bg-status-error'
                              }`}
                            />
                            <span className="text-xs font-semibold text-[#dee2f1]">{s.name}</span>
                          </div>
                          <span className="text-[10px] font-mono text-[#94a3b8]">
                            {s.questions.length} questions • {s.questionsWithDiagram.length} diagrams
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-[#64748b]">
                          {s.covered ? 'Covered' : 'Gap'} • id: {s.id}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
