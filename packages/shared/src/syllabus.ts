/**
 * PaperForge — Singapore-Cambridge GCE A-Level Curriculum Taxonomy
 * Authoritative syllabus specifications for Singapore Junior Colleges
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
  chemistry: {
    subjectId: 'chemistry',
    subjectName: 'H2 Chemistry',
    syllabusCode: '9476',
    effectiveVersion: 'v2026.3',
    effectiveYear: 2026,
    chapters: [
      {
        id: 'chem-01',
        chapterNumber: 1,
        name: 'Atomic Structure & Chemical Bonding',
        slug: 'atomic-structure-bonding',
        description: 'Electronic configurations, shapes of molecules (VSEPR), electronegativity, intermolecular forces and hybridisation.',
        subtopics: [
          { id: 'chem-01-01', name: 'Electronic Configuration & Orbitals', slug: 'orbitals', keywords: ['orbital', 's-orbital', 'p-orbital', 'electronic configuration', 'ionisation energy'] },
          { id: 'chem-01-02', name: 'Shapes of Molecules & Bond Angles', slug: 'vsepr-shapes', keywords: ['vsepr', 'tetrahedral', 'trigonal planar', 'bond angle', 'lone pair'] },
          { id: 'chem-01-03', name: 'Intermolecular Forces & Hydrogen Bonding', slug: 'imf', keywords: ['hydrogen bond', 'van der waals', 'dipole-dipole', 'boiling point'] },
        ],
      },
      {
        id: 'chem-02',
        chapterNumber: 2,
        name: 'The Mole Concept & Stoichiometry',
        slug: 'mole-concept-stoichiometry',
        description: 'Volumetric analysis, redox titrations, back titrations, and percentage purity calculations.',
        subtopics: [
          { id: 'chem-02-01', name: 'Redox Titrations & Manganate(VII)', slug: 'redox-titration', keywords: ['titration', 'permanganate', 'manganate', 'thiosulfate', 'iodometry'] },
          { id: 'chem-02-02', name: 'Back Titrations & Gas Volumes', slug: 'back-titration', keywords: ['back titration', 'gas syringe', 'molar gas volume', 'stoichiometry'] },
        ],
      },
      {
        id: 'chem-03',
        chapterNumber: 3,
        name: 'Chemical Energetics & Thermodynamics',
        slug: 'chemical-energetics',
        description: 'Hess Law cycles, Born-Haber cycles, lattice energy, entropy change, and Gibbs free energy.',
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
        description: 'Rate equations, orders of reaction, half-life, reaction mechanisms, catalysis, and Arrhenius activation energy.',
        subtopics: [
          { id: 'chem-04-01', name: 'Rate Equations & Rate Constant', slug: 'rate-equations', keywords: ['rate law', 'order of reaction', 'half-life', 'pseudo first order', 'rate constant k'] },
          { id: 'chem-04-02', name: 'Arrhenius Equation & Mechanisms', slug: 'arrhenius-mechanism', keywords: ['activation energy', 'arrhenius', 'catalyst', 'rate-determining step'] },
        ],
      },
      {
        id: 'chem-05',
        chapterNumber: 5,
        name: 'Chemical Equilibria & Acid-Base Equilibria',
        slug: 'chemical-equilibria',
        description: 'Dynamic equilibrium, Kc, Kp, Le Chatelier principle, buffer solutions, pH curves, and solubility product (Ksp).',
        subtopics: [
          { id: 'chem-05-01', name: 'Equilibrium Constants Kc and Kp', slug: 'kc-kp', keywords: ['kc', 'kp', 'le chatelier', 'partial pressure', 'degree of dissociation'] },
          { id: 'chem-05-02', name: 'Buffer Solutions & Titration Curves', slug: 'buffers-ph', keywords: ['buffer', 'henderson-hasselbalch', 'ph curve', 'equivalence point', 'indicator'] },
          { id: 'chem-05-03', name: 'Solubility Product (Ksp) & Common Ion', slug: 'ksp', keywords: ['ksp', 'solubility product', 'common ion effect', 'precipitation'] },
        ],
      },
      {
        id: 'chem-06',
        chapterNumber: 6,
        name: 'Electrochemistry',
        slug: 'electrochemistry',
        description: 'Standard electrode potentials, electrochemical cells, Nernst relationships, and electrolysis calculations.',
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
        description: 'Electrophilic addition, free radical substitution, SN1/SN2 mechanisms, stereochemistry, and elimination.',
        subtopics: [
          { id: 'chem-07-01', name: 'Alkanes & Free-Radical Substitution', slug: 'alkanes', keywords: ['free radical', 'initiation', 'propagation', 'termination', 'halogenation'] },
          { id: 'chem-07-02', name: 'Alkenes & Electrophilic Addition', slug: 'alkenes', keywords: ['electrophilic addition', 'markovnikov', 'carbocation', 'bromination', 'hydration'] },
          { id: 'chem-07-03', name: 'Halogen Derivatives (SN1 and SN2)', slug: 'halogen-derivatives', keywords: ['sn1', 'sn2', 'nucleophilic substitution', 'carbocation intermediate', 'inversion'] },
          { id: 'chem-07-04', name: 'Arenes & Electrophilic Substitution', slug: 'arenes', keywords: ['benzene', 'electrophilic aromatic substitution', 'nitration', 'friedel-crafts'] },
        ],
      },
      {
        id: 'chem-08',
        chapterNumber: 8,
        name: 'Organic Chemistry — Carbonyl, Carboxylic & Nitrogen Compounds',
        slug: 'organic-carbonyl-carboxylic-nitrogen',
        description: 'Nucleophilic addition, 2,4-DNPH, Tollens/Fehlings, esterification, amides, amines, amino acids, and condensation polymers.',
        subtopics: [
          { id: 'chem-08-01', name: 'Aldehydes & Ketones (Nucleophilic Addition)', slug: 'carbonyls', keywords: ['carbonyl', 'nucleophilic addition', '2,4-dnph', 'tollens', 'iodoform test'] },
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
    effectiveVersion: 'v2026.1',
    effectiveYear: 2026,
    chapters: [
      {
        id: 'phys-01',
        chapterNumber: 1,
        name: 'Kinematics & Dynamics',
        slug: 'kinematics-dynamics',
        description: 'Equations of motion, projectile motion, Newtons laws, momentum conservation, and impulse.',
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
        description: 'Centripetal acceleration, circular orbits, Newtons law of gravitation, and gravitational potential.',
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
        description: 'Simple harmonic motion, resonance, damping, wave interference, diffraction gratings, and stationary waves.',
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
        description: 'Magnetic fields, electromagnetic induction, alternating currents, photoelectric effect, and nuclear energy.',
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
    effectiveVersion: 'v2026.1',
    effectiveYear: 2026,
    chapters: [
      {
        id: 'bio-01',
        chapterNumber: 1,
        name: 'Cell Structure & Biological Molecules',
        slug: 'cell-molecules',
        description: 'Organelles, membrane transport, proteins, nucleic acids, and enzymes.',
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
        description: 'DNA replication, transcription, translation, prokaryotic/eukaryotic gene regulation, and mutations.',
        subtopics: [
          { id: 'bio-02-01', name: 'Transcription, Translation & Epigenetics', slug: 'gene-expression', keywords: ['transcription', 'translation', 'promoter', 'lac operon', 'histone acetylation'] },
          { id: 'bio-02-02', name: 'Mendelian Genetics & Pedigree Analysis', slug: 'inheritance', keywords: ['epistasis', 'linkage', 'pedigree', 'chi-square', 'crossing over'] },
        ],
      },
    ],
  },
  mathematics: {
    subjectId: 'mathematics',
    subjectName: 'H2 Mathematics',
    syllabusCode: '9758',
    effectiveVersion: 'v2026.2',
    effectiveYear: 2026,
    chapters: [
      {
        id: 'math-01',
        chapterNumber: 1,
        name: 'Functions & Graphs',
        slug: 'functions-graphs',
        description: 'Composite functions, inverse functions, graph transformations, conic sections, and asymptotes.',
        subtopics: [
          { id: 'math-01-01', name: 'Composite & Inverse Functions', slug: 'functions', keywords: ['domain', 'range', 'bijective', 'composite function', 'inverse function'] },
          { id: 'math-01-02', name: 'Graph Transformations & Conics', slug: 'graph-transformations', keywords: ['asymptote', 'transformation', 'ellipse', 'hyperbola'] },
        ],
      },
      {
        id: 'math-02',
        chapterNumber: 2,
        name: 'Calculus — Differentiation & Integration',
        slug: 'calculus',
        description: 'Maclaurin series, implicit differentiation, parametric curves, integration by parts, and differential equations.',
        subtopics: [
          { id: 'math-02-01', name: 'Techniques of Differentiation & Maclaurin', slug: 'differentiation', keywords: ['chain rule', 'implicit differentiation', 'maclaurin series', 'tangent normal'] },
          { id: 'math-02-02', name: 'Techniques of Integration & Volume of Revolution', slug: 'integration', keywords: ['integration by parts', 'partial fractions', 'volume of revolution'] },
          { id: 'math-02-03', name: 'Differential Equations & Modelling', slug: 'differential-equations', keywords: ['differential equation', 'separation of variables', 'general solution'] },
        ],
      },
      {
        id: 'math-03',
        chapterNumber: 3,
        name: 'Vectors & Complex Numbers',
        slug: 'vectors-complex',
        description: 'Scalar/vector products, lines and planes in 3D, De Moivre theorem, and roots of complex polynomials.',
        subtopics: [
          { id: 'math-03-01', name: '3D Lines, Planes & Shortest Distance', slug: 'vectors-3d', keywords: ['dot product', 'cross product', 'plane equation', 'shortest distance', 'foot of perpendicular'] },
          { id: 'math-03-02', name: 'Complex Numbers & De Moivre Theorem', slug: 'complex-numbers', keywords: ['argand diagram', 'modulus-argument', 'de moivre', 'nth roots of unity'] },
        ],
      },
      {
        id: 'math-04',
        chapterNumber: 4,
        name: 'Probability & Statistics',
        slug: 'probability-statistics',
        description: 'Permutations and combinations, binomial/normal distributions, sampling, and hypothesis testing.',
        subtopics: [
          { id: 'math-04-01', name: 'Permutations, Combinations & Probability', slug: 'probability', keywords: ['permutation', 'combination', 'bayes theorem', 'independent events'] },
          { id: 'math-04-02', name: 'Normal Distribution & Hypothesis Testing', slug: 'hypothesis-testing', keywords: ['normal distribution', 'z-test', 'null hypothesis', 'p-value', 'critical value'] },
        ],
      },
    ],
  },
};
