'use client';

import React, { useState } from 'react';
import { SubjectId } from '@paperforge/shared';
import { AppShell } from '../../components/layout/AppShell';
import { SourcesConsole } from '../../components/sources/SourcesConsole';

export default function SourcesPage() {
  const [activeSubject, setActiveSubject] = useState<SubjectId>('mathematics');

  return (
    <AppShell activeSubject={activeSubject} onSubjectChange={setActiveSubject}>
      <SourcesConsole sources={[]} />
    </AppShell>
  );
}
