'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Download,
  FileText,
  Printer,
  CheckCircle2,
  Eye,
  BookOpen,
  School,
  Sparkles,
  ZoomIn,
  ZoomOut,
  ToggleLeft,
  ToggleRight,
  Edit3,
  Tag,
  X,
  Search,
  AlertTriangle,
  ShieldCheck,
  HelpCircle,
  Filter,
  RotateCcw,
  Maximize2,
  type LucideIcon,
} from 'lucide-react';
import {
  SubjectId,
  SUBJECT_METADATA,
  SINGAPORE_A_LEVEL_SYLLABI,
  Worksheet,
  Question,
  Answer,
  AnswerVerificationStatus,
} from '@paperforge/shared';
import MathRenderer from '../ui/MathRenderer';
import { sanitizeMathQuestionText } from '../../lib/sanitize-question';
import { ReclassifyModal } from '../questions/ReclassifyModal';
import { getQuestionImageUrl, getAnswerImageUrl } from '../../lib/storage-url';

export interface TeacherResourceHubProps {
  activeSubject: SubjectId;
  worksheets: Worksheet[];
  questions: Question[];
  answers: Answer[];
  onRefresh?: () => void;
}

function cleanQuestionStem(text: string, qnum?: string, qid?: string): string {
  return sanitizeMathQuestionText(text, qnum, qid);
}

const VERIFICATION_BADGE_CONFIG: Record<
  AnswerVerificationStatus,
  { label: string; className: string; icon: LucideIcon }
> = {
  VERIFIED: {
    label: 'VERIFIED',
    className: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    icon: ShieldCheck,
  },
  AUTO_MATCHED: {
    label: 'AUTO MATCHED',
    className: 'bg-sky-50 text-sky-800 border-sky-300',
    icon: CheckCircle2,
  },
  MISMATCH_FLAGGED: {
    label: 'MISMATCH FLAGGED',
    className: 'bg-rose-50 text-rose-800 border-rose-300',
    icon: AlertTriangle,
  },
  MISSING: {
    label: 'MISSING',
    className: 'bg-amber-50 text-amber-800 border-amber-300',
    icon: HelpCircle,
  },
};

function getAnswerVerificationStatus(ans?: Answer): AnswerVerificationStatus {
  if (!ans) return 'MISSING';
  if (ans.verificationStatus) return ans.verificationStatus;
  if (ans.status === 'VERIFIED' || ans.status === 'AUTO_MATCHED' || ans.status === 'MISMATCH_FLAGGED' || ans.status === 'MISSING') {
    return ans.status;
  }
  return 'AUTO_MATCHED';
}

export const TeacherResourceHub: React.FC<TeacherResourceHubProps> = ({
  activeSubject,
  worksheets,
  questions,
  answers,
  onRefresh,
}) => {
  const currentSyllabus = SINGAPORE_A_LEVEL_SYLLABI[activeSubject];
  const currentMeta = SUBJECT_METADATA[activeSubject];

  const [selectedChapterId, setSelectedChapterId] = useState<string>('all');
  const [selectedSubtopic, setSelectedSubtopic] = useState<string>('all');
  const [selectedWorksheetId, setSelectedWorksheetId] = useState<string>(
    worksheets[0]?.id || ''
  );

  // First-class filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterPaperNumber, setFilterPaperNumber] = useState<string>('all');
  const [filterSchool, setFilterSchool] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');

  // Card popover & preview state
  const [openCoverageWsId, setOpenCoverageWsId] = useState<string | null>(null);
  const [showMarkingScheme, setShowMarkingScheme] = useState<boolean>(false);
  const [previewZoom, setPreviewZoom] = useState<number>(85);
  const [isAutoFitZoom, setIsAutoFitZoom] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [displayLimit, setDisplayLimit] = useState<number>(30);
  const [reclassifyingQuestion, setReclassifyingQuestion] = useState<Question | null>(null);
  const [reclassifyNotification, setReclassifyNotification] = useState<string | null>(null);
  const [optimisticOverrides, setOptimisticOverrides] = useState<Map<string, Question>>(new Map());
  const [answerStatusOverrides, setAnswerStatusOverrides] = useState<
    Map<string, AnswerVerificationStatus>
  >(new Map());
  const [flaggingQuestionId, setFlaggingQuestionId] = useState<string | null>(null);
  const [flagReason, setFlagReason] = useState<string>('');
  const [isSubmittingFlag, setIsSubmittingFlag] = useState<boolean>(false);

  // React-state image fallback tracking (replaces document.getElementById)
  const [failedQuestionImages, setFailedQuestionImages] = useState<Set<string>>(new Set());
  const [failedAnswerImages, setFailedAnswerImages] = useState<Set<string>>(new Set());

  const canvasViewportRef = useRef<HTMLDivElement | null>(null);

  // Auto-fit A4 sheet (595px wide) to pane width
  useEffect(() => {
    const el = canvasViewportRef.current;
    if (!el) return;

    const updateZoom = () => {
      if (!isAutoFitZoom) return;
      const availableWidth = Math.max(320, el.clientWidth - 40);
      const fit = Math.min(100, Math.max(50, Math.floor((availableWidth / 595) * 100)));
      setPreviewZoom(fit);
    };

    updateZoom();
    const observer = new ResizeObserver(updateZoom);
    observer.observe(el);
    return () => observer.disconnect();
  }, [isAutoFitZoom]);

  useEffect(() => {
    setDisplayLimit(30);
  }, [selectedWorksheetId, filterPaperNumber, filterSchool, filterYear, searchQuery]);

  useEffect(() => {
    setSelectedSubtopic('all');
  }, [selectedChapterId]);

  // Build fast lookup maps
  const questionMap = useMemo(() => {
    const map = new Map<string, Question>();
    for (const q of questions) {
      map.set(q.id, optimisticOverrides.get(q.id) || q);
    }
    for (const [id, q] of optimisticOverrides.entries()) {
      map.set(id, q);
    }
    return map;
  }, [questions, optimisticOverrides]);

  const answerMap = useMemo(() => {
    const map = new Map<string, Answer>();
    for (const a of answers) {
      map.set(a.questionId, a);
    }
    return map;
  }, [answers]);

  const handleAnswerVerificationAction = async (
    q: Question,
    ans: Answer | undefined,
    targetStatus: 'MISMATCH_FLAGGED' | 'VERIFIED',
    reason?: string
  ) => {
    setIsSubmittingFlag(true);
    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: q.id,
          answerId: ans?.id,
          verificationStatus: targetStatus,
          reason,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update answer verification status');
      }

      setAnswerStatusOverrides((prev) => {
        const next = new Map(prev);
        next.set(q.id, targetStatus);
        return next;
      });
      setFlaggingQuestionId(null);
      setFlagReason('');

      if (targetStatus === 'VERIFIED') {
        setReclassifyNotification(`Marked ${q.provenance?.citation || q.id} answer as VERIFIED`);
      } else if (data.issueCreated && data.issueNumber) {
        setReclassifyNotification(
          `Flagged ${q.provenance?.citation || q.id} • GitHub Issue #${data.issueNumber} opened`
        );
      } else if (data.dispatched) {
        setReclassifyNotification(
          `Flagged ${q.provenance?.citation || q.id} • Cloud Auto-Fix Agent dispatched`
        );
      } else {
        setReclassifyNotification(
          `Flagged ${q.provenance?.citation || q.id} in Review Queue (/review)`
        );
      }
      setTimeout(() => setReclassifyNotification(null), 5000);
    } catch (err: any) {
      setReclassifyNotification(err?.message || 'Failed to flag mismatch');
      setTimeout(() => setReclassifyNotification(null), 5000);
    } finally {
      setIsSubmittingFlag(false);
    }
  };

  // Dynamic school and year options from subject questions
  const { availableSchools, availableYears } = useMemo(() => {
    const schoolSet = new Set<string>();
    const yearSet = new Set<number>();
    for (const q of questions) {
      if (q.subject !== activeSubject) continue;
      if (q.provenance?.school) schoolSet.add(q.provenance.school);
      if (q.provenance?.year) yearSet.add(q.provenance.year);
    }
    return {
      availableSchools: Array.from(schoolSet).sort(),
      availableYears: Array.from(yearSet).sort((a, b) => b - a),
    };
  }, [questions, activeSubject]);

  const hasActiveQuestionFilters =
    searchQuery.trim() !== '' ||
    filterPaperNumber !== 'all' ||
    filterSchool !== 'all' ||
    filterYear !== 'all';

  const matchesQuestionFilters = (q: Question): boolean => {
    if (filterPaperNumber !== 'all' && String(q.provenance?.paperNumber || 1) !== filterPaperNumber) {
      return false;
    }
    if (filterSchool !== 'all' && q.provenance?.school !== filterSchool) {
      return false;
    }
    if (filterYear !== 'all' && String(q.provenance?.year || '') !== filterYear) {
      return false;
    }
    if (searchQuery.trim() !== '') {
      const needle = searchQuery.trim().toLowerCase();
      const haystack = [
        q.id,
        q.provenance?.citation || '',
        q.chapter,
        q.subtopic || '',
        q.textContent,
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  };

  const selectedChapter = currentSyllabus.chapters.find((c) => c.id === selectedChapterId);

  // Filter worksheets by category / chapter
  const categoryWorksheets = worksheets.filter((ws) => {
    if (ws.subject !== activeSubject) return false;
    if (selectedChapterId === 'all') return true;
    return selectedChapter
      ? ws.chapter.trim().toLowerCase() === selectedChapter.name.trim().toLowerCase()
      : true;
  });

  // Filter worksheets by subtopic + active question-level filters
  const filteredWorksheets = categoryWorksheets.filter((ws) => {
    if (selectedSubtopic !== 'all') {
      const wsSub = ws.subtopic || ws.title;
      if (wsSub.trim().toLowerCase() !== selectedSubtopic.trim().toLowerCase()) {
        return false;
      }
    }
    if (!hasActiveQuestionFilters) return true;

    // Keep worksheet if its metadata matches search OR at least one question passes filters
    const wsQuestions = (ws.manifest?.questions || [])
      .map((qid) => questionMap.get(qid))
      .filter(Boolean) as Question[];
    return wsQuestions.some(matchesQuestionFilters);
  });

  const activeWorksheet =
    filteredWorksheets.find((w) => w.id === selectedWorksheetId) || filteredWorksheets[0] || null;

  const allWorksheetQuestions = useMemo(() => {
    if (!activeWorksheet?.manifest?.questions) return [];
    return activeWorksheet.manifest.questions
      .map((qid) => questionMap.get(qid))
      .filter(Boolean) as Question[];
  }, [activeWorksheet, questionMap]);

  const worksheetQuestions = useMemo(() => {
    if (!hasActiveQuestionFilters) return allWorksheetQuestions;
    return allWorksheetQuestions.filter(matchesQuestionFilters);
  }, [
    allWorksheetQuestions,
    hasActiveQuestionFilters,
    filterPaperNumber,
    filterSchool,
    filterYear,
    searchQuery,
  ]);

  const resetAllFilters = () => {
    setSearchQuery('');
    setFilterPaperNumber('all');
    setFilterSchool('all');
    setFilterYear('all');
  };

  const handleGenerateForChapter = async (chapterName: string) => {
    try {
      setGenerating(true);
      const res = await fetch('/api/worksheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: activeSubject,
          chapter: chapterName,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data?.id) {
          setSelectedWorksheetId(json.data.id);
        }
        if (onRefresh) onRefresh();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to generate worksheet');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = (ws: Worksheet | null, type: 'questions' | 'answers') => {
    if (!ws) return;
    window.open(`/api/worksheets/${ws.id}/${type}`, '_blank');
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Left Column (~56% width): Browsing, Filters & Worksheet Feed */}
      <div className="no-print w-[56%] h-full flex flex-col border-r border-border-subdued overflow-hidden bg-chassis">
        {/* Top Filter Bar */}
        <div className="p-4 border-b border-border-subdued bg-surface-1/40 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-[#f1f5f9] tracking-tight">
                  Teacher Resource Hub
                </h1>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#0c1a24] text-primary-cyan border border-primary-cyan/30">
                  {currentMeta.name} [{currentMeta.syllabusCode}]
                </span>
              </div>
              <p className="text-[11px] text-[#94a3b8] mt-0.5">
                SEAB-aligned topical worksheets across 16 Singapore Junior Colleges.
              </p>
            </div>

            <span className="text-[11px] font-mono text-[#94a3b8] shrink-0">
              {filteredWorksheets.length} Worksheets
            </span>
          </div>

          {/* Search & First-Class Question Filters */}
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-6 relative">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#64748b] pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search citation, ID, keyword..."
                aria-label="Search questions or worksheets"
                className="w-full pl-8 pr-7 py-1.5 rounded bg-surface-2 border border-border-subdued focus:border-primary-cyan focus:outline-none text-xs text-[#f1f5f9] placeholder:text-[#64748b]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#f1f5f9]"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <select
              value={filterPaperNumber}
              onChange={(e) => setFilterPaperNumber(e.target.value)}
              aria-label="Filter by paper number"
              className="col-span-3 px-2 py-1.5 rounded bg-surface-2 border border-border-subdued focus:border-primary-cyan focus:outline-none text-xs text-[#f1f5f9] cursor-pointer"
            >
              <option value="all">All Papers</option>
              <option value="1">Paper 1</option>
              <option value="2">Paper 2</option>
            </select>

            <select
              value={filterSchool}
              onChange={(e) => setFilterSchool(e.target.value)}
              aria-label="Filter by Junior College"
              className="col-span-3 px-2 py-1.5 rounded bg-surface-2 border border-border-subdued focus:border-primary-cyan focus:outline-none text-xs text-[#f1f5f9] cursor-pointer"
            >
              <option value="all">All JCs</option>
              {availableSchools.map((sch) => (
                <option key={sch} value={sch}>
                  {sch}
                </option>
              ))}
            </select>
          </div>

          {/* Secondary Filter Row: Year + Active Filter Reset */}
          {(availableYears.length > 0 || hasActiveQuestionFilters) && (
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="text-[#64748b] font-mono flex items-center gap-1">
                  <Filter size={11} />
                  <span>Year:</span>
                </span>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  aria-label="Filter by exam year"
                  className="px-2 py-1 rounded bg-surface-2 border border-border-subdued focus:border-primary-cyan focus:outline-none text-[11px] text-[#f1f5f9] cursor-pointer"
                >
                  <option value="all">All Years</option>
                  {availableYears.map((yr) => (
                    <option key={yr} value={String(yr)}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>

              {hasActiveQuestionFilters && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded bg-surface-2 hover:bg-surface-3 border border-border-subdued text-[#cbd5e1] hover:text-primary-cyan transition-colors font-mono"
                >
                  <RotateCcw size={11} />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>
          )}

          {/* Non-clipping Wrapped Chapter Selector */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={() => setSelectedChapterId('all')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                selectedChapterId === 'all'
                  ? 'bg-primary-cyan text-[#090e18] font-semibold shadow-cyan-glow'
                  : 'bg-surface-2 text-[#94a3b8] hover:text-[#f1f5f9] border border-border-subdued'
              }`}
            >
              All Chapters ({currentSyllabus.chapters.length})
            </button>
            {currentSyllabus.chapters.map((ch) => (
              <button
                key={ch.id}
                onClick={() => setSelectedChapterId(ch.id)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  selectedChapterId === ch.id
                    ? 'bg-primary-cyan text-[#090e18] font-semibold shadow-cyan-glow'
                    : 'bg-surface-2 text-[#94a3b8] hover:text-[#f1f5f9] border border-border-subdued'
                }`}
              >
                Ch {ch.chapterNumber}: {ch.name}
              </button>
            ))}
          </div>

          {/* Non-clipping Wrapped Subtopic Selector */}
          {categoryWorksheets.length > 1 && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs pt-1 border-t border-border-subdued/60">
              <span className="text-[11px] font-mono text-[#64748b] mr-1">
                Subtopics:
              </span>
              <button
                onClick={() => setSelectedSubtopic('all')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  selectedSubtopic === 'all'
                    ? 'bg-primary-cyan/20 text-primary-cyan border border-primary-cyan/40 font-semibold'
                    : 'bg-surface-2 text-[#94a3b8] hover:text-[#f1f5f9] border border-border-subdued'
                }`}
              >
                All ({categoryWorksheets.length})
              </button>
              {categoryWorksheets.map((ws) => {
                const subLabel = ws.subtopic || ws.title;
                const isSubActive = selectedSubtopic === subLabel;
                return (
                  <button
                    key={ws.id}
                    onClick={() => {
                      setSelectedSubtopic(subLabel);
                      setSelectedWorksheetId(ws.id);
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      isSubActive
                        ? 'bg-primary-cyan/20 text-primary-cyan border border-primary-cyan/40 font-semibold'
                        : 'bg-surface-2 text-[#94a3b8] hover:text-[#f1f5f9] border border-border-subdued'
                    }`}
                  >
                    {subLabel} ({ws.questionCount})
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Scrollable Feed of Chapter Worksheet Cards */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredWorksheets.length === 0 ? (
            <div className="p-8 text-center bg-surface-2 rounded-lg border border-border-subdued text-xs space-y-3">
              <p className="text-[#94a3b8]">
                {hasActiveQuestionFilters
                  ? 'No worksheets contain questions matching the active filters.'
                  : selectedChapter
                  ? `No compiled worksheets found for "${selectedChapter.name}".`
                  : 'No worksheets found for this selection.'}
              </p>
              {hasActiveQuestionFilters ? (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="px-3 py-1.5 rounded bg-surface-3 hover:bg-surface-high border border-border-active text-xs text-[#f1f5f9] inline-flex items-center gap-1.5"
                >
                  <RotateCcw size={13} />
                  <span>Reset Filters</span>
                </button>
              ) : (
                selectedChapter && (
                  <button
                    type="button"
                    disabled={generating}
                    onClick={() => handleGenerateForChapter(selectedChapter.name)}
                    className="px-4 py-2 rounded bg-primary-cyan hover:bg-primary-hover text-[#090e18] font-semibold text-xs shadow-cyan-glow transition-all disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    <Sparkles size={14} />
                    <span>
                      {generating
                        ? 'Compiling Official Worksheet...'
                        : `Compile "${selectedChapter.name}" Worksheet`}
                    </span>
                  </button>
                )
              )}
            </div>
          ) : (
            filteredWorksheets.map((ws) => {
              const isSelected = ws.id === activeWorksheet?.id;
              const isCoverageOpen = openCoverageWsId === ws.id;
              const wsQuestions = (ws.manifest?.questions || [])
                .map((qid) => questionMap.get(qid))
                .filter(Boolean) as Question[];
              const matchingCount = hasActiveQuestionFilters
                ? wsQuestions.filter(matchesQuestionFilters).length
                : ws.questionCount;

              return (
                <div
                  key={ws.id}
                  role="button"
                  tabIndex={0}
                  aria-selected={isSelected}
                  onClick={() => setSelectedWorksheetId(ws.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedWorksheetId(ws.id);
                    }
                  }}
                  className={`p-4 rounded-lg border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-surface-2 border-primary-cyan shadow-cyan-glow'
                      : 'bg-surface-1 hover:bg-surface-2 border-border-subdued hover:border-border-active'
                  }`}
                >
                  {/* Card Header Row */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-surface-3 text-primary-cyan border border-primary-cyan/30">
                        {ws.worksheetNumber}
                      </span>
                      <span className="text-xs text-[#94a3b8] font-mono">
                        {hasActiveQuestionFilters
                          ? `${matchingCount} of ${ws.questionCount} Questions`
                          : `${ws.questionCount} Questions`}{' '}
                        • {ws.totalMarks} Marks
                      </span>
                    </div>

                    {/* Compact Interactive JC Coverage Summary Pill / Popover */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenCoverageWsId(isCoverageOpen ? null : ws.id);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-3 hover:bg-surface-high border border-border-subdued text-[11px] font-mono text-[#cbd5e1] transition-colors"
                      >
                        <School size={11} className="text-primary-cyan" />
                        <span>{ws.sourceCoverage.length} JCs</span>
                      </button>

                      {isCoverageOpen && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 mt-1.5 w-64 p-2.5 rounded-lg bg-surface-1 border border-border-active shadow-2xl z-30 space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-[10px] font-mono text-[#94a3b8] uppercase">
                            <span>Source Coverage ({ws.sourceCoverage.length})</span>
                            <button
                              type="button"
                              onClick={() => setOpenCoverageWsId(null)}
                              className="text-[#94a3b8] hover:text-[#f1f5f9]"
                              aria-label="Close source coverage"
                            >
                              <X size={12} />
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1 font-mono text-[10px]">
                            {ws.sourceCoverage.map((sch) => (
                              <span
                                key={sch}
                                className="px-1.5 py-0.5 rounded bg-surface-2 border border-border-subdued text-[#cbd5e1]"
                              >
                                {sch}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Title & Chapter */}
                  <h3 className="text-sm font-semibold text-[#f1f5f9] mb-0.5">
                    {ws.title}
                  </h3>
                  <p className="text-[11px] text-[#94a3b8] mb-3">
                    {ws.chapter}
                  </p>

                  {/* Action Group */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-border-subdued/60">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadPdf(ws, 'questions');
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-primary-cyan hover:bg-primary-hover text-[#090e18] text-xs font-semibold shadow-cyan-glow transition-all"
                      >
                        <Download size={13} />
                        <span>Questions PDF</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadPdf(ws, 'answers');
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-3 hover:bg-surface-high border border-border-active hover:border-primary-cyan text-[#f1f5f9] text-xs font-medium transition-all"
                      >
                        <FileText size={13} />
                        <span>Answer Key PDF</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedWorksheetId(ws.id);
                      }}
                      className="flex items-center gap-1 text-xs text-primary-cyan hover:underline font-mono"
                    >
                      <Eye size={13} />
                      <span>{isSelected ? 'Viewing Canvas' : 'Preview'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column (~44% width): Live Cambridge A4 Print Preview Canvas */}
      <div className="w-[44%] print:w-full print:p-0 print:border-none print:bg-white h-full flex flex-col bg-[#080b0f] overflow-hidden">
        {/* Canvas Toolbar */}
        <div className="no-print h-14 px-4 border-b border-border-subdued bg-surface-1 flex items-center justify-between flex-shrink-0 gap-2">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs text-primary-cyan font-semibold flex items-center gap-1.5">
              <BookOpen size={15} />
              <span>A4 Canvas</span>
            </span>

            {/* Marking Guide Toggle */}
            <button
              type="button"
              onClick={() => setShowMarkingScheme(!showMarkingScheme)}
              aria-pressed={showMarkingScheme}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                showMarkingScheme
                  ? 'bg-status-approved/20 text-status-approved border border-status-approved/40 font-semibold'
                  : 'bg-surface-2 text-[#94a3b8] border border-border-subdued hover:text-[#f1f5f9]'
              }`}
            >
              {showMarkingScheme ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
              <span>{showMarkingScheme ? 'Mark Scheme ON' : 'Student Mode'}</span>
            </button>
          </div>

          {/* Zoom & Print Buttons */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center bg-surface-2 rounded border border-border-subdued text-xs">
              <button
                type="button"
                onClick={() => {
                  setIsAutoFitZoom(false);
                  setPreviewZoom((z) => Math.max(50, z - 10));
                }}
                className="p-1.5 text-[#94a3b8] hover:text-[#f1f5f9]"
                title="Zoom Out"
              >
                <ZoomOut size={13} />
              </button>
              <span className="px-1.5 text-[11px] font-mono text-[#cbd5e1]">{previewZoom}%</span>
              <button
                type="button"
                onClick={() => {
                  setIsAutoFitZoom(false);
                  setPreviewZoom((z) => Math.min(130, z + 10));
                }}
                className="p-1.5 text-[#94a3b8] hover:text-[#f1f5f9]"
                title="Zoom In"
              >
                <ZoomIn size={13} />
              </button>
              <button
                type="button"
                onClick={() => setIsAutoFitZoom(true)}
                className={`p-1.5 border-l border-border-subdued ${
                  isAutoFitZoom ? 'text-primary-cyan' : 'text-[#94a3b8] hover:text-[#f1f5f9]'
                }`}
                title="Fit to Pane Width"
              >
                <Maximize2 size={12} />
              </button>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-surface-2 hover:bg-surface-3 border border-border-active hover:border-primary-cyan text-xs font-medium text-[#f1f5f9] transition-all"
            >
              <Printer size={13} />
              <span>Print A4</span>
            </button>
          </div>
        </div>

        {/* Scrollable Container with Auto-Fitted Cambridge A4 Sheet */}
        <div
          ref={canvasViewportRef}
          className="flex-1 overflow-y-auto overflow-x-hidden p-5 flex justify-center items-start"
        >
          <div
            style={{
              width: `${595 * (previewZoom / 100)}px`,
            }}
            className="flex justify-center"
          >
            <div
              style={{
                transform: `scale(${previewZoom / 100})`,
                transformOrigin: 'top left',
                width: '595px',
              }}
              className="cambridge-canvas-container min-h-[842px] bg-white text-carbon-ink p-10 shadow-2xl rounded-sm transition-transform duration-150 relative select-text shrink-0"
            >
              {/* Cambridge Exam Header Block */}
              <div className="text-center pb-3 border-b-2 border-black">
                <div className="text-[11px] tracking-widest font-sans font-bold text-[#1f2937]">
                  PAPERFORGE EXAMINATION SERIES
                </div>
                <div className="text-[13px] font-serif font-bold text-black mt-1">
                  SINGAPORE-CAMBRIDGE GENERAL CERTIFICATE OF EDUCATION (A-LEVEL)
                </div>
                <div className="text-[12px] font-sans font-semibold text-[#111827] mt-0.5">
                  {currentMeta.level.toUpperCase()} {currentMeta.name.toUpperCase()} • CODE {currentMeta.syllabusCode}
                </div>
                <div className="text-[11px] font-sans text-[#374151] mt-0.5">
                  {activeWorksheet?.chapter || selectedChapter?.name || 'All Topics Revision'} •{' '}
                  {activeWorksheet?.title || activeWorksheet?.subtopic || 'Comprehensive Practice'} [
                  {activeWorksheet?.worksheetNumber || 'WS-01'}]
                </div>
              </div>

              {/* Student Fillable Box */}
              <div className="mt-3 p-2 border border-black/80 text-[10px] font-sans flex justify-between">
                <div>NAME: _____________________________________</div>
                <div>CLASS: _________</div>
                <div>INDEX NO: ______</div>
              </div>

              <div className="mt-2 flex justify-between text-[10px] font-sans text-[#374151] border-b border-black/30 pb-2">
                <span>Topical Practice Compendium</span>
                <span className="font-bold">
                  {worksheetQuestions.length}
                  {hasActiveQuestionFilters ? ` of ${allWorksheetQuestions.length}` : ''} Questions • Total:{' '}
                  {worksheetQuestions.reduce((acc, q) => acc + (q.marks || 0), 0)} marks
                </span>
              </div>

              {/* Questions List */}
              <div className="mt-5 space-y-6">
                {reclassifyNotification && (
                  <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg flex items-center justify-between text-xs text-emerald-900 shadow-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                      <span>{reclassifyNotification}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReclassifyNotification(null)}
                      className="text-emerald-700 hover:text-emerald-900 p-0.5"
                      aria-label="Dismiss notification"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                {!activeWorksheet || worksheetQuestions.length === 0 ? (
                  <div className="py-20 text-center text-[#64748b] font-sans text-xs space-y-2">
                    <FileText size={32} className="mx-auto text-[#94a3b8] mb-1" />
                    <div className="font-semibold text-[#1f2937] text-sm">
                      {hasActiveQuestionFilters ? 'No Matching Questions' : 'No Worksheet Selected'}
                    </div>
                    <p className="text-[11px] text-[#6b7280] max-w-xs mx-auto">
                      {hasActiveQuestionFilters
                        ? 'Adjust or reset the active filters on the left to view questions in this worksheet.'
                        : 'Select a worksheet from the left panel to preview in Cambridge A4 format.'}
                    </p>
                  </div>
                ) : (
                  <>
                    {worksheetQuestions.slice(0, displayLimit).map((q, idx) => {
                      const ans = answerMap.get(q.id);
                      const verStatus = answerStatusOverrides.get(q.id) || getAnswerVerificationStatus(ans);
                      const badge = VERIFICATION_BADGE_CONFIG[verStatus];
                      const BadgeIcon = badge.icon;
                      const qImgFailed = failedQuestionImages.has(q.id);
                      const aImgFailed = failedAnswerImages.has(q.id);

                      return (
                        <div key={q.id} className="text-[12px] font-serif leading-relaxed text-black">
                          <div className="flex justify-between items-start font-bold font-sans text-[11px] mb-1.5 pb-1 border-b border-black/10 gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[12px] font-bold">{idx + 1}.</span>
                              <button
                                type="button"
                                onClick={() => setReclassifyingQuestion(q)}
                                title="Click to reclassify chapter or subtopic"
                                className="font-sans font-medium text-[9px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-300 hover:border-slate-400 transition-all inline-flex items-center gap-1 group cursor-pointer"
                              >
                                <Tag size={9} className="text-slate-400 group-hover:text-sky-600 transition-colors" />
                                <span>
                                  {q.chapter}
                                  {q.subtopic ? ` • ${q.subtopic}` : ''}
                                </span>
                                <Edit3 size={9} className="opacity-0 group-hover:opacity-100 text-slate-600 transition-opacity ml-0.5" />
                              </button>
                            </div>
                            {q.marks && (
                              <span className="font-mono text-slate-800 shrink-0">[{q.marks} marks]</span>
                            )}
                          </div>

                          {/* Authentic High-Resolution Question Screenshot or React-state Text Fallback */}
                          {!qImgFailed ? (
                            <div className="my-2.5 flex justify-center bg-white rounded">
                              <img
                                src={getQuestionImageUrl(q.id, q.diagramUrl)}
                                alt={`Question ${idx + 1}`}
                                className="max-w-full h-auto object-contain rounded border border-slate-200/80"
                                loading="lazy"
                                onError={() => {
                                  setFailedQuestionImages((prev) => {
                                    const next = new Set(prev);
                                    next.add(q.id);
                                    return next;
                                  });
                                }}
                              />
                            </div>
                          ) : (
                            <div className="my-2 font-serif text-[12px] text-justify text-[#111827] pl-1 leading-relaxed">
                              <MathRenderer content={cleanQuestionStem(q.textContent, q.questionNumber, q.id)} />
                            </div>
                          )}

                          {/* Answer Pairing & Verification Strip */}
                          <div className="no-print mt-2 px-2.5 py-1.5 rounded bg-slate-50 border border-slate-200 text-[10px] font-sans">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap min-w-0">
                                <span
                                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border font-mono font-semibold text-[9px] shrink-0 ${badge.className}`}
                                >
                                  <BadgeIcon size={10} />
                                  <span>{badge.label}</span>
                                </span>
                                <span className="text-slate-600 font-mono truncate">
                                  {ans
                                    ? `Answer: ${ans.provenance?.citation || ans.id}${
                                        ans.solutionSourceFilename ? ` (${ans.solutionSourceFilename})` : ''
                                      }`
                                    : 'No paired answer key found'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2.5 shrink-0">
                                {verStatus !== 'VERIFIED' && (
                                  <button
                                    type="button"
                                    disabled={isSubmittingFlag}
                                    onClick={() => handleAnswerVerificationAction(q, ans, 'VERIFIED')}
                                    className="text-[10px] font-mono text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer disabled:opacity-50"
                                  >
                                    Verify
                                  </button>
                                )}
                                <button
                                  type="button"
                                  disabled={isSubmittingFlag}
                                  onClick={() => {
                                    setFlaggingQuestionId((prev) => (prev === q.id ? null : q.id));
                                    setFlagReason('');
                                  }}
                                  className="text-[10px] font-mono text-rose-700 hover:text-rose-900 hover:underline cursor-pointer disabled:opacity-50"
                                >
                                  Flag Mismatch
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setReclassifyingQuestion(q)}
                                  className="text-[10px] font-mono text-sky-700 hover:text-sky-900 hover:underline cursor-pointer"
                                >
                                  Reclassify
                                </button>
                              </div>
                            </div>

                            {flaggingQuestionId === q.id && (
                              <div className="mt-2 pt-2 border-t border-slate-200 flex flex-wrap items-center gap-1.5">
                                {['Wrong question', 'Cut off', 'Wrong paper', 'Missing'].map((preset) => (
                                  <button
                                    key={preset}
                                    type="button"
                                    disabled={isSubmittingFlag}
                                    onClick={() =>
                                      handleAnswerVerificationAction(q, ans, 'MISMATCH_FLAGGED', preset)
                                    }
                                    className="px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-[9px] font-mono cursor-pointer disabled:opacity-50"
                                  >
                                    {preset}
                                  </button>
                                ))}
                                <input
                                  type="text"
                                  value={flagReason}
                                  onChange={(e) => setFlagReason(e.target.value)}
                                  placeholder="Optional note..."
                                  className="flex-1 min-w-[120px] px-2 py-0.5 rounded border border-slate-300 bg-white text-[10px] text-slate-800 focus:outline-none focus:border-rose-400"
                                />
                                <button
                                  type="button"
                                  disabled={isSubmittingFlag}
                                  onClick={() =>
                                    handleAnswerVerificationAction(
                                      q,
                                      ans,
                                      'MISMATCH_FLAGGED',
                                      flagReason || 'Flagged from Teacher Resource Hub'
                                    )
                                  }
                                  className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-700 text-white text-[9px] font-mono font-semibold cursor-pointer disabled:opacity-50"
                                >
                                  {isSubmittingFlag ? 'Sending...' : 'Flag & Run Agent'}
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Marking Scheme Overlay if enabled */}
                          {showMarkingScheme && ans && (
                            <div className="mt-2.5 p-3 bg-[#f0fdf4] border border-[#86efac] rounded text-[11px] font-sans text-[#166534]">
                              <div className="font-bold text-[10px] uppercase font-mono tracking-wide text-[#15803d] mb-1.5 flex items-center justify-between gap-1.5">
                                <span className="flex items-center gap-1.5">
                                  <CheckCircle2 size={12} />
                                  <span>Official Mark Scheme & Working</span>
                                </span>
                                {ans.provenance?.citation && (
                                  <span className="text-[9px] font-normal text-[#166534]/80">
                                    {ans.provenance.citation}
                                  </span>
                                )}
                              </div>

                              {!aImgFailed ? (
                                <div className="my-2 flex justify-center bg-white rounded">
                                  <img
                                    src={getAnswerImageUrl(q.id, ans.diagramUrl)}
                                    alt={`Solution for Question ${idx + 1}`}
                                    className="max-w-full h-auto object-contain rounded border border-green-300"
                                    loading="lazy"
                                    onError={() => {
                                      setFailedAnswerImages((prev) => {
                                        const next = new Set(prev);
                                        next.add(q.id);
                                        return next;
                                      });
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className="text-black text-[11px] leading-relaxed">
                                  <MathRenderer content={ans.answerContent} />
                                </div>
                              )}

                              {ans.markSchemeNotes && (
                                <div className="mt-2 text-[10px] italic text-[#14532d] border-t border-[#bbf7d0] pt-1.5">
                                  Examiner Notes: {ans.markSchemeNotes}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Monospace Citation Footnote */}
                          <div className="mt-1.5 pl-1 text-[9px] font-mono text-[#6b7280]">
                            CITATION: {q.provenance.citation}
                          </div>
                        </div>
                      );
                    })}

                    {worksheetQuestions.length > displayLimit && (
                      <div className="no-print pt-6 pb-2 text-center border-t border-black/20 flex flex-col items-center gap-2">
                        <p className="text-[11px] font-sans text-slate-600">
                          Showing first {displayLimit} of {worksheetQuestions.length} questions in interactive preview.
                          The complete compendium ({worksheetQuestions.length} questions) is included when downloading PDFs.
                        </p>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setDisplayLimit((prev) => Math.min(prev + 30, worksheetQuestions.length))}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-slate-800 text-xs font-semibold cursor-pointer transition-colors"
                          >
                            Load Next 30 ({Math.min(displayLimit + 30, worksheetQuestions.length)} / {worksheetQuestions.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setDisplayLimit(worksheetQuestions.length)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-semibold cursor-pointer transition-colors"
                          >
                            Load All ({worksheetQuestions.length} Questions)
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Bottom Actions Bar */}
        <div className="no-print h-14 px-4 border-t border-border-subdued bg-surface-1 flex items-center justify-between flex-shrink-0 gap-2">
          <div className="text-xs text-[#94a3b8] font-mono truncate">
            {activeWorksheet?.worksheetNumber}: {worksheetQuestions.length} questions
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleDownloadPdf(activeWorksheet, 'questions')}
              disabled={!activeWorksheet}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary-cyan hover:bg-primary-hover text-[#090e18] text-xs font-semibold shadow-cyan-glow transition-all disabled:opacity-50"
            >
              <Download size={13} />
              <span>Print Student Paper</span>
            </button>
            <button
              type="button"
              onClick={() => handleDownloadPdf(activeWorksheet, 'answers')}
              disabled={!activeWorksheet}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface-2 hover:bg-surface-3 border border-border-active hover:border-primary-cyan text-xs font-medium text-[#f1f5f9] transition-all disabled:opacity-50"
            >
              <FileText size={13} />
              <span>Print Full Tutor Key</span>
            </button>
          </div>
        </div>

        {/* Interactive Question Reclassification Modal */}
        <ReclassifyModal
          isOpen={!!reclassifyingQuestion}
          onClose={() => setReclassifyingQuestion(null)}
          question={reclassifyingQuestion}
          onReclassified={(updated, _movedFrom, movedTo) => {
            setOptimisticOverrides((prev) => {
              const next = new Map(prev);
              next.set(updated.id, updated);
              return next;
            });

            let msg = `Question ${updated.questionNumber} (${updated.provenance.citation}) reclassified to ${updated.chapter}${
              updated.subtopic ? ` • ${updated.subtopic}` : ''
            }.`;
            if (movedTo && activeWorksheet && movedTo !== activeWorksheet.worksheetNumber) {
              msg += ` Automatically transferred from ${activeWorksheet.worksheetNumber} to ${movedTo}.`;
            }
            setReclassifyNotification(msg);

            if (onRefresh) {
              onRefresh();
            }
          }}
        />
      </div>
    </div>
  );
};
