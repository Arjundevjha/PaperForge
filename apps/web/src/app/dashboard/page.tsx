'use client';

import React, { useState } from 'react';
import { SubjectId } from '@paperforge/shared';
import { getGlobalStore } from '@paperforge/db';
import { AppShell } from '../../components/layout/AppShell';
import { DashboardOverview } from '../../components/dashboard/DashboardOverview';

export default function DashboardPage() {
  const [activeSubject, setActiveSubject] = useState<SubjectId>('chemistry');
  const store = getGlobalStore();

  const sources = store.listSources();
  const questions = store.listQuestions();
  const worksheets = store.listWorksheets();
  const reviewItems = store.listReviewItems();

  return (
    <AppShell activeSubject={activeSubject} onSubjectChange={setActiveSubject}>
      <DashboardOverview
        sources={sources}
        questions={questions}
        worksheets={worksheets}
        reviewItems={reviewItems}
      />
    </AppShell>
  );
}
