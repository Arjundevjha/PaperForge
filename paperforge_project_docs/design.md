# DESIGN.md — PaperForge Design System & Product Specification

## 1. Product Overview & Vision
**PaperForge** is a high-fidelity, automated question-bank and examination distribution platform designed for Singapore GCE A-Level tuition centres and educational institutions. It serves two distinct archetypes:
1. **Administrative / Owner Console**: Backend paper synchronization, OCR verification, syllabus mapping, and automated LaTeX/typographic compilation across all 16 Singapore Junior Colleges (RI, HCI, NYJC, VJC, ACJC, EJC, NJC, TJC, RVHS, DHS, ASRJC, JPJC, TMJC, CJC, SAJC, YIJC).
2. **Teacher / Tutor Download Hub**: Clean, zero-overhead curriculum portal where teachers navigate by Subject (H2 Chemistry, H2 Physics, H2 Biology, H2 Math) and chapter to instantly inspect live Cambridge A4 exam previews and download classroom-ready Student Papers (PDF) and Complete Answer Keys (PDF).

---

## 2. Design Principles

### Principle 1: Authentic Examination Fidelity
The student-facing materials strictly simulate official Singapore-Cambridge GCE A-Level examination formatting:
- Traditional serif body font for examination problem statements (`Times New Roman` / `Computer Modern` / `STIX Two Text`).
- Rigorous tabular mark allocation schemes: e.g., `[2]`, `[Total: 8 marks]`.
- Cambridge-standard header blocks (Name, Class, Code, Date) and formal turn-over markers (`[Turn Over]`).
- Crisp vector chemical structures, mechanism curly arrows, and LaTeX math formulas.

### Principle 2: Zero Administrative Noise in Consumer Views
Teachers and daily tutors must never encounter developer diagnostics, OCR confidence scores, or raw pipeline errors. Diagnostic telemetry is strictly isolated to administrative views, leaving the user interface focused purely on discovery, syllabus progress, and instant printing.

### Principle 3: Precision & High Information Density
Educational engineering requires high typographic clarity:
- Monospace notation for academic citations (e.g. `[RI 2025 H2 Chemistry Prelim P2 Q7(b)(ii)]`).
- Compact metadata badges indicating verified syllabus alignment (`v2026.3 Syllabus Aligned`, `100% Verified Solutions`).
- High-contrast dark console chrome paired with a high-fidelity light Cambridge A4 paper simulation preview.

---

## 3. Color Architecture & Tokens

The platform uses **Technical Examination Foundry** (`DARK` mode chassis with specialized preview contrast):

### 3.1 Primary & Accent Palette
- **Primary / Brand Cyan**: `#00e5ff` (Used for active navigation indicators, primary CTA buttons, live badges, and brand emblems)
- **Primary Hover / Glow**: `#00b8cc` / `rgba(0, 229, 255, 0.15)`
- **Secondary Turquoise**: `#00f5c4` (Used for syllabus verification badges, verified solution pills, success metrics)
- **Accent Indigo / Blue**: `#1275e2` (Used for answer key actions, document metadata tags)

### 3.2 Neutral & Surface Hierarchy (Chassis / Web App)
- **Chassis Background (Lowest)**: `#090e18` (Global page canvas, deep slate/navy)
- **Container Base (Low)**: `#0e131d` (Persistent sidebars, main panel backgrounds)
- **Container Medium**: `#171c26` (Worksheet cards, search input fields, secondary card frames)
- **Container High / Popover**: `#222938` (Active hover states, popovers, dropdowns)
- **Border / Divider**: `#263042` (Subtle 1px boundaries separating data modules)
- **Border Subtle**: `rgba(255, 255, 255, 0.08)`

### 3.3 Text & Icon Hierarchy
- **Text Highest / Heading**: `#f1f5f9` (Pure white/slate for titles and question titles)
- **Text Body**: `#cbd5e1` (Readable light grey for descriptions and details)
- **Text Muted / Secondary**: `#64748b` (Meta counters, dates, footnotes)
- **Text Monospace Citations**: `#94a3b8` (Junior College references, question codes)

### 3.4 Cambridge A4 Sheet Simulation (Paper Preview Canvas)
- **Paper Sheet Background**: `#ffffff` (Pure paper white)
- **Paper Text Primary**: `#111827` (Deep carbon ink)
- **Paper Grid & Rules**: `#1f2937` (1.5pt crisp black divider rules)
- **Paper Annotation & Watermark**: `#4b5563` (Metadata, page numbers, mark brackets)

---

## 4. Typography

### 4.1 Digital Interface Fonts
- **Primary Sans-Serif**: `Inter, -apple-system, BlinkMacSystemFont, sans-serif`
  - Weights: `400 (Regular)`, `500 (Medium)`, `600 (Semi-Bold)`, `700 (Bold)`
- **Data / Monospace**: `JetBrains Mono, SFMono-Regular, Consolas, monospace`
  - Used for: Question codes (`WS-01`, `P1 Q12`), syllabus indices (`[9476]`), citations, and file sizes.

### 4.2 Examination Paper Fonts
- **Paper Serif**: `STIX Two Text, Times New Roman, Computer Modern, serif`
  - Provides authentic Cambridge examination feel for question stems and chemical/biological nomenclature.

### 4.3 Scale & Leading
- **Display / Hero**: `24px` to `28px` (`font-bold`, `tracking-tight`, `leading-snug`)
- **Section Headers (H2)**: `18px` to `20px` (`font-semibold`)
- **Card Titles (H3)**: `15px` to `16px` (`font-semibold`, `leading-normal`)
- **Body Standard**: `13px` to `14px` (`leading-relaxed`)
- **Footnotes & Metadata**: `11px` to `12px` (`font-medium`)
- **Micro Badges**: `10px` to `11px` (`font-semibold`, uppercase or tracking-wide)

---

## 5. Layout & Spatial System

### 5.1 Grid & Outer Frame (App Shell)
- **Desktop Viewport**: Standard responsive desktop frame (1440px+ optimized).
- **Persistent Sidebar**: Width `240px`, sticky full-height with clean grouped navigation:
  - App Logo with glowing mark (`#00e5ff`)
  - Navigation Sections: Core Workflows (`Dashboard`, `Worksheets & Papers`, `Print & Class Settings`)
  - Bottom Status Card: MOE Singapore Syllabus & Curriculum Verified badge.
- **Top Navigation Bar**: Height `60px`, featuring:
  - Subject Switcher Dropdown (`H2 Chemistry [9476]`)
  - Global Search (`Search across 16 JCs, syllabus topics... Ctrl+K`)
  - Real-time syllabus sync status pill (`Sync: 18 Sep 2026 • Operational`)
  - User profile badge (`Dr. Adrian Low • Senior Chemistry Specialist`)

### 5.2 Content Split Pane
The Teacher Resource & Download Hub is arranged in an asymmetrical 2-column productivity split:
- **Left Column (Browsing & Selection — ~60% width)**:
  - Subject curriculum pills (`H2 Chem`, `H2 Phys`, `H2 Bio`, `H2 Math`).
  - Chapter filter dropdown and sorting controls (`All Chapters`, `Filter topic`).
  - Scrollable feed of high-density Chapter Worksheet Cards.
- **Right Column (Live Cambridge A4 Print Preview — ~40% width)**:
  - Fixed-ratio white simulated A4 canvas with authentic exam typesetting.
  - Header actions: Toggle marking guide, scale selector (`100%`).
  - Sticky bottom action bar: Direct action buttons `[Print Student Paper]` and `[Print Full Tutor Key]`.

---

## 6. Key Components & States

### 6.1 Chapter Worksheet Card
- **Container**: `bg-[#171c26]`, `border border-[#263042]`, `rounded-lg`, `p-5`, subtle shadow.
- **Header Row**:
  - Chapter Code Pill: `WS-01`, `WS-02`, etc. (`font-mono`, `text-xs`).
  - Metadata Text: Question count and total mark sum (e.g., `40 Questions • 180 Total Marks`).
  - Status Indicator: Glowing emerald dot + `Verified Ready to Print`.
- **Card Title**: Descriptive syllabus title (e.g. `Organic Chemistry — Hydrocarbons & Halogen Derivatives`).
- **Syllabus Descriptor**: High-precision curriculum description including chemical formulas and reaction keywords.
- **Nationwide Citation Matrix**:
  - Source coverage line: `All Singapore JCs [RI, HCI, NYJC, VJC, ACJC, DHS + 10 others]`.
  - Concrete question citations preview (e.g. `Includes: [RI 2025 P2 Q7(b)], [HCI 2024 P1 Q12], [NYJC 2025 P2 Q3(a)] +37 more`).
- **Action Group**:
  - Primary Download CTA: `Questions PDF (3.4 MB)` with download icon in cyan tint.
  - Answer Key CTA: `Answer Key PDF (5.1 MB)` in neutral dark slate button.
  - Quick Preview Link: Eye icon to load preview into the Cambridge Canvas.

### 6.2 Cambridge A4 Paper Preview Component
- **Container**: Elevated container mimicking physical crisp white paper (`shadow-2xl`).
- **Standard Exam Header**:
  - Centered formal institution title: `PAPERFORGE AUTOMATED EXAMINATION SERIES`.
  - Level code: `HIGHER 2 (H2) CHEMISTRY • SYLLABUS CODE 9476`.
  - Student fillable input boxes: `NAME:` and `CLASS:`.
- **Questions Stems**:
  - Numbering: `1. Organic Synthesis & Isomerism [Total: 8 marks]`.
  - Chemical reaction schemes and mechanistic synthesis flowcharts rendered with crisp high-contrast line work.
  - Authentic sub-part breakdown: `(a) Deduce the structural formula... [2]`.
  - Footnote citations: `CITATION: [Raffles Institution 2025 H2 Chemistry Prelim P2 Q7(b)(ii)]`.
  - Page Boundary Marker: Red dashed separator `PAGE BREAK (PRINT BOUNDARY • PAGE 1 OF 6)`.

### 6.3 Button System
- **Primary Action (Download Questions)**:
  - Fill: `#00e5ff`, Text: `#090e18`, Font weight: `600`.
  - Hover: subtle cyan drop shadow and brightness filter.
- **Secondary Action (Answer Key)**:
  - Fill: `#1e2638`, Border: `#2e3b52`, Text: `#e2e8f0`.
  - Hover: Border `#00e5ff`, Text `#ffffff`.
- **Utility / Quick Action**:
  - Ghost with hover state, font size `12px`.

---

## 7. Responsive & Accessibility Guidelines
1. **Target Viewport**: Desktop web app (`1440px` baseline). On smaller laptop displays (`1280px`), the preview column stacks neatly or becomes collapsible.
2. **Contrast Standards**:
   - Web application dark background contrast satisfies WCAG AAA (contrast ratio > 7:1 for text `#f1f5f9` on `#0e131d`).
   - Cyan accent `#00e5ff` paired with dark text `#090e18` yields > 12:1 contrast ratio.
3. **Print Media Queries (`@media print`)**:
   - Strips the chassis, top bar, and side navigation.
   - Outputs exclusively the clean vector Cambridge A4 worksheet with standard 20mm margins, true-black text (`#000000`), and pure vector diagrams.
