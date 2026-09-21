'use client';

import React, { useState } from 'react';
import {
  Search,
  Filter,
  Layers,
  FileText,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Sparkles,
  School,
} from 'lucide-react';
import {
  Question,
  Answer,
  SubjectId,
  SINGAPORE_SCHOOLS,
  SingaporeSchoolCode,
  SUBJECT_METADATA,
} from '@paperforge/shared';

export interface QuestionBankMatrixProps {
  questions: Question[];
  answers: Answer[];
  activeSubject: SubjectId;
}

export const QuestionBankMatrix: React.FC<QuestionBankMatrixProps> = ({
  questions,
  answers,
  activeSubject,
}) => {
  const [search, setSearch] = useState('');
  const [selectedSchool, setSelectedSchool] = useState<string>('all');
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(questions[0] || null);

  const filtered = questions.filter((q) => {
    if (q.subject !== activeSubject) return false;
    if (selectedSchool !== 'all' && q.provenance.school !== selectedSchool) return false;
    if (search) {
      const query = search.toLowerCase();
      return (
        q.textContent.toLowerCase().includes(query) ||
        q.provenance.citation.toLowerCase().includes(query) ||
        q.questionNumber.toLowerCase().includes(query) ||
        q.chapter.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const activeAnswer = selectedQuestion
    ? answers.find((a) => a.questionId === selectedQuestion.id)
    : null;

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Left List (~60%) */}
      <div className="w-3/5 h-full flex flex-col border-r border-border-subdued bg-chassis overflow-hidden">
        {/* Filter Bar */}
        <div className="p-4 border-b border-border-subdued bg-surface-1/50 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-[#f1f5f9] tracking-tight flex items-center gap-2">
              <Layers size={18} className="text-primary-cyan" />
              <span>Singapore A-Level Question Matrix</span>
            </h1>
            <span className="text-xs font-mono text-[#94a3b8]">
              {filtered.length} of {questions.filter((q) => q.subject === activeSubject).length} Questions
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-2.5 text-[#94a3b8]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search question text, citation, formula"
                placeholder="Search question text, citation, formula..."
                className="w-full bg-surface-2 border border-border-subdued focus:border-primary-cyan rounded pl-9 pr-3 py-1.5 text-xs text-[#dee2f1] focus:outline-none"
              />
            </div>

            {/* School Filter */}
            <select
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              aria-label="Filter questions by Singapore Junior College"
              className="bg-surface-2 border border-border-subdued rounded px-3 py-1.5 text-xs text-[#dee2f1] focus:outline-none"
            >
              <option value="all">All Singapore JCs</option>
              {(Object.keys(SINGAPORE_SCHOOLS) as SingaporeSchoolCode[]).map((code) => (
                <option key={code} value={code}>
                  {code} ({SINGAPORE_SCHOOLS[code].name})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table Rows */}
        <div className="flex-1 overflow-y-auto divide-y divide-border-subdued">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#94a3b8] space-y-2">
              <FileText size={28} className="mx-auto text-[#64748b]" />
              <div className="font-semibold text-[#f1f5f9]">Question Bank is Empty</div>
              <p className="text-[11px] text-[#64748b]">
                No questions found. Ingest an examination paper in Sources to populate the question bank.
              </p>
            </div>
          ) : (
            filtered.map((q) => {
            const isSelected = q.id === selectedQuestion?.id;
            return (
              <div
                key={q.id}
                role="button"
                tabIndex={0}
                aria-selected={isSelected}
                onClick={() => setSelectedQuestion(q)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedQuestion(q);
                  }
                }}
                className={`p-4 cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-surface-2 border-l-2 border-primary-cyan'
                    : 'bg-surface-1/40 hover:bg-surface-2'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary-cyan bg-[#091822] px-1.5 py-0.5 rounded border border-primary-cyan/30">
                      {q.questionNumber}
                    </span>
                    <span className="font-mono text-xs text-[#94a3b8]">
                      {q.provenance.citation}
                    </span>
                  </div>
                  {q.marks && (
                    <span className="font-mono text-xs text-[#cbd5e1] font-semibold">
                      [{q.marks}m]
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#cbd5e1] line-clamp-2 leading-relaxed">
                  {q.textContent}
                </p>

                <div className="mt-2 flex items-center justify-between text-[11px] text-[#64748b]">
                  <span className="truncate max-w-[70%]">{q.chapter}</span>
                  <span className="text-status-approved font-mono flex items-center gap-1">
                    <CheckCircle2 size={11} />
                    {q.status}
                  </span>
                </div>
              </div>
            );
          }))}
        </div>
      </div>

      {/* Right Inspector Drawer (~40%) */}
      <div className="w-2/5 h-full flex flex-col bg-surface-1 overflow-y-auto p-6 space-y-6">
        {selectedQuestion ? (
          <>
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-[#64748b]">
                <span>QUESTION INSPECTOR</span>
                <span className="px-2 py-0.5 rounded bg-[#091a24] text-primary-cyan border border-primary-cyan/30">
                  {selectedQuestion.id}
                </span>
              </div>
              <h2 className="text-base font-bold text-[#f1f5f9] mt-2">
                Question {selectedQuestion.questionNumber} • {selectedQuestion.chapter}
              </h2>
              <div className="mt-1 font-mono text-xs text-[#94a3b8]">
                {selectedQuestion.provenance.citation}
              </div>
            </div>

            {/* Stored Text Content */}
            <div className="p-4 rounded-lg bg-surface-2 border border-border-subdued space-y-2">
              <div className="text-[11px] font-mono uppercase text-[#64748b]">
                Question Stem (Cambridge Formatted)
              </div>
              <p className="text-xs text-[#f1f5f9] leading-relaxed font-serif">
                {selectedQuestion.textContent}
              </p>
              {selectedQuestion.marks && (
                <div className="pt-2 border-t border-border-subdued text-xs font-mono text-[#94a3b8]">
                  Mark Allocation: {selectedQuestion.marks} marks
                </div>
              )}
            </div>

            {/* Answer & Mark Scheme */}
            {activeAnswer && (
              <div className="p-4 rounded-lg bg-[#0c1815] border border-status-approved/40 space-y-2">
                <div className="text-[11px] font-mono uppercase text-status-approved font-semibold flex items-center gap-1.5">
                  <CheckCircle2 size={13} />
                  <span>Official Verified Mark Scheme</span>
                </div>
                <p className="text-xs text-[#dee2f1] leading-relaxed">
                  {activeAnswer.answerContent}
                </p>
                {activeAnswer.markSchemeNotes && (
                  <div className="text-[11px] italic text-[#86efac]">
                    Notes: {activeAnswer.markSchemeNotes}
                  </div>
                )}
              </div>
            )}

            {/* Bounding Box Coordinates */}
            <div className="p-4 rounded-lg bg-surface-2 border border-border-subdued space-y-2">
              <div className="text-[11px] font-mono uppercase text-[#64748b]">
                PDF Region Bounding Box Coordinates
              </div>
              {selectedQuestion.regions.map((r, i) => (
                <div key={r.id} className="text-xs font-mono text-[#cbd5e1]">
                  Region {i + 1}: Page {r.pageNumber} • [{r.bbox.join(', ')}]
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-[#64748b]">
            Select a question from the matrix to inspect details.
          </div>
        )}
      </div>
    </div>
  );
};
