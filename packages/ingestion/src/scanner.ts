import * as fs from 'node:fs/promises';
import * as fsSync from 'node:fs';
import * as path from 'node:path';
import { createHash } from 'node:crypto';
import { SingaporeSchoolCode, SubjectId, SINGAPORE_SCHOOLS } from '@paperforge/shared';
import { DiscoveredPdf, FileRole } from './types';

const ALL_JCS: SingaporeSchoolCode[] = [
  'RI', 'HCI', 'NYJC', 'VJC', 'ACJC', 'EJC', 'NJC', 'TJC',
  'RVHS', 'DHS', 'ASRJC', 'JPJC', 'TMJC', 'CJC', 'SAJC', 'YIJC',
];

const JC_NAMES_MAP: Record<string, SingaporeSchoolCode> = {
  'RAFFLES': 'RI',
  'HWA CHONG': 'HCI',
  'NANYANG': 'NYJC',
  'VICTORIA': 'VJC',
  'ANGLO-CHINESE': 'ACJC',
  'ANGLO CHINESE': 'ACJC',
  'EUNOIA': 'EJC',
  'NATIONAL': 'NJC',
  'TEMASEK': 'TJC',
  'RIVER VALLEY': 'RVHS',
  'DUNMAN HIGH': 'DHS',
  'ANDERSON SERANGOON': 'ASRJC',
  'JURONG PIONEER': 'JPJC',
  'TAMPINES MERIDIAN': 'TMJC',
  'CATHOLIC': 'CJC',
  'ST ANDREW': 'SAJC',
  'SAJC': 'SAJC',
  'YISHUN INNOVA': 'YIJC',
};

export function detectMetadataFromFilename(filename: string): {
  school: SingaporeSchoolCode;
  year: number;
  subject: SubjectId;
  paperType: 'PROMO' | 'PRELIM' | 'PRACTICE';
  paperNumber: number;
  role: FileRole;
  cleanTitle: string;
} {
  const upper = filename.toUpperCase();

  // 1. Role Detection (Question Paper vs Mark Scheme)
  let role: FileRole = 'QP';
  if (
    upper.includes('SOL') ||
    upper.includes('SOLUTION') ||
    upper.includes('ANS') ||
    upper.includes('MARK') ||
    upper.includes('_MS') ||
    upper.includes('-MS') ||
    upper.includes('.MS')
  ) {
    role = 'MS';
  }

  // 2. School Detection
  let detectedSchool: SingaporeSchoolCode = 'JPJC';
  for (const jc of ALL_JCS) {
    const regex = new RegExp(`(^|[^a-zA-Z0-9])${jc}([^a-zA-Z0-9]|$)`, 'i');
    if (regex.test(filename)) {
      detectedSchool = jc;
      break;
    }
  }
  if (detectedSchool === 'JPJC') {
    for (const [name, code] of Object.entries(JC_NAMES_MAP)) {
      if (upper.includes(name)) {
        detectedSchool = code;
        break;
      }
    }
  }

  // 3. Year Detection
  const yearMatch = filename.match(/(?:^|[^0-9])(20[12]\d)(?:[^0-9]|$)/);
  const year = yearMatch ? parseInt(yearMatch[1], 10) : 2022;

  // 4. Subject Detection
  let subject: SubjectId = 'mathematics';
  if (upper.includes('CHEM') || upper.includes('9729') || upper.includes('9476')) {
    subject = 'chemistry';
  } else if (upper.includes('PHY') || upper.includes('9749')) {
    subject = 'physics';
  } else if (upper.includes('BIO') || upper.includes('9744')) {
    subject = 'biology';
  } else if (upper.includes('MATH') || upper.includes('9758')) {
    subject = 'mathematics';
  }

  // 5. Paper Type Detection
  let paperType: 'PROMO' | 'PRELIM' | 'PRACTICE' = 'PROMO';
  if (upper.includes('PRELIM')) {
    paperType = 'PRELIM';
  } else if (upper.includes('PRACTICE') || upper.includes('PRACTISE')) {
    paperType = 'PRACTICE';
  }

  // 6. Paper Number Detection
  let paperNumber = 1;
  const pMatch = filename.match(/(?:PAPER|P)\s*([1234])/i);
  if (pMatch) {
    paperNumber = parseInt(pMatch[1], 10);
  } else if (filename.includes('Paper 2') || filename.includes('Paper2') || filename.includes('_P2')) {
    paperNumber = 2;
  }

  // 7. Clean Canonical Title
  const schoolLabel = SINGAPORE_SCHOOLS[detectedSchool]?.name || detectedSchool;
  const cleanTitle = `${schoolLabel} ${year} H2 ${subject.charAt(0).toUpperCase() + subject.slice(1)} ${paperType} Paper ${paperNumber}`;

  return {
    school: detectedSchool,
    year,
    subject,
    paperType,
    paperNumber,
    role,
    cleanTitle,
  };
}

export async function scanLocalDirectory(dirPath: string): Promise<DiscoveredPdf[]> {
  const resolved = path.resolve(dirPath);
  if (!fsSync.existsSync(resolved)) {
    throw new Error(`Directory does not exist: "${resolved}"`);
  }

  const results: DiscoveredPdf[] = [];

  async function walk(currentDir: string) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.pdf')) {
        const stat = await fs.stat(fullPath);
        // Fast SHA-256 calculation
        const buffer = await fs.readFile(fullPath);
        const hash = createHash('sha256').update(buffer).digest('hex');

        const meta = detectMetadataFromFilename(entry.name);
        results.push({
          path: fullPath,
          filename: entry.name,
          size: stat.size,
          hash,
          ...meta,
        });
      }
    }
  }

  await walk(resolved);
  return results;
}
