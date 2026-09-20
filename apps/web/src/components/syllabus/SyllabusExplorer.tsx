'use client';

import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronRight, Hash, Tag, Layers } from 'lucide-react';
import { SubjectId, SINGAPORE_A_LEVEL_SYLLABI, SUBJECT_METADATA } from '@paperforge/shared';

interface SyllabusExplorerProps {
  activeSubject: SubjectId;
}

export const SyllabusExplorer: React.FC<SyllabusExplorerProps> = ({ activeSubject }) => {
  const syllabus = SINGAPORE_A_LEVEL_SYLLABI[activeSubject];
  const meta = SUBJECT_METADATA[activeSubject];
  const [expandedChapterIds, setExpandedChapterIds] = useState<Set<string>>(
    new Set([syllabus.chapters[0]?.id || ''])
  );

  const toggleChapter = (id: string) => {
    setExpandedChapterIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#f1f5f9] tracking-tight">
              Singapore-Cambridge Curriculum Taxonomy
            </h1>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#0b1a24] text-primary-cyan border border-primary-cyan/30">
              {syllabus.effectiveVersion}
            </span>
          </div>
          <p className="text-xs text-[#94a3b8] font-mono mt-1">
            Authoritative Singapore MOE Syllabus Code: {meta.syllabusCode} • {meta.name}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {syllabus.chapters.map((ch) => {
          const isExpanded = expandedChapterIds.has(ch.id);
          return (
            <div
              key={ch.id}
              className="rounded-lg bg-surface-1 border border-border-subdued overflow-hidden"
            >
              <div
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
                onClick={() => toggleChapter(ch.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleChapter(ch.id);
                  }
                }}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-surface-2 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown size={16} className="text-primary-cyan" />
                  ) : (
                    <ChevronRight size={16} className="text-[#94a3b8]" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary-cyan">
                        Chapter {ch.chapterNumber}
                      </span>
                      <span className="text-sm font-semibold text-[#f1f5f9]">
                        {ch.name}
                      </span>
                    </div>
                    <p className="text-xs text-[#94a3b8] mt-0.5">{ch.description}</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-[#94a3b8]">
                  {ch.subtopics.length} Subtopics
                </span>
              </div>

              {isExpanded && (
                <div className="p-4 bg-surface-2/40 border-t border-border-subdued space-y-3">
                  {ch.subtopics.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-3 rounded bg-surface-1/70 border border-border-subdued/80 space-y-1.5"
                    >
                      <div className="text-xs font-semibold text-[#dee2f1]">
                        {sub.name}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {sub.keywords.map((kw) => (
                          <span
                            key={kw}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-2 border border-border-subdued text-[10px] font-mono text-[#cbd5e1]"
                          >
                            <Tag size={10} className="text-primary-cyan" />
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
