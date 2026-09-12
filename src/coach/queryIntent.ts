import { findCoachWorkflow } from './workflows/registry';

export type CoachQueryIntentKind =
  | 'workflow'
  | 'training'
  | 'quiz'
  | 'troubleshoot'
  | 'status'
  | 'how-to'
  | 'product-qa'
  | 'merchant-scenario';

export type CoachResponseLanguage = 'en' | 'bn';

export interface CoachQueryMessage {
  role: string;
  content: string;
}

export interface CoachQueryIntent {
  id: string;
  kind: CoachQueryIntentKind;
  label: string;
  confidence: 'high' | 'medium' | 'low';
  rawQuery: string;
  resolvedQuery: string;
  retrievalQuery: string;
  inheritedContext: boolean;
  workflowId?: string;
  knowledgeId?: string;
  screenshotIds?: string[];
  language: CoachResponseLanguage;
}

const INTENT_RULES: Array<{
  kind: Exclude<CoachQueryIntentKind, 'workflow' | 'product-qa'>;
  label: Record<CoachResponseLanguage, string>;
  phrases: string[];
}> = [
  {
    kind: 'merchant-scenario',
    label: { en: 'Merchant simulation', bn: 'Merchant simulation' },
    phrases: ['simulate merchant', 'role play', 'practice', 'pretend i am', 'act as a merchant', 'merchant simulation', 'অনুশীলন', 'merchant simulation করুন'],
  },
  {
    kind: 'training',
    label: { en: 'Training', bn: 'Training' },
    phrases: ['train me', 'teach me', 'start learning', 'onboard me', 'course', 'tutorial', 'learn', 'training', 'walk me through', 'onboarding', 'শেখান', 'ট্রেনিং', 'প্রশিক্ষণ'],
  },
  {
    kind: 'quiz',
    label: { en: 'Quiz', bn: 'Quiz' },
    phrases: ['quiz me', 'test me', 'exam', 'challenge', 'pop quiz', 'test my knowledge', 'assess', 'quiz', 'কুইজ', 'পরীক্ষা নিন'],
  },
  {
    kind: 'troubleshoot',
    label: { en: 'Troubleshooting', bn: 'সমস্যা সমাধান' },
    phrases: ['issue', 'problem', 'error', 'missing', 'broken', 'not working', "can't", 'cant', 'cannot', "won't", 'help me fix', 'troubleshoot', 'debug', 'fix', 'failing', 'failed', 'stuck', 'সমস্যা', 'কাজ করছে না', 'পাচ্ছি না', 'দেখাচ্ছে না', 'ঠিক করুন'],
  },
  {
    kind: 'status',
    label: { en: 'Feature status', bn: 'Feature status' },
    phrases: ['is it live', 'is this live', 'status of', 'available', 'when will', 'launched', 'released', 'enabled for', 'can i use', 'rollout', 'চালু আছে', 'পাওয়া যাচ্ছে', 'ব্যবহার করতে পারি'],
  },
  {
    kind: 'how-to',
    label: { en: 'How-to guide', bn: 'করণীয় নির্দেশিকা' },
    phrases: ['how do i', 'how to', 'steps to', 'guide', 'walkthrough', 'what is the process', 'instructions', 'tutorial for', 'কীভাবে', 'কিভাবে', 'ধাপগুলো', 'নির্দেশনা'],
  },
];

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    // Bengali vowel signs are Unicode marks; dropping them breaks phrase matching.
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function detectExplicitLanguage(value: string): CoachResponseLanguage | undefined {
  if (/\b(?:answer|reply|respond|write|speak)?\s*(?:in|using)?\s*english\b/i.test(value)
    || /ইংরেজ(?:ি|ী|িতে)/u.test(value)) {
    return 'en';
  }
  if (/\b(?:answer|reply|respond|write|speak)?\s*(?:in|using)?\s*(?:bangla|bengali)\b/i.test(value)
    || /বাংলা(?:য়|য়|তে)?/u.test(value)) {
    return 'bn';
  }
  if (/[\u0980-\u09ff]/u.test(value) || /\b(?:kivabe|kibhabe|banabo|bananbo|korbo)\b/i.test(value)) return 'bn';
  return undefined;
}

export function detectCoachResponseLanguage(
  userMessage: string,
  messageHistory: CoachQueryMessage[] = [],
): CoachResponseLanguage {
  const currentLanguage = detectExplicitLanguage(userMessage);
  if (currentLanguage) return currentLanguage;

  if (isAmbiguousCoachFollowUp(userMessage)) {
    const priorLanguage = [...messageHistory]
      .reverse()
      .filter((message) => message.role === 'user' && message.content.trim() !== userMessage.trim())
      .map((message) => detectExplicitLanguage(message.content))
      .find((language): language is CoachResponseLanguage => Boolean(language));
    if (priorLanguage) return priorLanguage;
  }

  return 'en';
}

export function getCoachLanguageInstruction(language: CoachResponseLanguage): string {
  return language === 'bn'
    ? 'Respond entirely in natural Bangla using Bengali script. Keep Pathao Commerce UI labels such as Online Stores, Manage, Processing, and Ad Catalogues in English exactly as shown in the product.'
    : 'Respond in English.';
}

export function isAmbiguousCoachFollowUp(value: string): boolean {
  const normalized = normalize(value);
  return /^(tell me|show me|explain|continue|start|then|and|what about|how about)\b/.test(normalized)
    || /\b(from (?:the )?start|again|that|those|it|them|same)\b/.test(normalized)
    || ['বলুন', 'দেখান', 'ব্যাখ্যা করুন', 'চালিয়ে যান', 'চালিয়ে যান', 'শুরু করুন', 'এরপর', 'তারপর']
      .some((phrase) => normalized === normalize(phrase) || normalized.startsWith(`${normalize(phrase)} `))
    || ['শুরু থেকে', 'আবার', 'একইটা', 'ওটা', 'এটা']
      .some((phrase) => normalized.includes(normalize(phrase)));
}

export function resolveCoachContextualQuery(
  userMessage: string,
  messageHistory: CoachQueryMessage[] = [],
): { query: string; inheritedContext: boolean } {
  const current = userMessage.trim();
  if (!current || !isAmbiguousCoachFollowUp(current)) {
    return { query: current, inheritedContext: false };
  }

  // User text is the trusted topic signal; assistant output may already contain a wrong guess.
  const priorTopic = [...messageHistory]
    .reverse()
    .find((message) =>
      message.role === 'user'
      && message.content.trim() !== current
      && !isAmbiguousCoachFollowUp(message.content),
    )?.content.trim();

  return priorTopic
    ? { query: `${priorTopic} ${current}`, inheritedContext: true }
    : { query: current, inheritedContext: false };
}

export function resolveCoachQueryIntent(
  userMessage: string,
  messageHistory: CoachQueryMessage[] = [],
): CoachQueryIntent {
  const rawQuery = userMessage.trim();
  const contextual = resolveCoachContextualQuery(rawQuery, messageHistory);
  const language = detectCoachResponseLanguage(rawQuery, messageHistory);
  const workflow = findCoachWorkflow(contextual.query);

  if (workflow) {
    return {
      id: `workflow:${workflow.id}`,
      kind: 'workflow',
      label: language === 'bn'
        ? workflow.translations?.bn.feature ?? workflow.feature
        : workflow.feature,
      confidence: 'high',
      rawQuery,
      resolvedQuery: contextual.query,
      retrievalQuery: workflow.question,
      inheritedContext: contextual.inheritedContext,
      workflowId: workflow.id,
      knowledgeId: workflow.knowledgeId,
      screenshotIds: workflow.screenshots.map(({ src }) => src),
      language,
    };
  }

  const normalized = normalize(contextual.query);
  const matchedRule = INTENT_RULES.find(({ phrases }) =>
    phrases.some((phrase) => normalized.includes(normalize(phrase))),
  );
  if (matchedRule) {
    return {
      id: matchedRule.kind,
      kind: matchedRule.kind,
      label: matchedRule.label[language],
      confidence: 'high',
      rawQuery,
      resolvedQuery: contextual.query,
      retrievalQuery: contextual.query,
      inheritedContext: contextual.inheritedContext,
      language,
    };
  }

  return {
    id: 'product-qa',
    kind: 'product-qa',
    label: language === 'bn' ? 'Product প্রশ্ন' : 'Product question',
    confidence: rawQuery ? 'medium' : 'low',
    rawQuery,
    resolvedQuery: contextual.query,
    retrievalQuery: contextual.query,
    inheritedContext: contextual.inheritedContext,
    language,
  };
}
