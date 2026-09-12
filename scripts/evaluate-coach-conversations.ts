import 'dotenv/config';
import { writeFile } from 'node:fs/promises';
import { CONVERSATION_CASES, evaluateConversationAnswer } from '../server/coach/conversationEvaluation';

const args = process.argv.slice(2);
if (!args.includes('--live')) {
  console.log('Synthetic conversation cases (no provider requests made):');
  for (const item of CONVERSATION_CASES) console.log(`${item.id}: ${item.rubric}`);
  console.log('Run with --live to use the configured provider. Optional: --case <id> --provider <openrouter|gemini> --output <report.json>.');
} else {
  const option = (name: string) => args[args.indexOf(name) + 1];
  const provider = args.includes('--provider') ? option('--provider') : 'openrouter';
  if (!['openrouter', 'gemini'].includes(provider)) throw new Error('Unknown provider');
  const cases = args.includes('--case') ? CONVERSATION_CASES.filter(item => item.id === option('--case')) : CONVERSATION_CASES;
  if (!cases.length) throw new Error('Unknown conversation case');
  const generate = provider === 'openrouter' ? (await import('../server/coach/openrouterService')).generateOpenRouterResponse
    : (await import('../server/coach/geminiService')).generateLLMResponse;
  const results = [];
  for (const item of cases) {
    const started = Date.now();
    try {
      const answer = await generate(item.messages, { mode: 'normal', quizScore: { correct: 0, total: 0 }, quizHistory: [] });
      const failures = evaluateConversationAnswer(item, answer);
      results.push({ id: item.id, rubric: item.rubric, content: answer.content, screenshots: answer.screenshots?.map(s => s.src) ?? [], failures, elapsedMs: Date.now() - started });
      console.log(`${failures.length ? 'FAIL' : 'PASS'} ${item.id}${failures.length ? ': ' + failures.join('; ') : ''}`);
    } catch {
      results.push({ id: item.id, failures: ['Generation failed'], elapsedMs: Date.now() - started });
      console.log(`FAIL ${item.id}: generation failed`);
    }
  }
  const report = { provider, timestamp: new Date().toISOString(), note: 'Heuristic coverage checks are smoke tests, not proof of semantic accuracy. Review answers against each rubric.', results };
  if (args.includes('--output')) await writeFile(option('--output'), JSON.stringify(report, null, 2) + '\n');
  console.log(`${results.filter(r => !r.failures.length).length}/${results.length} conversation checks passed.`);
  if (results.some(r => r.failures.length)) process.exitCode = 1;
}
