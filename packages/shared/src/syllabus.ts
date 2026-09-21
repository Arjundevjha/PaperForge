/**
 * PaperForge — Singapore-Cambridge GCE A-Level Curriculum Taxonomy
 * Authoritative SEAB (Singapore Examinations and Assessment Board) Official Syllabi
 * Directly reflects official SEAB GCE A-Level Syllabus Documents:
 * - H2 Mathematics (Syllabus 9758)
 * - H2 Chemistry (Syllabus 9729 / 9476)
 * - H2 Physics (Syllabus 9749)
 * - H2 Biology (Syllabus 9744)
 */

import { SubjectId } from './types';

export interface SyllabusSubtopic {
  id: string;
  name: string;
  slug: string;
  keywords: string[];
}

export interface SyllabusChapter {
  id: string;
  name: string;
  slug: string;
  chapterNumber: number;
  description: string;
  subtopics: SyllabusSubtopic[];
}

export interface SyllabusDefinition {
  subjectId: SubjectId;
  subjectName: string;
  syllabusCode: string;
  effectiveVersion: string;
  effectiveYear: number;
  chapters: SyllabusChapter[];
}

export const SINGAPORE_A_LEVEL_SYLLABI: Record<SubjectId, SyllabusDefinition> = {
  mathematics: {
    subjectId: 'mathematics',
    subjectName: 'H2 Mathematics',
    syllabusCode: '9758',
    effectiveVersion: 'SEAB-9758-Official',
    effectiveYear: 2026,
    chapters: [
      {
        id: 'math-01',
        chapterNumber: 1,
        name: 'Functions and Graphs',
        slug: 'functions-and-graphs',
        description: 'SEAB 9758 Section 1: Concepts of functions (domain, range, 1-1, composite, inverse), graph techniques and transformations, and equations and inequalities.',
        subtopics: [
          {
            id: 'math-01-01',
            name: 'Functions',
            slug: 'functions',
            keywords: ['domain', 'range', 'composite function', 'inverse function', 'inverse', 'has an inverse', 'f has an inverse', 'one-one', 'bijective', 'codomain', 'f(x)', 'g(x)', 'fg', 'gf', 'f^{-1}', 'f^-1', 'cuts the graph at most once', 'horizontal line test'],
          },
          {
            id: 'math-01-02',
            name: 'Graphs and Transformations',
            slug: 'graphs-transformations',
            keywords: ['asymptote', 'asymptotes', 'transformation', 'transformations', 'axial intercept', 'axial intercepts', 'turning point', 'sketch the graph', 'sketch c', 'hyperbola', 'parabola', 'ellipse', 'conic', 'parametric equations', 'parameter t', 'scale by a factor', 'translate by'],
          },
          {
            id: 'math-01-03',
            name: 'Equations and Inequalities',
            slug: 'equations-inequalities',
            keywords: ['inequality', 'inequalities', 'solve the inequality', 'polynomial', 'remainder theorem', 'factor theorem', 'quadratic', 'cubic', 'discriminant', 'real roots', 'no real roots', 'system of linear equations', 'divided by'],
          },
        ],
      },
      {
        id: 'math-02',
        chapterNumber: 2,
        name: 'Sequences and Series',
        slug: 'sequences-and-series',
        description: 'SEAB 9758 Section 2: Arithmetic progressions, geometric progressions, summation of series, convergence, sum to infinity, and binomial expansions.',
        subtopics: [
          {
            id: 'math-02-01',
            name: 'Sequences and Series',
            slug: 'sequences-series',
            keywords: ['summation', 'sigma', 'method of differences', 'recurrence relation', 'general term', 'sequence', 'series of numbers'],
          },
          {
            id: 'math-02-02',
            name: 'Arithmetic and Geometric Progressions',
            slug: 'ap-gp',
            keywords: ['arithmetic progression', 'geometric progression', 'arithmetic series', 'geometric series', 'common ratio', 'common difference', 'sum to infinity', 'convergent', 'divergent', 'first term a', 'terms of the geometric series', 'terms of the arithmetic series', 'geometric sequence', 'arithmetic sequence', 'apgp', 'ap/gp'],
          },
          {
            id: 'math-02-03',
            name: 'Binomial Series',
            slug: 'binomial-series',
            keywords: ['binomial expansion', 'binomial series', 'ascending powers of x', 'validity condition', 'expansion in powers of x'],
          },
        ],
      },
      {
        id: 'math-03',
        chapterNumber: 3,
        name: 'Vectors',
        slug: 'vectors',
        description: 'SEAB 9758 Section 3: Vectors in 2D and 3D, scalar and vector products, equations of lines and planes, intersections, distances, and projections.',
        subtopics: [
          {
            id: 'math-03-01',
            name: 'Vectors in 2D and 3D',
            slug: 'vectors-2d-3d',
            keywords: ['position vector', 'position vectors', 'origin o', 'unit vector', 'ratio theorem', 'midpoint', 'magnitude', 'parallel vectors', 'collinear', 'points a and b have position vectors'],
          },
          {
            id: 'math-03-02',
            name: 'Dot / Scalar Product',
            slug: 'scalar-product',
            keywords: ['scalar product', 'dot product', 'perpendicular vectors', 'angle between vectors', 'acute angle', 'length of projection', 'projection of ab onto', 'foot of perpendicular'],
          },
          {
            id: 'math-03-03',
            name: 'Vector / Cross Product',
            slug: 'vector-product',
            keywords: ['cross product', 'vector product', 'area of triangle', 'area of parallelogram', 'normal vector to the plane'],
          },
          {
            id: 'math-03-04',
            name: 'Lines and Planes in 3D',
            slug: 'lines-planes-3d',
            keywords: ['line of intersection', 'lines meet at', 'plane', 'planes', 'p1 and p2', 'planes have equations', 'plane has equation', 'flight path of drone', 'cliff face', 'skew lines', 'cartesian equation of plane', 'vector equation of line', 'foot of perpendicular from'],
          },
        ],
      },
      {
        id: 'math-04',
        chapterNumber: 4,
        name: 'Complex Numbers',
        slug: 'complex-numbers',
        description: 'SEAB 9758 Section 4: Complex numbers in Cartesian form, arithmetic operations, conjugate roots, and Argand diagrams.',
        subtopics: [
          {
            id: 'math-04-01',
            name: 'Cartesian Form & Operations',
            slug: 'cartesian-form',
            keywords: ['complex number', 'real part', 'imaginary part', 'cartesian form', 'complex conjugate', 'z*', 'i^2 = -1', 'x + iy'],
          },
          {
            id: 'math-04-02',
            name: 'Roots of Polynomials',
            slug: 'polynomial-roots',
            keywords: ['conjugate root theorem', 'conjugate root', 'non-real roots', 'complex roots', 'complex root', 'cubic equation', 'quartic equation', 'cubic equation with complex root', 'quartic equation with complex root', 'real coefficients'],
          },
          {
            id: 'math-04-03',
            name: 'Argand Diagrams & Loci',
            slug: 'argand-diagrams',
            keywords: ['argand diagram', 'modulus', 'argument', 'arg z', '|z|', 'locus', 'loci in the complex plane', 'circle locus', 'perpendicular bisector locus'],
          },
        ],
      },
      {
        id: 'math-05',
        chapterNumber: 5,
        name: 'Calculus',
        slug: 'calculus',
        description: 'SEAB 9758 Section 5: Differentiation techniques, applications of differentiation, Maclaurin series, integration techniques, definite integrals, and differential equations.',
        subtopics: [
          {
            id: 'math-05-01',
            name: 'Differentiation Techniques',
            slug: 'differentiation-techniques',
            keywords: ['differentiate the following with respect to x', 'differentiate', 'differentiation', 'derivative', 'dy/dx', 'd/dx', 'product rule', 'quotient rule', 'chain rule', 'implicit differentiation', 'parametric differentiation', 'find dy/dx'],
          },
          {
            id: 'math-05-02',
            name: 'Applications of Differentiation',
            slug: 'applications-differentiation',
            keywords: ['tangent', 'normal to the curve', 'tangent is parallel to', 'stationary point', 'stationary points', 'maximum turning point', 'minimum turning point', 'rate of change', 'rates of change', 'water is pumped into the tank at a rate', 'tent model', 'area of rectangle', 'inscribed in', 'optimization', 'strictly increasing', "f'(x)", 'f’(x)', 'maximum value of a', 'proving it is a maximum'],
          },
          {
            id: 'math-05-03',
            name: 'Maclaurin Series',
            slug: 'maclaurin-series',
            keywords: ['maclaurin series', 'maclaurin expansion', 'series expansion of f(x)', 'standard series', 'mf27'],
          },
          {
            id: 'math-05-04',
            name: 'Integration Techniques',
            slug: 'integration-techniques',
            keywords: ['integrate', 'integration', 'integral', 'by using the substitution', 'substitution', 'integration by parts', 'partial fractions', 'standard integral', 'find the exact value of integral', 'dx', '\uf0f2', '\uf0f3'],
          },
          {
            id: 'math-05-05',
            name: 'Definite Integrals and Applications',
            slug: 'definite-integrals-applications',
            keywords: ['definite integral', 'area bounded by', 'area of the region', 'volume of revolution', 'rotated through 4 right angles', 'rotated about the x-axis', 'rotated about the y-axis', 'exact area'],
          },
          {
            id: 'math-05-06',
            name: 'Differential Equations',
            slug: 'differential-equations',
            keywords: ['differential equation', 'separation of variables', 'general solution of the differential equation', 'particular solution', 'rate of growth', 'cooling law'],
          },
        ],
      },
      {
        id: 'math-06',
        chapterNumber: 6,
        name: 'Probability and Statistics',
        slug: 'probability-and-statistics',
        description: 'SEAB 9758 Section 6: Probability concepts, discrete random variables, normal distribution, sampling, hypothesis testing, and correlation & linear regression.',
        subtopics: [
          {
            id: 'math-06-01',
            name: 'Probability',
            slug: 'probability',
            keywords: ['probability', 'conditional probability', 'independent events', 'mutually exclusive', 'bayes theorem', 'tree diagram', 'venn diagram', 'p(a|b)'],
          },
          {
            id: 'math-06-02',
            name: 'Discrete Random Variables',
            slug: 'discrete-random-variables',
            keywords: ['discrete random variable', 'probability mass function', 'expectation', 'e(x)', 'variance', 'var(x)', 'binomial distribution', 'b(n, p)', 'poisson'],
          },
          {
            id: 'math-06-03',
            name: 'Normal Distribution',
            slug: 'normal-distribution',
            keywords: ['normal distribution', 'standard normal', 'n(mu, sigma^2)', 'bell-shaped', 'z-score', 'standard deviation', 'normally distributed'],
          },
          {
            id: 'math-06-04',
            name: 'Sampling and Central Limit Theorem',
            slug: 'sampling-clt',
            keywords: ['central limit theorem', 'clt', 'sample mean', 'sampling distribution', 'unbiased estimate of the population mean', 'large sample'],
          },
          {
            id: 'math-06-05',
            name: 'Hypothesis Testing',
            slug: 'hypothesis-testing',
            keywords: ['hypothesis testing', 'null hypothesis', 'alternative hypothesis', 'h0', 'h1', 'significance level', 'p-value', 'critical value', 'rejection region', 'z-test', '5% level of significance'],
          },
          {
            id: 'math-06-06',
            name: 'Correlation and Linear Regression',
            slug: 'correlation-regression',
            keywords: ['correlation', 'linear regression', 'regression line', 'scatter diagram', 'scatter plot', 'product moment correlation coefficient', 'least squares regression line', 'r value'],
          },
        ],
      },
    ],
  },
  chemistry: {
    subjectId: 'chemistry',
    subjectName: 'H2 Chemistry',
    syllabusCode: '9476',
    effectiveVersion: 'SEAB-9476-Official',
    effectiveYear: 2026,
    chapters: [
      {
        id: 'chem-01',
        chapterNumber: 1,
        name: 'Atomic Structure & Chemical Bonding',
        slug: 'atomic-structure-bonding',
        description: 'SEAB Core Idea 1 & 2: Electronic configurations, shapes of molecules (VSEPR), electronegativity, intermolecular forces and hybridisation.',
        subtopics: [
          { id: 'chem-01-01', name: 'Electronic Configuration & Orbitals', slug: 'orbitals', keywords: ['orbital', 's-orbital', 'p-orbital', 'electronic configuration', 'ionisation energy'] },
          { id: 'chem-01-02', name: 'Shapes of Molecules & Bond Angles', slug: 'vsepr-shapes', keywords: ['vsepr', 'tetrahedral', 'trigonal planar', 'bond angle', 'lone pair'] },
          { id: 'chem-01-03', name: 'Intermolecular Forces & Hydrogen Bonding', slug: 'imf', keywords: ['hydrogen bond', 'van der waals', 'dipole-dipole', 'boiling point'] },
        ],
      },
      {
        id: 'chem-02',
        chapterNumber: 2,
        name: 'The Gaseous State & Mole Concept',
        slug: 'gaseous-state-mole-concept',
        description: 'SEAB Topic 3: Ideal gas equation, deviations from ideality, stoichiometry, volumetric analysis, and redox titrations.',
        subtopics: [
          { id: 'chem-02-01', name: 'Redox Titrations & Stoichiometry', slug: 'redox-titration', keywords: ['titration', 'permanganate', 'manganate', 'thiosulfate', 'iodometry'] },
          { id: 'chem-02-02', name: 'Ideal Gas Equation & Real Gases', slug: 'gas-laws', keywords: ['pv=nrt', 'gas syringe', 'molar gas volume', 'deviation from ideality'] },
        ],
      },
      {
        id: 'chem-03',
        chapterNumber: 3,
        name: 'Chemical Energetics & Thermodynamics',
        slug: 'chemical-energetics',
        description: 'SEAB Topic 6: Hess Law cycles, Born-Haber cycles, lattice energy, entropy change, and Gibbs free energy.',
        subtopics: [
          { id: 'chem-03-01', name: 'Born-Haber Cycle & Lattice Energy', slug: 'born-haber', keywords: ['born-haber', 'lattice energy', 'electron affinity', 'enthalpy of atomisation'] },
          { id: 'chem-03-02', name: 'Entropy & Gibbs Free Energy', slug: 'entropy-gibbs', keywords: ['entropy', 'gibbs', 'spontaneous', 'delta g', 'feasibility'] },
        ],
      },
      {
        id: 'chem-04',
        chapterNumber: 4,
        name: 'Reaction Kinetics',
        slug: 'reaction-kinetics',
        description: 'SEAB Topic 7: Rate equations, orders of reaction, half-life, reaction mechanisms, catalysis, and Arrhenius activation energy.',
        subtopics: [
          { id: 'chem-04-01', name: 'Rate Equations & Rate Constant', slug: 'rate-equations', keywords: ['rate law', 'order of reaction', 'half-life', 'pseudo first order', 'rate constant k'] },
          { id: 'chem-04-02', name: 'Arrhenius Equation & Mechanisms', slug: 'arrhenius-mechanism', keywords: ['activation energy', 'arrhenius', 'catalyst', 'rate-determining step'] },
        ],
      },
      {
        id: 'chem-05',
        chapterNumber: 5,
        name: 'Chemical & Ionic Equilibria',
        slug: 'chemical-ionic-equilibria',
        description: 'SEAB Topics 8 & 9: Dynamic equilibrium, Kc, Kp, Le Chatelier principle, buffer solutions, pH curves, and solubility product (Ksp).',
        subtopics: [
          { id: 'chem-05-01', name: 'Chemical Equilibria (Kc and Kp)', slug: 'kc-kp', keywords: ['kc', 'kp', 'le chatelier', 'partial pressure', 'degree of dissociation'] },
          { id: 'chem-05-02', name: 'Ionic Equilibria & Buffer Solutions', slug: 'buffers-ph', keywords: ['buffer', 'henderson-hasselbalch', 'ph curve', 'equivalence point', 'indicator'] },
          { id: 'chem-05-03', name: 'Solubility Product (Ksp)', slug: 'ksp', keywords: ['ksp', 'solubility product', 'common ion effect', 'precipitation'] },
        ],
      },
      {
        id: 'chem-06',
        chapterNumber: 6,
        name: 'Electrochemistry',
        slug: 'electrochemistry',
        description: 'SEAB Topic 10: Standard electrode potentials, electrochemical cells, Nernst relationships, and electrolysis calculations.',
        subtopics: [
          { id: 'chem-06-01', name: 'Standard Electrode Potential & Cell EMF', slug: 'standard-potentials', keywords: ['electrode potential', 'standard hydrogen electrode', 'emfs', 'galvanic'] },
          { id: 'chem-06-02', name: 'Electrolysis & Faradays Laws', slug: 'electrolysis', keywords: ['faraday constant', 'electrolysis', 'charge q=it', 'electroplating'] },
        ],
      },
      {
        id: 'chem-07',
        chapterNumber: 7,
        name: 'Organic Chemistry — Hydrocarbons & Halogen Derivatives',
        slug: 'organic-hydrocarbons-halogen',
        description: 'SEAB Topics 11-13: Electrophilic addition, free radical substitution, SN1/SN2 mechanisms, stereochemistry, and elimination.',
        subtopics: [
          { id: 'chem-07-01', name: 'Alkanes, Alkenes & Arenes', slug: 'alkanes-alkenes-arenes', keywords: ['free radical', 'electrophilic addition', 'markovnikov', 'benzene', 'electrophilic aromatic substitution'] },
          { id: 'chem-07-02', name: 'Halogen Derivatives (SN1 and SN2)', slug: 'halogen-derivatives', keywords: ['sn1', 'sn2', 'nucleophilic substitution', 'carbocation intermediate', 'inversion'] },
        ],
      },
      {
        id: 'chem-08',
        chapterNumber: 8,
        name: 'Organic Chemistry — Carbonyl, Carboxylic & Nitrogen Compounds',
        slug: 'organic-carbonyl-carboxylic-nitrogen',
        description: 'SEAB Topics 14-16: Nucleophilic addition, 2,4-DNPH, Tollens/Fehlings, esterification, amides, amines, amino acids, and condensation polymers.',
        subtopics: [
          { id: 'chem-08-01', name: 'Aldehydes & Ketones (Carbonyl Compounds)', slug: 'carbonyls', keywords: ['carbonyl', 'nucleophilic addition', '2,4-dnph', 'tollens', 'iodoform test'] },
          { id: 'chem-08-02', name: 'Carboxylic Acids & Acyl Chlorides', slug: 'carboxylic-acids', keywords: ['carboxylic acid', 'acyl chloride', 'esterification', 'hydrolysis'] },
          { id: 'chem-08-03', name: 'Amines, Amides & Amino Acids', slug: 'nitrogen-compounds', keywords: ['amine', 'amide', 'zwitterion', 'isoelectric point', 'peptide bond'] },
        ],
      },
    ],
  },
  physics: {
    subjectId: 'physics',
    subjectName: 'H2 Physics',
    syllabusCode: '9749',
    effectiveVersion: 'SEAB-9749-Official',
    effectiveYear: 2026,
    chapters: [
      {
        id: 'phys-01',
        chapterNumber: 1,
        name: 'Kinematics & Dynamics',
        slug: 'kinematics-dynamics',
        description: 'SEAB Section II: Equations of motion, projectile motion, Newtons laws, momentum conservation, and impulse.',
        subtopics: [
          { id: 'phys-01-01', name: 'Linear Kinematics & Projectiles', slug: 'projectiles', keywords: ['projectile', 'acceleration', 'velocity-time', 'suvat'] },
          { id: 'phys-01-02', name: 'Newtons Laws & Linear Momentum', slug: 'momentum', keywords: ['newtons second law', 'impulse', 'elastic collision', 'conservation of momentum'] },
        ],
      },
      {
        id: 'phys-02',
        chapterNumber: 2,
        name: 'Circular Motion & Gravitation',
        slug: 'circular-gravitation',
        description: 'SEAB Section II: Centripetal acceleration, circular orbits, Newtons law of gravitation, and gravitational potential.',
        subtopics: [
          { id: 'phys-02-01', name: 'Centripetal Acceleration & Forces', slug: 'circular-motion', keywords: ['centripetal acceleration', 'angular velocity', 'banked track'] },
          { id: 'phys-02-02', name: 'Gravitational Fields & Orbits', slug: 'gravitational-fields', keywords: ['gravitational field strength', 'geostationary orbit', 'escape velocity', 'keplers law'] },
        ],
      },
      {
        id: 'phys-03',
        chapterNumber: 3,
        name: 'Oscillations & Waves',
        slug: 'oscillations-waves',
        description: 'SEAB Section IV: Simple harmonic motion, resonance, damping, wave interference, diffraction gratings, and stationary waves.',
        subtopics: [
          { id: 'phys-03-01', name: 'Simple Harmonic Motion & Damping', slug: 'shm', keywords: ['shm', 'simple harmonic', 'resonance', 'damping', 'phase difference'] },
          { id: 'phys-03-02', name: 'Superposition & Interference', slug: 'wave-interference', keywords: ['youngs double slit', 'diffraction grating', 'coherence', 'path difference'] },
        ],
      },
      {
        id: 'phys-04',
        chapterNumber: 4,
        name: 'Electromagnetism & Quantum Physics',
        slug: 'electromagnetism-quantum',
        description: 'SEAB Section V & VI: Magnetic fields, electromagnetic induction, alternating currents, photoelectric effect, and nuclear energy.',
        subtopics: [
          { id: 'phys-04-01', name: 'Magnetic Force & Induction', slug: 'induction', keywords: ['faradays law', 'lenzs law', 'magnetic flux', 'lorentz force'] },
          { id: 'phys-04-02', name: 'Photoelectric Effect & Wave-Particle Duality', slug: 'quantum', keywords: ['photoelectric effect', 'work function', 'de broglie', 'photon energy hf'] },
        ],
      },
    ],
  },
  biology: {
    subjectId: 'biology',
    subjectName: 'H2 Biology',
    syllabusCode: '9744',
    effectiveVersion: 'SEAB-9744-Official',
    effectiveYear: 2026,
    chapters: [
      {
        id: 'bio-01',
        chapterNumber: 1,
        name: 'Cell Structure & Biological Molecules',
        slug: 'cell-molecules',
        description: 'SEAB Core Idea 1: Organelles, membrane transport, proteins, nucleic acids, and enzymes.',
        subtopics: [
          { id: 'bio-01-01', name: 'Organelles & Fluid Mosaic Model', slug: 'membranes', keywords: ['organelle', 'fluid mosaic', 'phospholipid', 'active transport'] },
          { id: 'bio-01-02', name: 'Enzyme Kinetics & Allosteric Regulation', slug: 'enzymes', keywords: ['vmax', 'km', 'competitive inhibitor', 'allosteric', 'activation energy'] },
        ],
      },
      {
        id: 'bio-02',
        chapterNumber: 2,
        name: 'Genetics, Molecular Biology & Gene Expression',
        slug: 'genetics-molecular',
        description: 'SEAB Core Idea 2: DNA replication, transcription, translation, prokaryotic/eukaryotic gene regulation, and mutations.',
        subtopics: [
          { id: 'bio-02-01', name: 'Transcription, Translation & Epigenetics', slug: 'gene-expression', keywords: ['transcription', 'translation', 'promoter', 'lac operon', 'histone acetylation'] },
          { id: 'bio-02-02', name: 'Mendelian Genetics & Pedigree Analysis', slug: 'inheritance', keywords: ['epistasis', 'linkage', 'pedigree', 'chi-square', 'crossing over'] },
        ],
      },
    ],
  },
};
