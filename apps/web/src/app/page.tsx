'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SubjectId, Worksheet, Question, Answer } from '@paperforge/shared';
import { AppShell } from '../components/layout/AppShell';
import { TeacherResourceHub } from '../components/hub/TeacherResourceHub';
import { RefreshCw } from 'lucide-react';

export default function HomePage() {
  const [activeSubject, setActiveSubject] = useState<SubjectId>('mathematics');
  const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchHubData = useCallback(async () => {
    try {
      setLoading(true);
      const [wsRes, qRes] = await Promise.all([
        fetch('/api/worksheets').then((r) => r.json()).catch(() => ({ data: [] })),
        fetch('/api/questions').then((r) => r.json()).catch(() => ({ data: [], answers: [] })),
      ]);

      const loadedWorksheets: Worksheet[] = Array.isArray(wsRes.data) ? wsRes.data : [];
      const loadedQuestions: Question[] = Array.isArray(qRes.data) ? qRes.data : [];
      const loadedAnswers: Answer[] = Array.isArray(qRes.answers) ? qRes.answers : [];

      setWorksheets(loadedWorksheets);
      setQuestions(loadedQuestions);
      setAnswers(loadedAnswers);

      // Auto-detect subject that has data
      if (loadedWorksheets.length > 0) {
        setActiveSubject(loadedWorksheets[0].subject);
      } else if (loadedQuestions.length > 0) {
        const hasMath = loadedQuestions.some((q) => q.subject === 'mathematics');
        setActiveSubject(hasMath ? 'mathematics' : loadedQuestions[0].subject);
      }
    } catch {
      // ignore network errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHubData();
  }, [fetchHubData]);

  return (
    <AppShell activeSubject={activeSubject} onSubjectChange={setActiveSubject}>
      {loading && worksheets.length === 0 && questions.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[70vh] gap-3">
          <RefreshCw size={28} className="text-primary-cyan animate-spin" />
          <p className="text-xs font-mono text-[#94a3b8]">
            Loading Singapore Junior College examination resources...
          </p>
        </div>
      ) : (
        <TeacherResourceHub
          activeSubject={activeSubject}
          worksheets={worksheets}
          questions={questions}
          answers={answers}
          onRefresh={fetchHubData}
        />
      )}
    </AppShell>
  );
}
