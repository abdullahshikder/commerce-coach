import type { ChatMessage } from '../responseEngine';
import { getScreenshotTutorials } from '../screenshots/manifest';

export function responseImageText(message: ChatMessage): string {
  const plainAnswer = message.content.replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1').replace(/`(.+?)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '').replace(/^[-*]\s+/gm, '• ');
  return ['Commerce Coach', message.metadata?.feature, '', plainAnswer, '',
    message.metadata?.confidence === 'low' && 'Needs confirmation']
    .filter(value => typeof value === 'string').join('\n');
}

export function responseImageCaption(message: ChatMessage): string {
  return getScreenshotTutorials(message.metadata?.screenshots ?? [])
    .map(({ url }) => url)
    .join('\n');
}
