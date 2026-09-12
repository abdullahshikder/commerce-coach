import { Route } from 'lucide-react';
import type { ChatMessage } from './responseEngine';

interface IntentBadgeProps {
  intent?: NonNullable<ChatMessage['metadata']>['intent'];
  compact?: boolean;
}

export function IntentBadge({ intent, compact = false }: IntentBadgeProps) {
  if (!intent) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-violet-100 bg-violet-50 font-semibold text-violet-700 ${
        compact ? 'px-1.5 py-0.5 text-[8px]' : 'px-2 py-1 text-[10px]'
      }`}
      title={intent.language === 'bn'
        ? `শনাক্ত করা query intent: ${intent.id} (${intent.confidence} confidence)`
        : `Detected query intent: ${intent.id} (${intent.confidence} confidence)`}
    >
      <Route size={compact ? 8 : 10} />
      {intent.language === 'bn' ? 'উদ্দেশ্য' : 'Intent'}: {intent.label}
      {intent.inheritedContext && (
        <span className="text-violet-400">· {intent.language === 'bn' ? 'আগের প্রশ্ন' : 'follow-up'}</span>
      )}
    </span>
  );
}
