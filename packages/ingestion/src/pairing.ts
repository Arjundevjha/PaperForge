import { DiscoveredPdf, PairedPaperSet, ScanManifest } from './types';

function normalizeBaseName(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/\.pdf$/, '')
    .replace(/[_\-\s]+(solutions?|sols?|answers?|ans|worked|ms|marking[\s_]scheme)/gi, '')
    .replace(/[_\-\s]+/g, ' ')
    .trim();
}

export function pairDiscoveredPdfs(
  discovered: DiscoveredPdf[],
  sourceLocation: string,
  sourceType: 'local' | 'bucket' = 'local'
): ScanManifest {
  const qps: DiscoveredPdf[] = [];
  const mss: DiscoveredPdf[] = [];
  const seenHashes = new Set<string>();
  const duplicates: DiscoveredPdf[] = [];

  for (const item of discovered) {
    if (seenHashes.has(item.hash)) {
      duplicates.push(item);
      continue;
    }
    seenHashes.add(item.hash);

    if (item.role === 'MS') {
      mss.push(item);
    } else {
      qps.push(item);
    }
  }

  const pairedSets: PairedPaperSet[] = [];
  const matchedMsHashes = new Set<string>();

  for (const qp of qps) {
    const qpBase = normalizeBaseName(qp.filename);
    const signature = `${qp.school.toLowerCase()}-${qp.year}-${qp.subject}-${qp.paperType.toLowerCase()}-p${qp.paperNumber}`;

    // 1. Try matching by identical signature and normalized base
    let matchedMs = mss.find(
      (ms) =>
        !matchedMsHashes.has(ms.hash) &&
        (normalizeBaseName(ms.filename) === qpBase ||
          (ms.school === qp.school &&
            ms.year === qp.year &&
            ms.subject === qp.subject &&
            ms.paperNumber === qp.paperNumber))
    );

    if (!matchedMs) {
      // 2. Try substring match (e.g. "Paper 3" in both)
      matchedMs = mss.find((ms) => {
        if (matchedMsHashes.has(ms.hash)) return false;
        const msBase = normalizeBaseName(ms.filename);
        return msBase.includes(qpBase) || qpBase.includes(msBase);
      });
    }

    if (matchedMs) {
      matchedMsHashes.add(matchedMs.hash);
    }

    pairedSets.push({
      id: signature,
      title: qp.cleanTitle,
      school: qp.school,
      year: qp.year,
      subject: qp.subject,
      paperType: qp.paperType,
      paperNumber: qp.paperNumber,
      questionPaper: qp,
      markScheme: matchedMs || null,
      isComplete: Boolean(matchedMs),
    });
  }

  // Identify orphaned Mark Schemes (MS files without a QP)
  const orphanedMss = mss.filter((ms) => !matchedMsHashes.has(ms.hash));

  return {
    sourceType,
    sourceLocation,
    totalDiscovered: discovered.length,
    pairedCount: pairedSets.filter((s) => s.isComplete).length,
    unpairedQpCount: pairedSets.filter((s) => !s.isComplete).length,
    orphanedMsCount: orphanedMss.length,
    duplicateCount: duplicates.length,
    sets: pairedSets,
    duplicates,
    unpaired: orphanedMss,
    scannedAt: new Date().toISOString(),
  };
}
