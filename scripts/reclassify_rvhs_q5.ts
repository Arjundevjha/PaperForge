import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as fs from 'fs';

// Load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq > 0) {
      const key = trimmed.substring(0, eq).trim();
      let val = trimmed.substring(eq + 1).trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const QID = 'rvhs-2021-p1-q05';
const NEW_CHAPTER = 'Functions and Graphs';
const NEW_SUBTOPIC = 'Functions';
const CLEAN_TEXT = `The functions $\\mathrm{f}$ and $\\mathrm{g}$ are defined by
$\\mathrm{f} : x \\mapsto \\frac{x}{x-1}, \\quad x \\in \\mathbb{R}, x \\ne 1$,
$\\mathrm{g} : x \\mapsto \\frac{5}{x+1}, \\quad x \\in \\mathbb{R}, x \\le 4$.

(i) Find $\\mathrm{f}^{-1}(x)$ and state the domain of $\\mathrm{f}^{-1}$. [3]

(ii) State whether the composite functions $\\mathrm{fg}$ and $\\mathrm{gf}$ exist, justifying your answer.
Hence find the range of the composite function(s) that exist(s). [4]`;

async function main() {
  console.log(`[+] Reclassifying ${QID} to "${NEW_CHAPTER}" • "${NEW_SUBTOPIC}"...`);

  // 1. Update local .paperforge-store.json
  const storePath = path.resolve(process.cwd(), 'packages/db/.paperforge-store.json');
  if (fs.existsSync(storePath)) {
    const storeData = JSON.parse(fs.readFileSync(storePath, 'utf-8'));
    let foundQ = false;
    for (const q of storeData.questions || []) {
      if (q.id === QID) {
        q.chapter = NEW_CHAPTER;
        q.subtopic = NEW_SUBTOPIC;
        q.textContent = CLEAN_TEXT;
        q.updatedAt = new Date().toISOString();
        foundQ = true;
        break;
      }
    }

    // Move between worksheets
    let removedFromCalculus = false;
    let addedToFunctions = false;
    for (const w of storeData.worksheets || []) {
      if (w.chapter === 'Calculus') {
        const origLen = w.manifest.questions.length;
        w.manifest.questions = w.manifest.questions.filter((id: string) => id !== QID);
        if (w.manifest.questions.length < origLen) {
          w.questionCount = w.manifest.questions.length;
          w.totalMarks = Math.max(0, w.totalMarks - 7);
          w.manifest.totalMarks = w.totalMarks;
          removedFromCalculus = true;
        }
      } else if (w.chapter === 'Functions and Graphs') {
        if (!w.manifest.questions.includes(QID)) {
          w.manifest.questions.push(QID);
          w.questionCount = w.manifest.questions.length;
          w.totalMarks = w.totalMarks + 7;
          w.manifest.totalMarks = w.totalMarks;
          addedToFunctions = true;
        }
      }
    }

    fs.writeFileSync(storePath, JSON.stringify(storeData, null, 2), 'utf-8');
    console.log(`[✓] Updated local store: question found=${foundQ}, removed from Calculus=${removedFromCalculus}, added to Functions=${addedToFunctions}`);
  }

  // 2. Update Supabase if configured
  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: qErr } = await supabase
      .from('questions')
      .update({
        chapter: NEW_CHAPTER,
        subtopic: NEW_SUBTOPIC,
        text_content: CLEAN_TEXT,
        updated_at: new Date().toISOString(),
      })
      .eq('id', QID);

    if (qErr) {
      console.error('Supabase questions update error:', qErr.message);
    } else {
      console.log(`[✓] Updated ${QID} in Supabase questions table.`);
    }

    // Remove from ws_math_calculus
    await supabase
      .from('worksheet_questions')
      .delete()
      .eq('worksheet_id', 'ws_math_calculus')
      .eq('question_id', QID);

    // Get max position in ws_math_functions_graphs
    const { data: posData } = await supabase
      .from('worksheet_questions')
      .select('position')
      .eq('worksheet_id', 'ws_math_functions_graphs')
      .order('position', { ascending: false })
      .limit(1);

    const nextPos = (posData?.[0]?.position || 0) + 1;

    // Add to ws_math_functions_graphs
    await supabase
      .from('worksheet_questions')
      .upsert({
        worksheet_id: 'ws_math_functions_graphs',
        question_id: QID,
        position: nextPos,
      });

    // Update counts and marks
    const { count: calcCount } = await supabase
      .from('worksheet_questions')
      .select('*', { count: 'exact', head: true })
      .eq('worksheet_id', 'ws_math_calculus');

    const { count: fnCount } = await supabase
      .from('worksheet_questions')
      .select('*', { count: 'exact', head: true })
      .eq('worksheet_id', 'ws_math_functions_graphs');

    await supabase
      .from('worksheets')
      .update({
        question_count: calcCount || 214,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 'ws_math_calculus');

    await supabase
      .from('worksheets')
      .update({
        question_count: fnCount || 208,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 'ws_math_functions_graphs');

    console.log(`[✓] Transferred ${QID} between chapter compendiums in Supabase.`);
  }

  console.log('[✓] Reclassification complete.');
}

main().catch(console.error);
