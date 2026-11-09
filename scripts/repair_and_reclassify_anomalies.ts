import * as fs from 'node:fs';
import * as path from 'node:path';

const STORE_PATH = path.resolve(process.cwd(), 'packages', 'db', '.paperforge-store.json');

interface QuestionCorrection {
  id: string;
  chapter: string;
  subtopic: string;
  subtopicId: string;
  newTextContent?: string;
  citation?: string;
}

const CORRECTIONS: QuestionCorrection[] = [
  {
    id: 'jpjc-2021-p1-q06',
    chapter: 'Vectors',
    subtopic: 'Lines and Planes in 3D',
    subtopicId: 'lines_planes',
    newTextContent: `The Cartesian equation of line L1 is (x-2)/a = (y+2)/b = (z-3)/c, where a, b, c are constants. The line L2 is parallel to the vector 4i + 3j. The line L3 passes through the origin and the point with position vector j + k.
(i) Given that L1 is perpendicular to L2, form an equation relating a and b. [1]
(ii) Given that L1 intersects L3, show that 5a + 2b - 2c = 0. [3]
(iii) Hence express a and b in terms of c. [1]
(iv) Find the acute angle between L1 and L2. [2]`,
    citation: '[JPJC 2021 H2 Mathematics PROMO Q6]',
  },
  {
    id: 'acjc-2024-p1-q01',
    chapter: 'Complex Numbers',
    subtopic: 'Cartesian, Polar & Exponential Forms',
    subtopicId: 'cartesian_polar',
    newTextContent: `The complex numbers z and w satisfy the following equations:
iw^2 + 2wz = 2i
z* + iz = 2 + iw
Find z and w, giving your answers in the form a + ib, where a, b in R. [5]`,
    citation: '[ACJC 2024 H2 Mathematics PRELIM P1 Q1]',
  },
  {
    id: 'rvhs-2025-p2-q10',
    chapter: 'Probability and Statistics',
    subtopic: 'Correlation & Linear Regression',
    subtopicId: 'correlation_regression',
    newTextContent: `As part of the sound calibration for the National Day Parade at the Padang, sound engineers test how sound intensity y (in decibels) decreases with distance x (in metres) from the stage.
(i) Draw a scatter diagram of the data. [1]
(ii) Calculate the product moment correlation coefficient between ln y and x. [1]
(iii) Find the equation of the regression line of ln y on x. [2]`,
    citation: '[RVHS 2025 H2 Mathematics PRELIM P2 Q10]',
  },
  {
    id: 'asrjc-2023-p2-q03',
    chapter: 'Complex Numbers',
    subtopic: 'Roots of Polynomials & De Moivre\'s Theorem',
    subtopicId: 'polynomial_roots',
    newTextContent: `One of the roots of the equation z^4 - 4z^3 + az^2 + bz + 78 = 0, where a and b are real, is 3 + 2i.
(i) Find the values of a and b. [4]
(ii) Find the other roots of the equation. [2]`,
    citation: '[ASRJC 2023 H2 Mathematics PRELIM P2 Q3]',
  },
  {
    id: 'acjc-2024-p1-q04',
    chapter: 'Calculus',
    subtopic: 'Maclaurin Series & Expansions',
    subtopicId: 'maclaurin',
    newTextContent: `Using standard series from the list of formulae (MF26), show that for small x:
ln(1 + sin 2x) = 2x - 2x^2 + 8/3 x^3 + ...
Hence find the series expansion of (1 + sin 2x)^(-1/2) up to and including the term in x^2. [6]`,
    citation: '[ACJC 2024 H2 Mathematics PRELIM P1 Q4]',
  },
  {
    id: 'hci-2023-p1-q09',
    chapter: 'Sequences and Series',
    subtopic: 'Arithmetic and Geometric Progressions (AP/GP)',
    subtopicId: 'ap_gp',
    newTextContent: `A piece of paper in the form of a semi-circle of radius r is cut into sectors whose areas form an arithmetic progression.
(a) Given that the area of the first sector is a and the common difference is d, find the sum to infinity...
(b) Find the number of sectors such that the entire semi-circle is covered. [6]`,
    citation: '[HCI 2023 H2 Mathematics PRELIM P1 Q9]',
  },
  {
    id: 'hci-2023-p1-q10',
    chapter: 'Sequences and Series',
    subtopic: 'Arithmetic and Geometric Progressions (AP/GP)',
    subtopicId: 'ap_gp',
    newTextContent: `A geometric progression u_1, u_2, u_3, ... has first term 2 and common ratio r.
(i) Find the range of values of r for which the sum to infinity exists. [2]
(ii) Given that the sum of the first n terms exceeds 99% of the sum to infinity, find the least value of n. [4]`,
    citation: '[HCI 2023 H2 Mathematics PRELIM P1 Q10]',
  },
  {
    id: 'hci-2023-p1-q11',
    chapter: 'Sequences and Series',
    subtopic: 'Arithmetic and Geometric Progressions (AP/GP)',
    subtopicId: 'ap_gp',
    newTextContent: `Alan manufactures and sells 3D printers while Bob is a smartphone App developer.
Alan's sales in month n follow an arithmetic progression with first term $10,000 and common difference $500.
Bob's revenue follows a geometric progression with first term $4,000 and common ratio 1.15.
(i) Find the month in which Bob's monthly revenue first exceeds Alan's. [4]
(ii) Find the total earnings of each person after 3 years. [4]`,
    citation: '[HCI 2023 H2 Mathematics PRELIM P1 Q11]',
  },
  {
    id: 'jpjc-2021-p1-q10',
    chapter: 'Vectors',
    subtopic: 'Lines and Planes in 3D',
    subtopicId: 'lines_planes',
    newTextContent: `Referred to the origin O, the points A, B and C have position vectors 4i - 2j, ai - j + 2k and -i - 7j + k respectively.
(i) Find a vector perpendicular to both OB and OC. [2]
(ii) Find the Cartesian equation of the plane OBC. [2]
(iii) Find the coordinates of the foot of the perpendicular from A to the plane OBC. [4]`,
    citation: '[JPJC 2021 H2 Mathematics PROMO Q10]',
  },
  {
    id: 'jpjc-2021-p1-q05',
    chapter: 'Vectors',
    subtopic: 'Vectors in 2D & 3D',
    subtopicId: 'vectors_2d_3d',
    newTextContent: `Referred to the origin O, points A and B have position vectors a and b respectively.
The modulus of a is 2 and b is a unit vector. The angle between a and b is 60 degrees.
(i) Express OC in terms of a and b where C divides AB in the ratio 1:2. [2]
(ii) Find the exact length of projection of a onto b. [2]`,
    citation: '[JPJC 2021 H2 Mathematics PROMO Q5]',
  },
  {
    id: 'sajc-2022-p2-q08',
    chapter: 'Probability and Statistics',
    subtopic: 'Correlation & Linear Regression',
    subtopicId: 'correlation_regression',
    newTextContent: `The table shows the number y (in millions) of cell-phone subscribers in a country from 2001 to 2010.
(i) Calculate the product moment correlation coefficient between x and y. [1]
(ii) Find the equation of the least squares regression line of y on x. [2]
(iii) Estimate the number of subscribers in 2015, commenting on the reliability of your estimate. [2]`,
    citation: '[SAJC 2022 H2 Mathematics PRELIM P2 Q8]',
  },
  {
    id: 'acjc-2024-p1-q06',
    chapter: 'Complex Numbers',
    subtopic: 'Roots of Polynomials & De Moivre\'s Theorem',
    subtopicId: 'polynomial_roots',
    newTextContent: `Do not use a calculator in answering this question.
One of the roots of the equation 2z^3 + pz^2 + qz - 10 = 0 is 1 + 2i, where p and q are real numbers.
(i) State the other complex root. [1]
(ii) Find the values of p and q and the real root of the equation. [4]`,
    citation: '[ACJC 2024 H2 Mathematics PRELIM P1 Q6]',
  },
];

function main() {
  console.log('================================================================');
  console.log('  PAPERFORGE — REPAIR & RECLASSIFY ANOMALIES');
  console.log('================================================================\n');

  const raw = fs.readFileSync(STORE_PATH, 'utf-8');
  const store = JSON.parse(raw);

  const qMap = new Map<string, any>(store.questions.map((q: any) => [q.id, q]));
  let updatedCount = 0;

  for (const corr of CORRECTIONS) {
    const q = qMap.get(corr.id);
    if (!q) {
      console.warn(`[!] Question ${corr.id} not found in store!`);
      continue;
    }

    const oldChap = q.chapter;
    const oldSub = q.subtopic;
    q.chapter = corr.chapter;
    q.subtopic = corr.subtopic;
    q.subtopicId = corr.subtopicId;

    if (corr.newTextContent) {
      q.textContent = corr.newTextContent;
    }
    if (corr.citation) {
      if (!q.provenance) q.provenance = {};
      q.provenance.citation = corr.citation;
    }

    console.log(`[✓] Fixed ${corr.id}:`);
    console.log(`    Before: ${oldChap} • ${oldSub}`);
    console.log(`    After:  ${q.chapter} • ${q.subtopic} (${q.subtopicId})`);
    updatedCount++;
  }

  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
  console.log(`\n[✓] Successfully updated ${updatedCount} questions in ${STORE_PATH}.`);
}

main();
