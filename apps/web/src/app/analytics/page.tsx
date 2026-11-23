'use client';

import React, { useState } from 'react';
import { SubjectId } from '@paperforge/shared';
import { AppShell } from '../../components/layout/AppShell';
import { SyllabusCoverage } from '../../components/analytics/SyllabusCoverage';

export default function AnalyticsPage() {
  const [activeSubject, setActiveSubject] = useState<SubjectId>('mathematics');

  return (
    <AppShell activeSubject={activeSubject} onSubjectChange={setActiveSubject}>
      <SyllabusCoverage activeSubject={activeSubject} />
    </AppShell>
  );
}
