import type { ScreenContext } from '../../src/coach/screenContext';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ChatMessage, ConversationState } from '../../src/coach/responseEngine';
import { executeTool } from '../../src/coach/llmTools';
import { resolveScreenshotIds } from './screenshotReview';
import { REQUEST_UNDERSTANDING_PROMPT, understandRequest, type RequestUnderstanding } from './requestUnderstanding';
import { reviewCoachAnswer } from './answerReview';
import { withTransientProviderRetry } from './providerRetry';

// All requests are intercepted. These verify pipeline contracts, not live model accuracy.
process.env.OPENROUTER_API_KEY = 'test-placeholder';
process.env.GEMINI_API_KEY = 'test-placeholder';
process.env.COACH_REVIEW_MODEL = 'test-reviewer';
const { generateOpenRouterResponse } = await import('./openrouterService');
const { generateLLMResponse } = await import('./geminiService');
const state: ConversationState = { mode: 'normal', quizScore: { correct: 0, total: 0 }, quizHistory: [] };
const history: ChatMessage[] = [
  { id: '1', role: 'user', content: 'How do I create a product?', timestamp: new Date() },
  { id: '2', role: 'assistant', content: 'Add the basic details and then variants.', timestamp: new Date() },
  { id: '3', role: 'user', content: "I'm stuck at variants. How do I add sizes and colors?", timestamp: new Date() },
];
const variantBrief: RequestUnderstanding = {
  request: 'Add sizes and colors to product variants', language: 'English', currentStep: 'Variants',
  questions: ['How do I add Size and Color attributes and values?'],
  searchQueries: ['product variant attributes values combinations'], needsAccountAccess: false, providedDetails: ['Size S and M', 'Red and Blue'],
};
type Turn = { text?: string; tool?: string; args?: Record<string, unknown> };
type Provider = 'openrouter' | 'gemini';

async function scenario(provider: Provider, options: {
  messages?: ChatMessage[]; brief?: unknown; screenContext?: ScreenContext; turns: Turn[]; review?: unknown; failPlan?: boolean; failReview?: boolean;
}, check: (response: Awaited<ReturnType<typeof generateOpenRouterResponse>>, requests: { phase: string; body: any; input?: any }[]) => void) {
  const previousFetch = globalThis.fetch;
  const requests: { phase: string; body: any; input?: any }[] = [];
  const turns = [...options.turns];
  globalThis.fetch = async (_url, init) => {
    const body = JSON.parse(String(init?.body));
    const prompt = provider === 'openrouter' ? body.messages[0].content : body.systemInstruction.parts[0].text;
    const phase = prompt === REQUEST_UNDERSTANDING_PROMPT ? 'understand' : prompt.includes('## FINAL ANSWER REVIEW') ? 'review' : prompt.includes('## FINAL VISUAL REVIEW') ? 'visual' : 'generate';
    const input = phase === 'generate' ? undefined : JSON.parse(provider === 'openrouter' ? body.messages[1].content : body.contents[0].parts[0].text);
    requests.push({ phase, body, input });
    if ((phase === 'understand' && options.failPlan) || (phase === 'review' && options.failReview)) throw new Error('Provider unavailable');
    const visual = options.review as { screenshot_ids?: string[] } | undefined;
    const turn: Turn | undefined = phase === 'visual'
      ? { text: JSON.stringify({ selections: (visual?.screenshot_ids ?? []).map(id => ({ id, instructionIndex: 0 })) }) }
      : phase === 'understand' ? { text: JSON.stringify(options.brief ?? variantBrief) }
      : phase === 'review' ? { text: JSON.stringify({ checks: [], ...(options.review ?? { answer: input.answer, screenshot_ids: [] }) as object }) }
      : turns.shift();
    assert.ok(turn, 'Unexpected generation request');
    return provider === 'openrouter'
      ? Response.json({ choices: [{ message: { content: turn.text ?? '', ...(turn.tool ? { tool_calls: [{ id: `tool-${requests.length}`, type: 'function', function: { name: turn.tool, arguments: JSON.stringify(turn.args) } }] } : {}) } }] })
      : Response.json({ candidates: [{ content: { role: 'model', parts: [
        ...(turn.text ? [{ text: turn.text }] : []), ...(turn.tool ? [{ functionCall: { name: turn.tool, args: turn.args } }] : []),
      ] }, finishReason: 'STOP' }] });
  };
  try {
    const generate = provider === 'openrouter' ? generateOpenRouterResponse : generateLLMResponse;
    const response = await generate(options.messages ?? history, state, 'Raw retrieved reference data.', options.screenContext);
    check(response, requests);
    assert.equal(turns.length, 0);
  } finally { globalThis.fetch = previousFetch; }
}

for (const provider of ['openrouter', 'gemini'] as const) {
  test(`${provider} resolves the current step before retrieving and generating`, async () => {
    const answer = 'At Variants, add Size and Color, enter S/M and Red/Blue, then review combinations.';
    await scenario(provider, { turns: [{ text: answer }], review: { answer, screenshot_ids: ['image102.jpg', 'image105.jpg'] } }, (response, requests) => {
      assert.deepEqual(requests.map(r => r.phase), ['understand', 'generate', 'review', 'visual']);
      if (provider === 'openrouter') {
        assert.equal(requests[1].body.model, 'google/gemini-2.5-flash');
        for (const request of requests.filter(r => r.phase !== 'generate')) assert.equal(request.body.model, 'test-reviewer');
      }
      assert.deepEqual(requests[0].input.conversation, history.map(({ role, content }) => ({ role, content })));
      assert.match(JSON.stringify(requests[1].body), /CURRENT REQUEST AND FOCUSED REFERENCES/);
      assert.match(JSON.stringify(requests[1].body), /product variant attributes values combinations/);
      assert.ok(requests[2].input.understood.evidence.length > 0);
      assert.deepEqual(requests[2].input.understood.brief, variantBrief);
      assert.equal(response.content, answer);
      const reviewRequest = requests[3].body;
      const schema = provider === 'openrouter' ? reviewRequest.response_format.json_schema.schema : reviewRequest.generationConfig.responseJsonSchema;
      assert.ok(schema.properties.selections.items.properties.id.enum.includes('image102.jpg'));
      assert.ok(!schema.properties.selections.items.properties.id.enum.includes('product-001'));
      assert.deepEqual(response.screenshots?.map(s => s.src), ['image102.jpg', 'image105.jpg']);
    });
  });

  test(`${provider} final review repairs a wrong answer and valid unrelated image with numeric context`, async () => {
    const messages = [
      { ...history[0], content: 'Help me locate an existing order' },
      { ...history[1], content: 'What is the order ID? It might be from Daraz.' },
      { ...history[2], content: '00000000' },
    ];
    const brief = { ...variantBrief, request: 'Find an existing order by ID', currentStep: 'Order search', questions: ['Where can I search for my order?'], searchQueries: ['orders search New Orders Processing'], needsAccountAccess: true };
    const answer = 'I can guide you to search Orders. Check New Orders and Processing for the ID.';
    await scenario(provider, { messages, brief, turns: [
      { tool: 'suggest_screenshots', args: { screenshot_ids: ['image75.jpg'] } },
      { text: 'I found your order in Daraz. Import it now.' },
    ], review: { answer, screenshot_ids: ['image4.jpg', 'image5.jpg'] } }, (response, requests) => {
      assert.equal(response.content, answer);
      assert.doesNotMatch(response.content, /I found|Import/);
      assert.deepEqual(response.screenshots?.map(s => s.src), ['image4.jpg', 'image5.jpg']);
      const review = requests.find(r => r.phase === 'review')!;
      assert.deepEqual(review.input.conversation, messages.map(({ role, content }) => ({ role, content })));
      assert.deepEqual(review.input.proposedScreenshotIds, ['image75.jpg']);
      assert.match(JSON.stringify(review.body), /No tool here looks up live orders/);
    });
  });

  for (const ids of [['warehouse-001'], []]) {
    test(`${provider} reviews ${ids.length ? 'invalid feature IDs' : 'empty preliminary selections'} against the final answer`, async () => {
      const answer = 'Warehouse Management থেকে Add Warehouse খুলুন।';
      await scenario(provider, { turns: [{ tool: 'suggest_screenshots', args: { screenshot_ids: ids } }, { text: answer }], review: { answer, screenshot_ids: ['image96.jpg'] } }, response => {
        assert.equal(response.toolResults?.[0].result.output.validSelection, ids.length === 0);
        assert.deepEqual(response.screenshots?.map(s => s.src), ['image96.jpg']);
      });
    });
  }

  test(`${provider} uses the final focused text instead of appending the earlier draft`, async () => {
    const answer = 'Enter Size values at Variants.';
    await scenario(provider, { turns: [
      { text: 'Open Products and create a product.', tool: 'get_screenshots', args: { feature_ids: ['product-001'] } },
      { text: answer },
    ], review: { answer, screenshot_ids: ['image102.jpg'] } }, (response, requests) => {
      assert.equal(requests.at(-1)?.input.answer, answer);
      assert.equal(response.content, answer);
      assert.equal(response.toolResults?.length, 1);
    });
  });

  test(`${provider} preserves a draft supplied alongside a tool call when final text is empty`, async () => {
    await scenario(provider, { turns: [{ text: 'Enter Size values.', tool: 'get_screenshots', args: { feature_ids: ['product-001'] } }, { text: '' }] }, response => {
      assert.equal(response.content, 'Enter Size values.');
    });
  });

  test(`${provider} keeps the original history available if request understanding fails`, async () => {
    await scenario(provider, { failPlan: true, turns: [{ text: 'Add Size at Variants.' }] }, (response, requests) => {
      assert.equal(response.content, 'Add Size at Variants.');
      const generation = requests.find(r => r.phase === 'generate')!.body;
      const sent = provider === 'openrouter' ? generation.messages.slice(1).map((m: any) => m.content)
        : generation.contents.map((m: any) => m.parts[0].text);
      assert.deepEqual(sent, history.map(m => m.content));
      assert.equal(requests.at(-1)?.input.understood, undefined);
    });
  });

  test(`${provider} preserves generated text without unreviewed images if review fails`, async () => {
    await scenario(provider, { failReview: true, turns: [{ tool: 'suggest_screenshots', args: { screenshot_ids: ['image75.jpg'] } }, { text: 'Search Orders.' }] }, response => {
      assert.equal(response.content, 'Search Orders.');
      assert.equal(response.screenshots, undefined);
    });
  });

  test(`${provider} returns no guide for a topic without matching screenshots`, async () => {
    await scenario(provider, { turns: [{ text: 'Event filtering is not documented.' }] }, response => assert.equal(response.screenshots, undefined));
  });

  test(`${provider} rejects empty generated output`, async () => {
    await assert.rejects(scenario(provider, { turns: [{ text: '' }] }, () => assert.fail('Must reject')), /Empty generated answer/);
  });
}

test('understanding rejects malformed or excessive fields without inventing a request', async () => {
  for (const value of [{}, { ...variantBrief, searchQueries: Array(5).fill('orders') }, { ...variantBrief, needsAccountAccess: 'yes' }]) {
    assert.equal(await understandRequest(history, async () => JSON.stringify(value)), undefined);
  }
});

test('review rejects malformed output and preserves the draft without image candidates', async () => {
  for (const value of [{ answer: '', screenshot_ids: ['image75.jpg'] }, { answer: 42 }, null]) {
    assert.deepEqual(await reviewCoachAnswer({ conversation: [], answer: 'Original draft', proposedScreenshotIds: ['image75.jpg'] }, async () => JSON.stringify(value)), { content: 'Original draft', screenshots: [] });
  }
});

test('visual references reject unknown IDs, remove duplicates, and cap the gallery', async () => {
  const screens = resolveScreenshotIds(['../unknown.jpg', 'image102.jpg', 'image102.jpg', 'image105.jpg', 'image106.jpg', 'image100.jpg', 'image25.jpg']);
  assert.deepEqual(screens.map(s => s.src), ['image102.jpg', 'image105.jpg', 'image106.jpg', 'image100.jpg']);
  for (const args of [{ screenshot_ids: ['warehouse-001'] }, { feature_ids: ['warehouse-001'] }, {}]) {
    assert.equal(executeTool('suggest_screenshots', args).output.validSelection, false);
  }
});


test('review repairs a feature ID once even when a provider ignores the schema', async () => {
  let calls = 0;
  const result = await reviewCoachAnswer({ conversation: [], answer: 'Draft', proposedScreenshotIds: [] }, async (instructions, input) => {
    calls++;
    if (calls === 3) {
      assert.match(instructions, /previous image selection was invalid/);
      assert.equal((input as { answer: string }).answer, 'Reviewed answer');
    }
    return JSON.stringify({ checks: [], answer: 'Reviewed answer', selections: [{ id: calls <= 2 ? 'warehouse-001' : 'image96.jpg', instructionIndex: 0 }] });
  });
  assert.equal(calls, 3);
  assert.deepEqual(result.screenshots.map(s => s.src), ['image96.jpg']);
});

test('repeated invalid selections stop after one correction and preserve reviewed text', async () => {
  let calls = 0;
  const result = await reviewCoachAnswer({ conversation: [], answer: 'Draft', proposedScreenshotIds: [] }, async () => {
    calls++;
    return JSON.stringify({ checks: [], answer: 'Reviewed answer', selections: [{ id: 'warehouse-001', instructionIndex: 0 }] });
  });
  assert.equal(calls, 3);
  assert.deepEqual(result, { content: 'Reviewed answer', screenshots: [] });
});


test('visual review rejects references to nonexistent answer instructions', async () => {
  let calls = 0;
  const result = await reviewCoachAnswer({ conversation: [], answer: 'Search Orders.', proposedScreenshotIds: [] }, async () => {
    calls++;
    return calls === 1 ? JSON.stringify({ checks: [], answer: 'Search Orders.' })
      : JSON.stringify({ selections: [{ id: 'image7.jpg', instructionIndex: 8 }] });
  });
  assert.equal(calls, 3);
  assert.deepEqual(result, { content: 'Search Orders.', screenshots: [] });
});


test('provider retries a transient failure once but never retries an authentication failure', async () => {
  let calls = 0;
  const value = await withTransientProviderRetry(async () => {
    if (++calls === 1) throw Object.assign(new Error('Timeout'), { name: 'TimeoutError' });
    return 'Generated answer';
  });
  assert.equal(value, 'Generated answer');
  assert.equal(calls, 2);
  calls = 0;
  await assert.rejects(withTransientProviderRetry(async () => {
    calls++;
    throw Object.assign(new Error('Unavailable'), { status: 503 });
  }));
  assert.equal(calls, 2);
  calls = 0;
  await assert.rejects(withTransientProviderRetry(async () => {
    calls++;
    throw Object.assign(new Error('Unauthorized'), { status: 401 });
  }));
  assert.equal(calls, 1);
});

test('visual instruction indices preserve Markdown and avoid translated quote mismatches', async () => {
  const answer = 'Check the **Processing** tab for `00000000`.';
  let calls = 0;
  const result = await reviewCoachAnswer({ conversation: [], answer, proposedScreenshotIds: [] }, async () => {
    calls++;
    return calls === 1 ? JSON.stringify({ checks: [], answer })
      : JSON.stringify({ selections: [{ id: 'image5.jpg', instructionIndex: 0 }] });
  });
  assert.equal(calls, 2);
  assert.deepEqual(result.screenshots.map(s => s.src), ['image5.jpg']);
});

for (const provider of ['openrouter', 'gemini'] as const) {
  for (const failPlan of [false, true]) {
    test(`${provider} carries host context through draft and both reviews even when planning fails=${failPlan}`, async () => {
      const screenContext: ScreenContext = { page: 'Product editor', currentStep: 'Variants', completedSteps: ['Basic details'], visibleErrors: ['Option name is required'], observedAt: Date.now() };
      await scenario(provider, { screenContext, failPlan, turns: [{ text: 'Enter the option name.' }] }, (_response, requests) => {
        assert.deepEqual(requests.find(r => r.phase === 'understand')?.input.screenContext, screenContext);
        assert.match(JSON.stringify(requests.find(r => r.phase === 'generate')?.body), /CURRENT SCREEN OBSERVATION/);
        for (const phase of ['review', 'visual']) assert.deepEqual(requests.find(r => r.phase === phase)?.input.screenContext, screenContext);
      });
    });
  }
  test(`${provider} discards a stale host page before every model phase`, async () => {
    await scenario(provider, { screenContext: { page: 'Old warehouse form', observedAt: Date.now() - 600_000 }, turns: [{ text: 'Help with variants.' }] }, (_response, requests) => {
      assert.ok(!JSON.stringify(requests).includes('Old warehouse form'));
    });
  });
}
