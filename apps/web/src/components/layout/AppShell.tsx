'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileSpreadsheet,
  Layers,
  CheckSquare,
  FileArchive,
  BookOpen,
  Search,
  CheckCircle2,
  ChevronDown,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { SubjectId, SUBJECT_METADATA } from '@paperforge/shared';

interface AppShellProps {
  children: React.ReactNode;
  activeSubject: SubjectId;
  onSubjectChange: (subject: SubjectId) => void;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  activeSubject,
  onSubjectChange,
}) => {
  const pathname = usePathname();
  const [subjectMenuOpen, setSubjectMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Global Keyboard Shortcuts (Ctrl+K / Cmd+K and Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setSearchOpen(false);
        setSubjectMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navItems = [
    { label: 'Teacher Resource Hub', href: '/', icon: FileSpreadsheet },
    { label: 'PaperForge Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Question Bank', href: '/questions', icon: Layers },
    { label: 'Review Queue', href: '/review', icon: CheckSquare, badge: '2' },
    { label: 'Sources & Ingestion', href: '/sources', icon: FileArchive },
    { label: 'Syllabus Explorer', href: '/syllabus', icon: BookOpen },
  ];

  const currentMeta = SUBJECT_METADATA[activeSubject];

  return (
    <div className="flex h-screen w-full bg-chassis text-[#dee2f1] overflow-hidden">
      {/* Persistent Left Sidebar */}
      <aside className="no-print w-60 flex-shrink-0 bg-surface-1 border-r border-border-subdued flex flex-col justify-between z-20">
        <div>
          {/* Brand Header with PaperForge Mark SVG */}
          <div className="h-16 flex items-center px-4 gap-3 border-b border-border-subdued">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="30" height="30" className="flex-shrink-0" aria-hidden="true">
              <rect width="40" height="40" rx="6" fill="#111827"/>
              <path d="M11 9H23L29 15V31H11V9Z" stroke="#00E5FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="#0c131d"/>
              <path d="M23 9V15H29" stroke="#00E5FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 19H24" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M16 23H24" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M16 27H21" stroke="#00E5FF" strokeWidth="1.8" strokeLinecap="round"/>
              <circle cx="28" cy="28" r="3" fill="#00E5FF"/>
            </svg>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-[#f1f5f9] tracking-tight">PaperForge</span>
                <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-[#171c26] text-primary-cyan border border-primary-cyan/30">H2</span>
              </div>
              <p className="text-[10px] text-[#94a3b8] font-mono uppercase tracking-wider">A-Level Foundry</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1" aria-label="Main Navigation">
            <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-[#94a3b8]">
              Core Workflows
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center justify-between px-3 py-2 rounded text-xs transition-all ${
                    isActive
                      ? 'bg-surface-2 text-primary-cyan font-medium border-l-2 border-primary-cyan'
                      : 'text-[#94a3b8] hover:bg-surface-2 hover:text-[#f1f5f9]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={16} className={isActive ? 'text-primary-cyan' : 'text-[#94a3b8]'} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      aria-label={`${item.badge} pending review items`}
                      className="text-[10px] font-mono bg-status-warning/20 text-status-warning border border-status-warning/40 px-1.5 py-0.5 rounded-full"
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Curriculum Badge */}
        <div className="p-3 border-t border-border-subdued bg-[#0c1017]">
          <div className="p-2.5 rounded bg-surface-2 border border-border-subdued/80">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#f1f5f9]">
              <Sparkles size={14} className="text-primary-cyan" />
              <span>Singapore MOE Aligned</span>
            </div>
            <p className="text-[11px] text-[#64748b] mt-1">
              16 JCs • Standardized Cambridge layout & verified solutions
            </p>
          </div>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Sticky Top Header */}
        <header className="no-print h-14 bg-surface-1 border-b border-border-subdued flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4">
            {/* Subject Switcher */}
            <div className="relative">
              <button
                onClick={() => setSubjectMenuOpen(!subjectMenuOpen)}
                aria-haspopup="listbox"
                aria-expanded={subjectMenuOpen}
                aria-label="Select A-Level Subject"
                className="flex items-center gap-2 px-3 py-1.5 rounded bg-surface-2 border border-border-active hover:border-primary-cyan text-xs font-medium text-[#f1f5f9] transition-colors"
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: currentMeta.themeColor }}
                />
                <span>{currentMeta.name}</span>
                <span className="font-mono text-[#94a3b8]">[{currentMeta.syllabusCode}]</span>
                <ChevronDown size={14} className="text-[#94a3b8]" />
              </button>

              {subjectMenuOpen && (
                <div
                  role="listbox"
                  aria-label="A-Level Subjects"
                  className="absolute left-0 mt-1 w-56 bg-surface-2 border border-border-active rounded shadow-xl py-1 z-50"
                >
                  {(Object.keys(SUBJECT_METADATA) as SubjectId[]).map((subjId) => {
                    const meta = SUBJECT_METADATA[subjId];
                    const isSelected = subjId === activeSubject;
                    return (
                      <button
                        key={subjId}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          onSubjectChange(subjId);
                          setSubjectMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-surface-3 transition-colors ${
                          isSelected ? 'text-primary-cyan font-semibold' : 'text-[#dee2f1]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: meta.themeColor }}
                          />
                          <span>{meta.name}</span>
                        </div>
                        <span className="font-mono text-[10px] text-[#94a3b8]">[{meta.syllabusCode}]</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Global Search Bar */}
            <div className="relative">
              <button
                onClick={() => setSearchOpen(true)}
                aria-label="Open global search (Ctrl+K)"
                className="flex items-center gap-2 px-3 py-1.5 rounded bg-surface-2/60 border border-border-subdued hover:border-border-active text-xs text-[#94a3b8] hover:text-[#dee2f1] w-64 text-left transition-colors"
              >
                <Search size={14} />
                <span>Search 16 JCs, topics... (Ctrl+K)</span>
              </button>
            </div>
          </div>

          {/* Right Header Status Indicators */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0b1b1c] border border-primary-cyan/30 text-primary-cyan text-[11px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-cyan animate-pulse" />
              <span>Sync: 18 Sep 2026 • Operational</span>
            </div>

            <div className="flex items-center gap-2 pl-2 border-l border-border-subdued">
              <div className="w-7 h-7 rounded-full bg-surface-2 border border-primary-cyan/40 flex items-center justify-center text-primary-cyan">
                <UserCheck size={14} />
              </div>
              <div className="text-right">
                <div className="text-xs font-medium text-[#f1f5f9]">Dr. Adrian Low</div>
                <div className="text-[10px] text-[#94a3b8]">Senior Tuition Specialist</div>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content Viewport */}
        <main className="flex-1 overflow-y-auto bg-chassis">
          {children}
        </main>
      </div>

      {/* Search Modal */}
      {searchOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Quick Search"
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div className="w-full max-w-xl bg-surface-2 border border-border-active rounded-lg shadow-2xl p-4">
            <div className="flex items-center gap-2 pb-3 border-b border-border-subdued">
              <Search size={18} className="text-primary-cyan" />
              <input
                type="text"
                autoFocus
                aria-label="Search questions, chapters, or Junior Colleges"
                placeholder="Search by keyword, JC (e.g. RI, HCI, NYJC), chapter, or question code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-[#f1f5f9] focus:outline-none"
              />
              <button
                onClick={() => setSearchOpen(false)}
                aria-label="Close search modal"
                className="text-xs px-2 py-1 bg-surface-1 border border-border-subdued rounded text-[#94a3b8] hover:text-white"
              >
                ESC
              </button>
            </div>
            <div className="py-4 text-xs text-[#94a3b8] space-y-2">
              <p className="font-mono text-[10px] uppercase text-[#94a3b8]">Quick Suggestions</p>
              <div className="flex flex-wrap gap-1.5">
                {['[RI 2025 H2 Chemistry]', '2,4-DNPH precipitate', 'Centripetal acceleration', 'Volume of revolution', 'Enzyme kinetics Km'].map(
                  (sug) => (
                    <button
                      key={sug}
                      onClick={() => setSearchQuery(sug)}
                      className="px-2 py-1 rounded bg-surface-1 border border-border-subdued hover:border-primary-cyan text-[#cbd5e1] text-[11px]"
                    >
                      {sug}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
