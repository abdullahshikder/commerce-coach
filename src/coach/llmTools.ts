import { Type, type FunctionDeclaration } from '@google/genai';
import {
  getTrainingModule,
  getQuizQuestions,
  KNOWLEDGE_BASE,
  TRAINING_MODULES,
  searchKnowledge,
} from './knowledgeBase';
import {
  getScreenshotsForFeatures,
  searchScreenshots,
  SCREENSHOT_INDEX,
  type Screenshot,
} from './screenshots/manifest';

// ---------------------------------------------------------------------------
// Tool Definitions (Gemini Function Declarations)
// ---------------------------------------------------------------------------
// Retrieval supplies the focused evidence; these tools fill gaps and support
// structured training, quiz, domain, and screenshot operations.

export const TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: 'search_knowledge',
    description: 'Find documented facts for the specific question or current step you understood from the conversation. Results are reference material; compose a focused answer rather than copying a whole workflow.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: 'A focused search for the current question, resolved using conversation context.' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_training_module',
    description:
      'Fetch the full content of a specific training module by level. Use when the user wants to start or continue training, or asks to learn about a specific level.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        level: {
          type: Type.INTEGER,
          description: 'Training level (1-8). 1=Fundamentals, 2=Account Setup, 3=Product Catalog, 4=Selling Channels, 5=Social Commerce, 6=Orders & Fulfillment, 7=Finance & Operations, 8=Certification.',
        },
      },
      required: ['level'],
    },
  },
  {
    name: 'get_quiz_questions',
    description:
      'Fetch quiz questions with correct answers and explanations for a specific domain. Use when the user wants to take a quiz or test their knowledge.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        domain: {
          type: Type.STRING,
          description: 'Optional domain filter. One of: fashion, pharmacy, grocery, electronics, food, beauty, home, sports, general, signup, delivery, payments, analytics, store, orders, products, inventory, channels, checkout, chats, integrations, finance, media, warehouse.',
        },
        count: {
          type: Type.INTEGER,
          description: 'Number of questions to return (default 5).',
        },
      },
    },
  },
  {
    name: 'list_domains',
    description:
      'List all available business domains on Pathao Commerce and how many knowledge items exist for each. Use when users ask what domains are supported.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'search_screenshots',
    description:
      'Search the Product Memo screenshot index using the user\'s natural-language question. Prefer this tool when selecting visual references for an answer.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: 'The user\'s question or a concise description of the screen to find.',
        },
        feature_ids: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Optional feature IDs to boost in the search results.',
        },
        limit: {
          type: Type.INTEGER,
          description: 'Maximum screenshots to return. Use 1-4; default is 4.',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_screenshots',
    description:
      'Get screenshot image references for a specific feature. Use when the user wants to see visual guides or when a feature has associated screenshots.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        feature_ids: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'List of feature IDs to get screenshots for (e.g., ["signup-001"]).',
        },
      },
      required: ['feature_ids'],
    },
  },
  {
    name: 'suggest_screenshots',
    description:
      'Select the exact screenshots to display after inspecting search/get results. Only select images relevant to the step explained in your answer. An empty list means no screenshots.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        screenshot_ids: {
          type: Type.ARRAY,
          items: { type: Type.STRING, enum: [...new Set(SCREENSHOT_INDEX.map(screen => screen.src))] },
          description: 'Exact image filenames from screenshot search/get results, e.g. image96.jpg, never feature IDs such as warehouse-001. Maximum four in display order; do not select a whole guide by default.',
        },
      },
      required: ['screenshot_ids'],
    },
  },
];

// The final review owns image selection; drafting should not spend extra calls selecting images twice.
export const ANSWER_TOOL_DECLARATIONS = TOOL_DECLARATIONS.filter(tool =>
  !['search_screenshots', 'get_screenshots', 'suggest_screenshots'].includes(tool.name ?? ''));

// ---------------------------------------------------------------------------
// Tool Executors
// ---------------------------------------------------------------------------

export interface ToolResult {
  output: Record<string, unknown>;
  screenshots?: Screenshot[];
}

export function executeTool(
  name: string,
  args: Record<string, unknown>,
): ToolResult {
  switch (name) {
    case 'search_knowledge':
      return { output: { matches: searchKnowledge(String(args.query ?? '')).slice(0, 6) } };
    case 'get_training_module':
      return executeGetTrainingModule(args);
    case 'get_quiz_questions':
      return executeGetQuizQuestions(args);
    case 'list_domains':
      return executeListDomains();
    case 'search_screenshots':
      return executeSearchScreenshots(args);
    case 'get_screenshots':
      return executeGetScreenshots(args);
    case 'suggest_screenshots':
      return executeSuggestScreenshots(args);
    default:
      return { output: { error: `Unknown tool: ${name}` } };
  }
}

function executeSearchScreenshots(args: Record<string, unknown>): ToolResult {
  const query = String(args.query ?? '');
  const featureIds = Array.isArray(args.feature_ids) ? args.feature_ids.map(String) : undefined;
  const limit = Number(args.limit) || 4;
  const screenshots = searchScreenshots(query, { featureIds, limit });

  return {
    output: {
      found: screenshots.length > 0,
      count: screenshots.length,
      matches: screenshots.map(({ src, caption, step, featureId, feature }) => ({
        src,
        caption,
        step,
        featureId,
        feature,
      })),
    },
    screenshots: screenshots.length > 0 ? screenshots : undefined,
  };
}

function executeGetTrainingModule(args: Record<string, unknown>): ToolResult {
  const level = Number(args.level) || 1;
  const module = getTrainingModule(level);

  if (!module) {
    return {
      output: {
        found: false,
        message: `No training module for level ${level}. Available: ${TRAINING_MODULES.map((m) => m.level).join(', ')}`,
      },
    };
  }

  return {
    output: {
      found: true,
      level: module.level,
      title: module.title,
      description: module.description,
      domains: module.domains,
      keyConcepts: module.keyConcepts,
    },
  };
}

function executeGetQuizQuestions(args: Record<string, unknown>): ToolResult {
  const domain = args.domain ? String(args.domain) : undefined;
  const count = Number(args.count) || 5;
  const questions = getQuizQuestions(domain);

  if (questions.length === 0) {
    return {
      output: { found: false, message: 'No quiz questions available for this topic.' },
    };
  }

  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));

  return {
    output: {
      found: true,
      count: selected.length,
      totalAvailable: questions.length,
      questions: selected.map((q) => ({
        id: q.id,
        type: q.type,
        domain: q.domain,
        difficulty: q.difficulty,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      })),
    },
  };
}

function executeListDomains(): ToolResult {
  const domainMap: Record<string, { featureCount: number; features: string[] }> = {};

  for (const item of KNOWLEDGE_BASE) {
    if (!domainMap[item.domain]) {
      domainMap[item.domain] = { featureCount: 0, features: [] };
    }
    domainMap[item.domain].featureCount += 1;
    if (!domainMap[item.domain].features.includes(item.feature)) {
      domainMap[item.domain].features.push(item.feature);
    }
  }

  const domains = Object.entries(domainMap).map(([domain, info]) => ({
    domain,
    featureCount: info.featureCount,
    uniqueFeatures: info.features.length,
    sampleFeatures: info.features.slice(0, 5),
  }));

  return {
    output: {
      totalDomains: domains.length,
      totalKnowledgeItems: KNOWLEDGE_BASE.length,
      domains,
    },
  };
}

function executeGetScreenshots(args: Record<string, unknown>): ToolResult {
  const ids = Array.isArray(args.feature_ids) ? args.feature_ids.map(String) : [];
  const screenshots = getScreenshotsForFeatures(ids);

  return {
    output: {
      found: screenshots.length > 0,
      count: screenshots.length,
      screenshots,
    },
    screenshots: screenshots.length > 0 ? screenshots : undefined,
  };
}

// ── SUGGEST SCREENSHOTS ──────────────────────────────────────────────────────

function executeSuggestScreenshots(args: Record<string, unknown>): ToolResult {
  const ids = Array.isArray(args.screenshot_ids) ? [...new Set(args.screenshot_ids.map(String))].slice(0, 4) : [];
  const screenshots = ids.flatMap(src => {
    const screen = SCREENSHOT_INDEX.find(candidate => candidate.src === src);
    return screen ? [screen] : [];
  });
  const invalidIds = ids.filter(id => !screenshots.some(screen => screen.src === id));
  const validSelection = Array.isArray(args.screenshot_ids)
    && args.screenshot_ids.length <= 4
    && args.screenshot_ids.every(id => typeof id === 'string')
    && invalidIds.length === 0;

  return {
    output: {
      validSelection,
      suggested: screenshots.map(screen => screen.src),
      count: screenshots.length,
      ...(!validSelection ? {
        invalidIds,
        error: 'Use exact image filenames returned by search_screenshots or get_screenshots, not feature IDs. Look up the relevant screens and select again. An explicit empty array is allowed when no images fit.',
      } : {}),
    },
    screenshots,
  };
}
