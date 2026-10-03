'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  CheckCircle2,
  Tag,
  AlertCircle,
  ArrowRight,
  BookOpen,
  Loader2,
} from 'lucide-react';
import {
  Question,
  SINGAPORE_A_LEVEL_SYLLABI,
  SubjectId,
} from '@paperforge/shared';
import { getQuestionImageUrl } from '../../lib/storage-url';

export interface ReclassifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: Question | null;
  onReclassified?: (
    updated: Question,
    movedFromWorksheet?: string,
    movedToWorksheet?: string
  ) => void;
}

export const ReclassifyModal: React.FC<ReclassifyModalProps> = ({
  isOpen,
  onClose,
  question,
  onReclassified,
}) => {
  const [selectedChapter, setSelectedChapter] = useState('');
  const [selectedSubtopic, setSelectedSubtopic] = useState('');
  const [isCustomSubtopic, setIsCustomSubtopic] = useState(false);
  const [customSubtopic, setCustomSubtopic] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  // Available syllabus chapters based on question's subject
  const subjectKey = (question?.subject || 'mathematics') as SubjectId;
  const syllabusDef = SINGAPORE_A_LEVEL_SYLLABI[subjectKey] || SINGAPORE_A_LEVEL_SYLLABI.mathematics;
  const syllabusChapters = syllabusDef.chapters || [];

  // Initialize form state when a question is selected
  useEffect(() => {
    if (question) {
      setSelectedChapter(question.chapter || (syllabusChapters[0]?.name ?? ''));
      setSelectedSubtopic(question.subtopic || '');
      setIsCustomSubtopic(false);
      setCustomSubtopic('');
      setErrorMessage(null);
      setImageError(false);
    }
  }, [question, syllabusChapters]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  // Get active subtopics for current selected chapter
  const currentChapterDef = syllabusChapters.find(
    (c) => c.name.toLowerCase() === selectedChapter.toLowerCase()
  );
  const officialSubtopics = currentChapterDef?.subtopics || [];

  const handleChapterChange = (newChapter: string) => {
    setSelectedChapter(newChapter);
    const chapterDef = syllabusChapters.find(
      (c) => c.name.toLowerCase() === newChapter.toLowerCase()
    );
    const firstSubtopic = chapterDef?.subtopics[0]?.name || '';
    setSelectedSubtopic(firstSubtopic);
    setIsCustomSubtopic(false);
    setCustomSubtopic('');
  };

  const handleSubtopicSelectChange = (val: string) => {
    if (val === '__custom__') {
      setIsCustomSubtopic(true);
      setCustomSubtopic('');
    } else {
      setIsCustomSubtopic(false);
      setSelectedSubtopic(val);
    }
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!question) return;

      const finalSubtopic = isCustomSubtopic
        ? customSubtopic.trim()
        : selectedSubtopic.trim();

      if (!selectedChapter.trim()) {
        setErrorMessage('Please select a valid syllabus chapter.');
        return;
      }

      setIsSubmitting(true);
      setErrorMessage(null);

      try {
        const response = await fetch('/api/questions', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionId: question.id,
            chapter: selectedChapter,
            subtopic: finalSubtopic || null,
          }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to update question classification');
        }

        if (onReclassified) {
          onReclassified(result.data, result.movedFromWorksheet, result.movedToWorksheet);
        }
        onClose();
      } catch (err: any) {
        setErrorMessage(err.message || 'An error occurred while saving the classification.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [question, isCustomSubtopic, customSubtopic, selectedSubtopic, selectedChapter, onReclassified, onClose]
  );

  if (!isOpen || !question) return null;

  const effectiveSubtopic = isCustomSubtopic ? customSubtopic : selectedSubtopic;
  const isChanged =
    selectedChapter !== question.chapter ||
    effectiveSubtopic !== (question.subtopic || '');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reclassify-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div className="bg-surface-1 border border-border-active rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-5 text-[#f1f5f9] animate-in fade-in-0 zoom-in-95 duration-150 my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border-subdued pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-primary-cyan/15 text-primary-cyan">
              <Tag size={18} />
            </div>
            <div>
              <h2 id="reclassify-modal-title" className="text-base font-bold text-[#f1f5f9]">
                Reclassify Question
              </h2>
              <p className="text-xs text-[#94a3b8] font-mono">
                {question.provenance.citation} • {question.id}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close dialog"
            className="p-1 rounded hover:bg-surface-2 text-[#94a3b8] hover:text-[#f1f5f9] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3 bg-red-950/50 border border-red-800 rounded-lg flex items-center gap-2.5 text-xs text-red-200">
            <AlertCircle size={16} className="text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Question Crop Thumbnail & Preview */}
        <div className="rounded-lg bg-surface-2 border border-border-subdued p-3 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#94a3b8]">
            <span className="uppercase">Question Stem Preview</span>
            {question.marks && (
              <span className="font-semibold text-[#cbd5e1]">[{question.marks} marks]</span>
            )}
          </div>
          <div className="max-h-40 overflow-y-auto rounded bg-white p-2 border border-slate-300 flex justify-center items-center">
            {!imageError ? (
              <img
                src={question.diagramUrl || getQuestionImageUrl(question.id)}
                alt={`Question ${question.questionNumber}`}
                className="max-w-full h-auto object-contain max-h-36"
                onError={() => setImageError(true)}
              />
            ) : (
              <p className="text-xs text-slate-800 font-serif leading-relaxed line-clamp-4">
                {question.textContent}
              </p>
            )}
          </div>
        </div>

        {/* Current vs Proposed Classification Flow */}
        <div className="p-3 bg-surface-2/60 border border-border-subdued rounded-lg flex items-center justify-between text-xs">
          <div>
            <div className="text-[10px] font-mono uppercase text-[#64748b]">Current Classification</div>
            <div className="font-semibold text-rose-300 mt-0.5">
              {question.chapter} {question.subtopic ? `• ${question.subtopic}` : ''}
            </div>
          </div>
          <ArrowRight size={16} className="text-[#64748b] shrink-0 mx-2" />
          <div className="text-right">
            <div className="text-[10px] font-mono uppercase text-[#64748b]">New Classification</div>
            <div className="font-semibold text-primary-cyan mt-0.5">
              {selectedChapter} {effectiveSubtopic ? `• ${effectiveSubtopic}` : ''}
            </div>
          </div>
        </div>

        {/* Form Controls */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Chapter Selector */}
          <div>
            <label
              htmlFor="reclassify-chapter-select"
              className="block text-xs font-mono text-[#cbd5e1] mb-1.5 flex items-center gap-1.5"
            >
              <BookOpen size={14} className="text-primary-cyan" />
              <span>Official SEAB Syllabus Chapter *</span>
            </label>
            <select
              id="reclassify-chapter-select"
              value={selectedChapter}
              onChange={(e) => handleChapterChange(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border-subdued focus:border-primary-cyan focus:outline-none text-xs text-[#f1f5f9] cursor-pointer"
            >
              {syllabusChapters.map((ch) => (
                <option key={ch.id} value={ch.name} className="bg-surface-1 text-[#f1f5f9]">
                  {ch.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subtopic Selector */}
          <div>
            <label
              htmlFor="reclassify-subtopic-select"
              className="block text-xs font-mono text-[#cbd5e1] mb-1.5 flex items-center justify-between"
            >
              <span>Subtopic</span>
              <span className="text-[10px] text-[#64748b]">Contextual to {selectedChapter}</span>
            </label>
            {!isCustomSubtopic ? (
              <select
                id="reclassify-subtopic-select"
                value={selectedSubtopic}
                onChange={(e) => handleSubtopicSelectChange(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border-subdued focus:border-primary-cyan focus:outline-none text-xs text-[#f1f5f9] cursor-pointer"
              >
                {officialSubtopics.map((st) => (
                  <option key={st.id} value={st.name} className="bg-surface-1 text-[#f1f5f9]">
                    {st.name}
                  </option>
                ))}
                <option value="__custom__" className="bg-surface-1 text-primary-cyan font-semibold">
                  + Custom Subtopic...
                </option>
              </select>
            ) : (
              <div className="space-y-1.5">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customSubtopic}
                    onChange={(e) => setCustomSubtopic(e.target.value)}
                    placeholder="Enter custom subtopic title..."
                    autoFocus
                    disabled={isSubmitting}
                    className="flex-1 px-3 py-2 rounded-lg bg-surface-2 border border-primary-cyan focus:outline-none text-xs text-[#f1f5f9]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomSubtopic(false);
                      setSelectedSubtopic(officialSubtopics[0]?.name || '');
                    }}
                    className="px-2.5 py-1 text-xs rounded bg-surface-2 hover:bg-surface-3 text-[#94a3b8] hover:text-[#f1f5f9] border border-border-subdued"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Automated Compendium Reassignment Callout */}
          <div className="p-3 bg-primary-cyan/10 border border-primary-cyan/25 rounded-lg flex items-start gap-2.5 text-xs text-[#94a3b8]">
            <CheckCircle2 size={15} className="text-primary-cyan shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              When saved, this question is automatically synchronized to Supabase PostgreSQL,
              re-indexed into the authentic chapter compendium (e.g. WS-MATH-01 through WS-MATH-06),
              and updated in live Cambridge PDF exports.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end items-center gap-3 pt-2 border-t border-border-subdued">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-surface-2 hover:bg-surface-3 text-[#cbd5e1] border border-border-subdued transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isChanged}
              className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
                isChanged && !isSubmitting
                  ? 'bg-primary-cyan text-[#090e18] hover:bg-primary-hover shadow-md'
                  : 'bg-surface-2 text-[#64748b] border border-border-subdued cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  <span>Save Classification</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

