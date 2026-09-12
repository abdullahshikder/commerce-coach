import {
  evaluateCoachWorkflows,
  formatCoachWorkflowEvaluation,
} from '../src/coach/workflows/evaluate';

const summary = evaluateCoachWorkflows();
console.log(formatCoachWorkflowEvaluation(summary));
if (!summary.passed) process.exitCode = 1;
