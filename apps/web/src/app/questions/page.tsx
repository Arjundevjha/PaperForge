'use client';

import React, { useState } from 'react';
import { SubjectId } from '@paperforge/shared';
import { getGlobalStore } from '@paperforge/db';
import { AppShell } from '../../components/layout/AppShell';
import { QuestionBankMatrix } from '../../components/questions/QuestionBankMatrix';

export default function QuestionsPage() {
  const [activeSubject, setActiveSubject] = useState<SubjectId>('chemistry');
  const store = getGlobalStore();

  const questions = store.listQuestions();
  const answers = questions
    .map((q) => store.getAnswerByQuestionId(q.id))
    .filter(Boolean) as any[];

  return (
    <AppShell activeSubject={activeSubject} onSubjectChange={setActiveSubject}>
      <QuestionBankMatrix
        questions={questions}
        answers={answers}
        activeSubject={activeSubject}
      />
    </AppShell>
  );
}
