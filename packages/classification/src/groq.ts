/**
 * PaperForge — Groq Cloud LLM Syllabus Classifier
 * High-speed, cloud-based curriculum categorization via Groq Cloud
 */

import { SubjectId, SINGAPORE_A_LEVEL_SYLLABI } from '@paperforge/shared';
import { ClassificationResult, classifyQuestionContent } from './matcher';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'qwen/qwen3.8-27b';

/**
 * Normalizes private use font characters and common LaTeX symbols
 */
function sanitizeForLLM(raw: string): string {
  if (!raw) return '';
  let text = raw;

  const glyphMap: Record<string, string> = {
    '\uf0f2': '∫',
    '\uf0f3': '∫',
    '\uf0f4': '∫',
    '\uf0f5': '∫',
    '\uf0d6': '√',
    '\uf070': 'π',
    '\uf071': 'θ',
    '\uf0a3': '≤',
    '\uf0b3': '≥',
    '\uf0b4': '×',
    '\uf0b1': '±',
    '\uf0a5': '∞',
  };

  for (const [glyph, repl] of Object.entries(glyphMap)) {
    text = text.replaceAll(glyph, repl);
  }

  return text.trim();
}

/**
 * Classifies examination question content using Groq Cloud LLM.
 * Automatically falls back to deterministic rule-based matcher if API key is not present or on network failure.
 */
export async function classifyWithGroq(
  subject: SubjectId,
  textContent: string,
  apiKey?: string
): Promise<ClassificationResult> {
  const effectiveKey = apiKey || process.env.GROQ_API_KEY;
  const syllabus = SINGAPORE_A_LEVEL_SYLLABI[subject];

  if (!syllabus) {
    throw new Error(`Unsupported subject for classification: ${subject}`);
  }

  // Graceful fallback to deterministic matcher if key is missing
  if (!effectiveKey) {
    return classifyQuestionContent(subject, textContent);
  }

  const cleanText = sanitizeForLLM(textContent);
  if (cleanText.length < 15) {
    return classifyQuestionContent(subject, textContent);
  }

  // Build taxonomy specification for the prompt
  const taxonomySpec = syllabus.chapters.map((ch, idx) => {
    const subList = ch.subtopics.map((s) => `     * ${s.name} (id: ${s.id})`).join('\n');
    return `  ${idx + 1}. Chapter: "${ch.name}" (id: ${ch.id})\n   Subtopics:\n${subList}`;
  }).join('\n\n');

  const systemPrompt = `You are an expert Singapore-Cambridge GCE A-Level (${syllabus.subjectName}, version ${syllabus.effectiveVersion}) examiner.
Your task is to accurately classify an examination question into EXACTLY ONE official chapter and its exact subtopic.

OFFICIAL SYLLABUS TAXONOMY:
${taxonomySpec}

CRITICAL MATHEMATICAL CLASSIFICATION RULES:
1. If the question involves integration notation (∫, \\int, dx without dy/dx, substitution u = f(x), integration by parts, partial fractions, definite integrals, area between curves, volume of revolution), it belongs to "Integration Techniques" or "Definite Integrals and Applications" under Calculus. It is NEVER "Differentiation Techniques".
2. If the question asks for dy/dx, second derivatives, equations of tangents, normals, stationary points, or connected rates of change, it belongs to "Differentiation Techniques" or "Applications of Differentiation" under Calculus.
3. If the question gives a differential equation with dy/dx and requires separation of variables, it belongs to "Differential Equations" under Calculus.
4. If the question asks for Maclaurin series expansion, it belongs to "Maclaurin Series".

Respond ONLY with a valid JSON object matching this structure:
{
  "chapterId": "<Exact chapter id, e.g. math-05>",
  "chapterName": "<Exact chapter name, e.g. Calculus>",
  "subtopicId": "<Exact subtopic id, e.g. math-05-04>",
  "subtopicName": "<Exact subtopic name, e.g. Integration Techniques>",
  "confidence": <number between 0.0 and 1.0>,
  "reason": "<one sentence explaining the primary mathematical reason for this classification>"
}`;

  try {
    let res: Response | null = null;
    const maxRetries = 3;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      res = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${effectiveKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || DEFAULT_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: cleanText },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
        }),
      });

      if (res.status === 429 && attempt < maxRetries) {
        const retryAfter = res.headers.get('retry-after');
        const parsedWait = retryAfter ? parseFloat(retryAfter) * 1000 : 0;
        // If the upstream API asks us to wait more than 6 seconds, fall back immediately to avoid stalling
        if (parsedWait > 6000) {
          console.warn(`[Groq Classifier] HTTP 429 reset window is ${Math.round(parsedWait / 1000)}s: falling back to deterministic matcher.`);
          return classifyQuestionContent(subject, textContent);
        }
        const delayMs = parsedWait > 0
          ? Math.max(1000, parsedWait)
          : Math.min(5000, 1500 * Math.pow(2, attempt));
        console.warn(`[Groq Classifier] HTTP 429 (Rate Limit). Retrying in ${Math.round(delayMs)}ms (attempt ${attempt + 1}/${maxRetries})...`);
        await new Promise((r) => setTimeout(r, delayMs));
        continue;
      }
      break;
    }

    if (!res || !res.ok) {
      console.warn(`[Groq Classifier] API error HTTP ${res?.status}: falling back to deterministic matcher.`);
      return classifyQuestionContent(subject, textContent);
    }

    const data = await res.json();
    const rawContent = data.choices?.[0]?.message?.content;
    if (!rawContent) {
      return classifyQuestionContent(subject, textContent);
    }

    const parsed = JSON.parse(rawContent);

    // Validate that the chapter exists in syllabus
    const matchedChapter = syllabus.chapters.find(
      (c) => c.id === parsed.chapterId || c.name.toLowerCase() === (parsed.chapterName || '').toLowerCase()
    );

    if (!matchedChapter) {
      return classifyQuestionContent(subject, textContent);
    }

    // Match subtopic
    const matchedSubtopic = matchedChapter.subtopics.find(
      (s) => s.id === parsed.subtopicId || s.name.toLowerCase() === (parsed.subtopicName || '').toLowerCase()
    );

    const confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0.90;
    const needsReview = confidence < 0.70;

    return {
      subject,
      syllabusVersion: syllabus.effectiveVersion,
      chapter: matchedChapter.name,
      chapterId: matchedChapter.id,
      subtopic: matchedSubtopic?.name || matchedChapter.subtopics[0]?.name,
      subtopicId: matchedSubtopic?.id || matchedChapter.subtopics[0]?.id,
      confidence: parseFloat(confidence.toFixed(2)),
      matchedKeywords: ['groq-llama-qwen-classification'],
      needsReview,
      reason: parsed.reason || 'Classified via Groq Cloud LLM',
    };
  } catch (err) {
    console.warn('[Groq Classifier] Request failed, falling back to deterministic matcher:', err);
    return classifyQuestionContent(subject, textContent);
  }
}
