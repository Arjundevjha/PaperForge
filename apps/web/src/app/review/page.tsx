'use client';

import React, { useState } from 'react';
import { SubjectId } from '@paperforge/shared';
import { getGlobalStore } from '@paperforge/db';
import { AppShell } from '../../components/layout/AppShell';
import { ReviewQueue } from '../../components/review/ReviewQueue';

export default function ReviewPage() {
  const [activeSubject, setActiveSubject] = useState<SubjectId>('chemistry');
  const store = getGlobalStore();
  const reviewItems = store.listReviewItems();

  return (
    <AppShell activeSubject={activeSubject} onSubjectChange={setActiveSubject}>
      <ReviewQueue initialItems={reviewItems} />
    </AppShell>
  );
}
