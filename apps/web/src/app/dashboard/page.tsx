'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  SubjectId,
  SourceDocument,
  Question,
  Worksheet,
  ReviewItem,
} from '@paperforge/shared';
import { AppShell } from '../../components/layout/AppShell';
import { DashboardOverview } from '../../components/dashboard/DashboardOverview';
import { RefreshCw } from 'lucide-react';

export default function DashboardPage() {
  const [activeSubject, setActiveSubject] = useState<SubjectId>('mathematics');
  const [sources, setSources] = useState<SourceDocument[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [srcRes, qRes, wsRes, revRes] = await Promise.all([
        fetch('/api/sources').then((r) => r.json()).catch(() => ({ data: [] })),
        fetch('/api/questions').then((r) => r.json()).catch(() => ({ data: [] })),
        fetch('/api/worksheets').then((r) => r.json()).catch(() => ({ data: [] })),
        fetch('/api/review').then((r) => r.json()).catch(() => ({ data: [] })),
      ]);

      const loadedSources: SourceDocument[] = Array.isArray(srcRes.data) ? srcRes.data : [];
      const loadedQuestions: Question[] = Array.isArray(qRes.data) ? qRes.data : [];
      const loadedWorksheets: Worksheet[] = Array.isArray(wsRes.data) ? wsRes.data : [];
      const loadedReviews: ReviewItem[] = Array.isArray(revRes.data) ? revRes.data : [];

      setSources(loadedSources);
      setQuestions(loadedQuestions);
      setWorksheets(loadedWorksheets);
      setReviewItems(loadedReviews);

      // Auto-detect subject if current active subject has no data but another does
      if (loadedQuestions.length > 0) {
        const mathCount = loadedQuestions.filter((q) => q.subject === 'mathematics').length;
        if (mathCount > 0) {
          setActiveSubject('mathematics');
        } else {
          setActiveSubject(loadedQuestions[0].subject);
        }
      }
    } catch {
      // ignore network errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <AppShell activeSubject={activeSubject} onSubjectChange={setActiveSubject}>
      {loading && sources.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[70vh] gap-3">
          <RefreshCw size={28} className="text-primary-cyan animate-spin" />
          <p className="text-xs font-mono text-[#94a3b8]">
            Loading Singapore Junior College examination telemetry...
          </p>
        </div>
      ) : (
        <DashboardOverview
          sources={sources}
          questions={questions}
          worksheets={worksheets}
          reviewItems={reviewItems}
        />
      )}
    </AppShell>
  );
}
