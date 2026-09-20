'use client';

import React, { useState } from 'react';
import {
  Download,
  FileText,
  Printer,
  CheckCircle2,
  Eye,
  BookOpen,
  School,
  Sparkles,
  Layers,
  ZoomIn,
  ZoomOut,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import {
  SubjectId,
  SUBJECT_METADATA,
  SINGAPORE_A_LEVEL_SYLLABI,
  Worksheet,
  Question,
  Answer,
} from '@paperforge/shared';

interface TeacherResourceHubProps {
  activeSubject: SubjectId;
  worksheets: Worksheet[];
  questions: Question[];
  answers: Answer[];
}

export const TeacherResourceHub: React.FC<TeacherResourceHubProps> = ({
  activeSubject,
  worksheets,
  questions,
  answers,
}) => {
  const currentSyllabus = SINGAPORE_A_LEVEL_SYLLABI[activeSubject];
  const currentMeta = SUBJECT_METADATA[activeSubject];

  const [selectedChapterId, setSelectedChapterId] = useState<string>('all');
  const [selectedWorksheetId, setSelectedWorksheetId] = useState<string>(
    worksheets[0]?.id || 'ws_chem_01'
  );
  const [showMarkingScheme, setShowMarkingScheme] = useState<boolean>(false);
  const [previewZoom, setPreviewZoom] = useState<number>(100);

  // Filter worksheets by chapter
  const filteredWorksheets = worksheets.filter((ws) => {
    if (ws.subject !== activeSubject) return false;
    if (selectedChapterId === 'all') return true;
    const ch = currentSyllabus.chapters.find((c) => c.id === selectedChapterId);
    return ch ? ws.chapter.trim().toLowerCase() === ch.name.trim().toLowerCase() : true;
  });

  const activeWorksheet =
    worksheets.find((w) => w.id === selectedWorksheetId) || filteredWorksheets[0] || worksheets[0];

  // Questions for preview
  const worksheetQuestions = activeWorksheet?.manifest?.questions
    ? activeWorksheet.manifest.questions
        .map((qid) => questions.find((q) => q.id === qid))
        .filter(Boolean) as Question[]
    : questions.filter((q) => q.subject === activeSubject).slice(0, 3);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async (type: 'questions' | 'answers') => {
    if (!activeWorksheet) return;
    const url = `/api/worksheets/${activeWorksheet.id}/${type}`;
    window.open(url, '_blank');
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Left Column (~60% width): Browsing, Chapter Filters & Worksheet Feed */}
      <div className="no-print w-[58%] h-full flex flex-col border-r border-border-subdued overflow-hidden bg-chassis">
        {/* Top Filter Bar */}
        <div className="p-5 border-b border-border-subdued bg-surface-1/40 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#f1f5f9] tracking-tight">
                  Teacher Resource & Download Hub
                </h1>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#0c1a24] text-primary-cyan border border-primary-cyan/30">
                  {currentMeta.name} [{currentMeta.syllabusCode}]
                </span>
              </div>
              <p className="text-xs text-[#94a3b8] mt-0.5">
                Automated chapter-based worksheets compiled across all 16 Singapore Junior Colleges.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-[#64748b]">
                {filteredWorksheets.length} Worksheets Ready
              </span>
            </div>
          </div>

          {/* Chapter Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedChapterId('all')}
              className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors ${
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
                className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedChapterId === ch.id
                    ? 'bg-primary-cyan text-[#090e18] font-semibold shadow-cyan-glow'
                    : 'bg-surface-2 text-[#94a3b8] hover:text-[#f1f5f9] border border-border-subdued'
                }`}
              >
                Ch {ch.chapterNumber}: {ch.name.split('—')[0].split('&')[0]}
              </button>
            ))}
          </div>

          {/* Nationwide JC Coverage Bar */}
          <div className="flex items-center justify-between px-3 py-2 rounded bg-surface-2/70 border border-border-subdued text-[11px]">
            <div className="flex items-center gap-2 text-[#cbd5e1]">
              <School size={14} className="text-primary-cyan" />
              <span className="font-medium">16 Singapore Junior Colleges Indexed:</span>
              <span className="font-mono text-[#94a3b8]">
                RI, HCI, NYJC, VJC, ACJC, EJC, NJC, TJC, DHS, RVHS +6 others
              </span>
            </div>
            <span className="flex items-center gap-1 text-status-approved font-mono">
              <CheckCircle2 size={12} />
              100% Verified
            </span>
          </div>
        </div>

        {/* Scrollable Feed of Chapter Worksheet Cards */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {filteredWorksheets.length === 0 ? (
            <div className="p-8 text-center bg-surface-2 rounded-lg border border-border-subdued text-xs text-[#64748b]">
              No worksheets found for this chapter filter. Select &apos;All Chapters&apos; above.
            </div>
          ) : (
            filteredWorksheets.map((ws) => {
              const isSelected = ws.id === activeWorksheet?.id;
              return (
                <div
                  key={ws.id}
                  onClick={() => setSelectedWorksheetId(ws.id)}
                  className={`p-5 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-surface-2 border-primary-cyan shadow-cyan-glow'
                      : 'bg-surface-1 hover:bg-surface-2 border-border-subdued hover:border-border-active'
                  }`}
                >
                  {/* Card Header Row */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-surface-3 text-primary-cyan border border-primary-cyan/30">
                        {ws.worksheetNumber}
                      </span>
                      <span className="text-xs text-[#94a3b8] font-mono">
                        {ws.questionCount} Questions • {ws.totalMarks} Total Marks
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-status-approved font-medium font-mono">
                      <span className="w-2 h-2 rounded-full bg-status-approved animate-pulse" />
                      <span>Verified Ready to Print</span>
                    </div>
                  </div>

                  {/* Card Title & Syllabus Description */}
                  <h3 className="text-base font-semibold text-[#f1f5f9] mb-1">
                    {ws.title}
                  </h3>
                  <p className="text-xs text-[#94a3b8] leading-relaxed mb-3">
                    {ws.chapter} • High-yield Cambridge standard practice questions compiled from Singapore prelim examination papers.
                  </p>

                  {/* Nationwide Citation Matrix */}
                  <div className="p-2.5 rounded bg-surface-3/70 border border-border-subdued/80 mb-4 text-xs space-y-1">
                    <div className="text-[11px] text-[#94a3b8] font-mono">
                      Includes citations from:
                    </div>
                    <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
                      {ws.sourceCoverage.map((sch) => (
                        <span
                          key={sch}
                          className="px-1.5 py-0.5 rounded bg-surface-1 border border-border-subdued text-[#cbd5e1]"
                        >
                          [{sch} Prelim]
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action Group */}
                  <div className="flex items-center justify-between pt-2 border-t border-border-subdued/60">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadPdf('questions');
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary-cyan hover:bg-primary-hover text-[#090e18] text-xs font-semibold shadow-cyan-glow transition-all"
                      >
                        <Download size={14} />
                        <span>Questions PDF</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadPdf('answers');
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface-3 hover:bg-surface-high border border-border-active hover:border-primary-cyan text-[#f1f5f9] text-xs font-medium transition-all"
                      >
                        <FileText size={14} />
                        <span>Answer Key PDF</span>
                      </button>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedWorksheetId(ws.id);
                      }}
                      className="flex items-center gap-1 text-xs text-primary-cyan hover:underline font-mono"
                    >
                      <Eye size={14} />
                      <span>{isSelected ? 'Viewing Canvas' : 'Preview Paper'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column (~42% width): Live Cambridge A4 Print Preview Canvas */}
      <div className="w-[42%] h-full flex flex-col bg-[#080b0f] overflow-hidden">
        {/* Canvas Toolbar */}
        <div className="no-print h-14 px-4 border-b border-border-subdued bg-surface-1 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-primary-cyan font-semibold flex items-center gap-1.5">
              <BookOpen size={15} />
              <span>Cambridge A4 Canvas</span>
            </span>

            {/* Marking Guide Toggle */}
            <button
              onClick={() => setShowMarkingScheme(!showMarkingScheme)}
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
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-surface-2 rounded border border-border-subdued text-xs">
              <button
                onClick={() => setPreviewZoom(Math.max(70, previewZoom - 10))}
                className="p-1.5 text-[#94a3b8] hover:text-[#f1f5f9]"
                title="Zoom Out"
              >
                <ZoomOut size={14} />
              </button>
              <span className="px-1.5 text-[11px] font-mono text-[#cbd5e1]">{previewZoom}%</span>
              <button
                onClick={() => setPreviewZoom(Math.min(130, previewZoom + 10))}
                className="p-1.5 text-[#94a3b8] hover:text-[#f1f5f9]"
                title="Zoom In"
              >
                <ZoomIn size={14} />
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface-2 hover:bg-surface-3 border border-border-active hover:border-primary-cyan text-xs font-medium text-[#f1f5f9] transition-all"
            >
              <Printer size={14} />
              <span>Print A4</span>
            </button>
          </div>
        </div>

        {/* Scrollable Container with Elevated Cambridge A4 Sheet */}
        <div className="flex-1 overflow-y-auto p-6 flex justify-center items-start">
          <div
            style={{
              transform: `scale(${previewZoom / 100})`,
              transformOrigin: 'top center',
            }}
            className="cambridge-canvas-container w-[595px] min-h-[842px] bg-white text-carbon-ink p-10 shadow-2xl rounded-sm transition-transform duration-150 relative select-text"
          >
            {/* Cambridge Exam Header Block */}
            <div className="text-center pb-3 border-b-2 border-black">
              <div className="text-[11px] tracking-widest font-sans font-bold text-[#1f2937]">
                PAPERFORGE AUTOMATED EXAMINATION SERIES
              </div>
              <div className="text-[13px] font-serif font-bold text-black mt-1">
                SINGAPORE-CAMBRIDGE GENERAL CERTIFICATE OF EDUCATION (A-LEVEL)
              </div>
              <div className="text-[12px] font-sans font-semibold text-[#111827] mt-0.5">
                {currentMeta.level.toUpperCase()} {currentMeta.name.toUpperCase()} • CODE {currentMeta.syllabusCode}
              </div>
              <div className="text-[11px] font-sans text-[#374151] mt-0.5">
                Chapter: {activeWorksheet?.chapter || 'Organic Chemistry'} [{activeWorksheet?.worksheetNumber || 'WS-01'}]
              </div>
            </div>

            {/* Student Fillable Box */}
            <div className="mt-3 p-2 border border-black/80 text-[10px] font-sans flex justify-between">
              <div>NAME: _____________________________________</div>
              <div>CLASS: _________</div>
              <div>INDEX NO: ______</div>
            </div>

            <div className="mt-2 flex justify-between text-[10px] font-sans text-[#374151] border-b border-black/30 pb-2">
              <span>Time Allowed: 1 Hour 15 Minutes</span>
              <span className="font-bold">Total: {activeWorksheet?.totalMarks || 10} marks</span>
            </div>

            {/* Questions List */}
            <div className="mt-5 space-y-6">
              {worksheetQuestions.map((q, idx) => {
                const ans = answers.find((a) => a.questionId === q.id);
                return (
                  <div key={q.id} className="text-[12px] font-serif leading-relaxed text-black">
                    <div className="flex justify-between items-start font-bold font-sans text-[11px] mb-1">
                      <span>{q.questionNumber}.</span>
                      {q.marks && <span className="font-mono">[{q.marks} marks]</span>}
                    </div>

                    <p className="font-serif text-[12px] text-justify text-[#111827] pl-2">
                      {q.textContent}
                    </p>

                    {/* Marking Scheme Overlay if enabled */}
                    {showMarkingScheme && ans && (
                      <div className="mt-2 p-2.5 bg-[#f0fdf4] border border-[#86efac] rounded text-[11px] font-sans text-[#166534]">
                        <div className="font-bold text-[10px] uppercase font-mono tracking-wide text-[#15803d]">
                          Official Mark Scheme:
                        </div>
                        <p className="mt-0.5 text-black">{ans.answerContent}</p>
                        {ans.markSchemeNotes && (
                          <div className="mt-1 text-[10px] italic text-[#14532d]">
                            Guide: {ans.markSchemeNotes}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Monospace Citation Footnote */}
                    <div className="mt-1.5 pl-2 text-[9px] font-mono text-[#6b7280]">
                      CITATION: {q.provenance.citation}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Red Dashed Cambridge Page Boundary Marker */}
            <div className="mt-8 pt-4 border-t-2 border-dashed border-[#ef4444] text-center">
              <span className="font-mono text-[9px] text-[#ef4444] tracking-wider uppercase font-semibold bg-white px-2">
                PAGE BREAK (PRINT BOUNDARY • PAGE 1 OF {Math.max(1, Math.ceil(worksheetQuestions.length / 3))})
              </span>
            </div>

            <div className="mt-6 flex justify-between text-[10px] font-sans text-[#4b5563]">
              <span>[Turn Over</span>
              <span>PaperForge Automated Distribution</span>
            </div>
          </div>
        </div>

        {/* Sticky Bottom Actions Bar */}
        <div className="no-print h-16 px-6 border-t border-border-subdued bg-surface-1 flex items-center justify-between flex-shrink-0">
          <div className="text-xs text-[#94a3b8] font-mono">
            {activeWorksheet?.worksheetNumber}: {worksheetQuestions.length} questions loaded
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleDownloadPdf('questions')}
              className="flex items-center gap-2 px-4 py-2 rounded bg-primary-cyan hover:bg-primary-hover text-[#090e18] text-xs font-semibold shadow-cyan-glow transition-all"
            >
              <Download size={14} />
              <span>Print Student Paper</span>
            </button>
            <button
              onClick={() => handleDownloadPdf('answers')}
              className="flex items-center gap-2 px-4 py-2 rounded bg-surface-2 hover:bg-surface-3 border border-border-active hover:border-primary-cyan text-xs font-medium text-[#f1f5f9] transition-all"
            >
              <FileText size={14} />
              <span>Print Full Tutor Key</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
