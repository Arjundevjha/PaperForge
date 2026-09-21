'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SubjectId, ReviewItem } from '@paperforge/shared';
import { AppShell } from '../../components/layout/AppShell';
import { ReviewQueue } from '../../components/review/ReviewQueue';
import { RefreshCw } from 'lucide-react';

export default function ReviewPage() {
  const [activeSubject, setActiveSubject] = useState<SubjectId>('mathematics');
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchReviewItems = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/review');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setReviewItems(data.data);
      }
    } catch {
      // ignore network errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviewItems();
  }, [fetchReviewItems]);

  return (
    <AppShell activeSubject={activeSubject} onSubjectChange={setActiveSubject}>
      {loading && reviewItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[70vh] gap-3">
          <RefreshCw size={28} className="text-primary-cyan animate-spin" />
          <p className="text-xs font-mono text-[#94a3b8]">
            Loading human-in-the-loop review queue...
          </p>
        </div>
      ) : (
        <ReviewQueue initialItems={reviewItems} onRefresh={fetchReviewItems} />
      )}
    </AppShell>
  );
}
