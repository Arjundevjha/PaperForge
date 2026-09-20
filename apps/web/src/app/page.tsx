'use client';

import React, { useState } from 'react';
import { SubjectId } from '@paperforge/shared';
import { getGlobalStore } from '@paperforge/db';
import { AppShell } from '../components/layout/AppShell';
import { TeacherResourceHub } from '../components/hub/TeacherResourceHub';

export default function HomePage() {
  const [activeSubject, setActiveSubject] = useState<SubjectId>('chemistry');
  const store = getGlobalStore();

  const worksheets = store.listWorksheets(activeSubject);
  const questions = store.listQuestions({ subject: activeSubject });
  const answers = questions
    .map((q) => store.getAnswerByQuestionId(q.id))
    .filter(Boolean) as any[];

  return (
    <AppShell activeSubject={activeSubject} onSubjectChange={setActiveSubject}>
      <TeacherResourceHub
        activeSubject={activeSubject}
        worksheets={worksheets}
        questions={questions}
        answers={answers}
      />
    </AppShell>
  );
}
