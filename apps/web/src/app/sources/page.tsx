'use client';

import React, { useState } from 'react';
import { SubjectId } from '@paperforge/shared';
import { getGlobalStore } from '@paperforge/db';
import { AppShell } from '../../components/layout/AppShell';
import { SourcesConsole } from '../../components/sources/SourcesConsole';

export default function SourcesPage() {
  const [activeSubject, setActiveSubject] = useState<SubjectId>('chemistry');
  const store = getGlobalStore();
  const sources = store.listSources();

  return (
    <AppShell activeSubject={activeSubject} onSubjectChange={setActiveSubject}>
      <SourcesConsole sources={sources} />
    </AppShell>
  );
}
