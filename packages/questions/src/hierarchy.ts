/**
 * PaperForge — Question Hierarchy & Tree Builder
 * Maintains parent-child relationships across nested examination problems
 */

import { ParsedQuestionMarker, parseQuestionMarker } from './parser';

export interface QuestionNode {
  id: string;
  questionNumber: string;
  depth: number;
  parentId?: string;
  children: QuestionNode[];
  marks?: number | null;
  textContent: string;
}

export function buildQuestionHierarchy(
  questions: Array<{ id: string; questionNumber: string; textContent: string; marks?: number | null }>
): QuestionNode[] {
  const nodesMap = new Map<string, QuestionNode>();
  const rootNodes: QuestionNode[] = [];

  // 1. Initialize nodes
  for (const q of questions) {
    const parsed = parseQuestionMarker(q.questionNumber);
    const depth = parsed ? parsed.depth : 0;

    nodesMap.set(q.questionNumber, {
      id: q.id,
      questionNumber: q.questionNumber,
      depth,
      children: [],
      marks: q.marks,
      textContent: q.textContent,
    });
  }

  // 2. Link parents and children
  for (const q of questions) {
    const parsed = parseQuestionMarker(q.questionNumber);
    const node = nodesMap.get(q.questionNumber)!;

    if (parsed && parsed.parentNumber && nodesMap.has(parsed.parentNumber)) {
      const parentNode = nodesMap.get(parsed.parentNumber)!;
      node.parentId = parentNode.id;
      parentNode.children.push(node);
    } else {
      rootNodes.push(node);
    }
  }

  return rootNodes;
}

export function getAncestryChain(questionNumber: string): string[] {
  const parsed = parseQuestionMarker(questionNumber);
  if (!parsed) return [questionNumber];

  const chain: string[] = [];
  let current: ParsedQuestionMarker | null = parsed;

  while (current) {
    chain.unshift(current.normalizedNumber);
    if (current.parentNumber) {
      current = parseQuestionMarker(current.parentNumber);
    } else {
      current = null;
    }
  }

  return chain;
}
