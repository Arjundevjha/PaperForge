/**
 * PaperForge — Question Marker & Hierarchy Parser
 * Accurately recognizes Cambridge examination numbering and nested subparts
 */

export interface ParsedQuestionMarker {
  raw: string;
  normalizedNumber: string;
  rootNumber: string;
  subpartLetter?: string;
  romanNumeral?: string;
  subpartIndex?: string;
  depth: number; // 0 for root '7', 1 for '7(a)', 2 for '7(b)(i)', 3 for '7(b)(i)(A)'
  parentNumber?: string;
}

export function parseQuestionMarker(marker: string): ParsedQuestionMarker | null {
  const clean = marker.trim().replace(/^Question\s+/i, '');

  // Pattern 1: Full nested question e.g. "7(b)(ii)" or "7(a)" or "12(c)(i)(A)"
  const fullNestedRegex = /^(\d+)(?:\(([a-z])\))?(?:\(([ivxlcdm]+)\))?(?:\(([A-Z])\))?\.?$/i;
  const matchFull = clean.match(fullNestedRegex);

  if (matchFull) {
    const [, root, letter, roman, subIndex] = matchFull;
    let normalized = root;
    let depth = 0;
    let parent: string | undefined = undefined;

    if (letter) {
      parent = normalized;
      normalized += `(${letter.toLowerCase()})`;
      depth = 1;
    }
    if (roman) {
      parent = normalized;
      normalized += `(${roman.toLowerCase()})`;
      depth = 2;
    }
    if (subIndex) {
      parent = normalized;
      normalized += `(${subIndex.toUpperCase()})`;
      depth = 3;
    }

    return {
      raw: marker,
      normalizedNumber: normalized,
      rootNumber: root,
      subpartLetter: letter?.toLowerCase(),
      romanNumeral: roman?.toLowerCase(),
      subpartIndex: subIndex?.toUpperCase(),
      depth,
      parentNumber: parent,
    };
  }

  // Pattern 2: Standalone subpart e.g. "(a)", "(b)(i)", "(c)(ii)"
  const subpartOnlyRegex = /^\(([a-z])\)(?:\(([ivxlcdm]+)\))?(?:\(([A-Z])\))?\.?$/i;
  const matchSub = clean.match(subpartOnlyRegex);

  if (matchSub) {
    const [, letter, roman, subIndex] = matchSub;
    let normalized = `(${letter.toLowerCase()})`;
    let depth = 1;
    let parent: string | undefined = undefined;

    if (roman) {
      parent = normalized;
      normalized += `(${roman.toLowerCase()})`;
      depth = 2;
    }
    if (subIndex) {
      parent = normalized;
      normalized += `(${subIndex.toUpperCase()})`;
      depth = 3;
    }

    return {
      raw: marker,
      normalizedNumber: normalized,
      rootNumber: '',
      subpartLetter: letter.toLowerCase(),
      romanNumeral: roman?.toLowerCase(),
      subpartIndex: subIndex?.toUpperCase(),
      depth,
      parentNumber: parent,
    };
  }

  // Pattern 3: Simple numeric with trailing dot or bracket: e.g. "1.", "12", "5)"
  const simpleNumRegex = /^(\d+)[.)]?$/;
  const matchNum = clean.match(simpleNumRegex);
  if (matchNum) {
    const root = matchNum[1];
    return {
      raw: marker,
      normalizedNumber: root,
      rootNumber: root,
      depth: 0,
      parentNumber: undefined,
    };
  }

  return null;
}

export function extractMarksFromText(text: string): number | null {
  // Matches e.g. "[Total: 8 marks]" or "[8 marks]" or "[3]" or "[4m]" or "(2 marks)"
  const patterns = [
    /\[Total:\s*(\d+)\s*(?:marks?|m)?\]/i,
    /\[(\d+)\s*(?:marks?|m)\]/i,
    /\[(\d+)\]/,
    /\((\d+)\s*marks?\)/i,
    /\b(\d+)\s*m\b/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const val = parseInt(match[1], 10);
      if (!isNaN(val) && val > 0 && val <= 100) {
        return val;
      }
    }
  }

  return null;
}
