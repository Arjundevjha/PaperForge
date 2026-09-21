'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SubjectId, Question, Answer } from '@paperforge/shared';
import { AppShell } from '../../components/layout/AppShell';
import { QuestionBankMatrix } from '../../components/questions/QuestionBankMatrix';
import { RefreshCw } from 'lucide-react';

export default function QuestionsPage() {
  const [activeSubject, setActiveSubject] = useState<SubjectId>('mathematics');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/questions');
      const data = await res.json();
      if (data.success) {
        const loadedQuestions: Question[] = Array.isArray(data.data) ? data.data : [];
        const loadedAnswers: Answer[] = Array.isArray(data.answers) ? data.answers : [];
        setQuestions(loadedQuestions);
        setAnswers(loadedAnswers);

        // Auto-select subject that has data
        if (loadedQuestions.length > 0) {
          const hasMath = loadedQuestions.some((q) => q.subject === 'mathematics');
          if (hasMath) {
            setActiveSubject('mathematics');
          } else {
            setActiveSubject(loadedQuestions[0].subject);
          }
        }
      }
    } catch {
      // ignore network errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  return (
    <AppShell activeSubject={activeSubject} onSubjectChange={setActiveSubject}>
      {loading && questions.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[70vh] gap-3">
          <RefreshCw size={28} className="text-primary-cyan animate-spin" />
          <p className="text-xs font-mono text-[#94a3b8]">
            Loading Singapore Junior College examination questions...
          </p>
        </div>
      ) : (
        <QuestionBankMatrix
          questions={questions}
          answers={answers}
          activeSubject={activeSubject}
        />
      )}
    </AppShell>
  );
}
