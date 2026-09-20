'use client';

import React, { useState } from 'react';
import { SubjectId } from '@paperforge/shared';
import { AppShell } from '../../components/layout/AppShell';
import { SyllabusExplorer } from '../../components/syllabus/SyllabusExplorer';

export default function SyllabusPage() {
  const [activeSubject, setActiveSubject] = useState<SubjectId>('chemistry');

  return (
    <AppShell activeSubject={activeSubject} onSubjectChange={setActiveSubject}>
      <SyllabusExplorer activeSubject={activeSubject} />
    </AppShell>
  );
}
