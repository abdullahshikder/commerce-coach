import type { ChatMessage } from '../responseEngine';
import { screenshotUrl } from '../screenshotAssets';

// Use browser text shaping so Bengali conjuncts use the same local font as chat.
export async function renderResponseImage(message: ChatMessage): Promise<Blob> {
  await document.fonts.load('24px "Noto Sans Bengali Variable"', message.content);
  await document.fonts.ready;
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Image export is unavailable in this browser.');
  const font = '24px "Noto Sans Bengali Variable", sans-serif';
  context.font = font;
  const wrap = (text: string): string[] => text.split('\n').flatMap(paragraph => {
    const result: string[] = [];
    let line = '';
    const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    for (const token of paragraph.split(/(\s+)/)) {
      if (line && context.measureText(line + token).width > 1080) {
        result.push(line.trimEnd()); line = '';
      }
      // Split only overlong tokens at grapheme boundaries, preserving Bengali conjuncts.
      for (const { segment } of graphemes.segment(token)) {
        if (context.measureText(line + segment).width > 1080 && line) {
          result.push(line); line = '';
        }
        if (line || segment.trim()) line += segment;
      }
    }
    result.push(line); return result;
  });
  const plainAnswer = message.content.replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1').replace(/`(.+?)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '').replace(/^[-*]\s+/gm, '• ');
  const lines = wrap(['Commerce Coach', message.metadata?.feature, '', plainAnswer,
    '',
    message.metadata?.confidence === 'low' && 'Needs confirmation'].filter(value => typeof value === 'string').join('\n'));
  const images = await Promise.all((message.metadata?.screenshots ?? []).map(async screenshot => {
    const img = new Image();
    const src = screenshotUrl(screenshot.src);
    if (!src) throw new Error('A screenshot is unavailable. Please try again.');
    img.src = src;
    await img.decode();
    return { img, caption: screenshot.caption };
  }));
  const captions = images.map(({ caption }) => wrap(caption));
  const height = 120 + lines.length * 40 + images.reduce((sum, { img }, index) => sum + 1080 * img.naturalHeight / img.naturalWidth + 64 + captions[index].length * 40, 0);
  if (height > 15000) throw new Error('This answer is too long for one image. Use PDF instead.');
  canvas.height = Math.ceil(height);
  context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height);
  context.font = font; context.fillStyle = '#20252d';
  let y = 70;
  for (const line of lines) { context.fillText(line, 60, y); y += 40; }
  for (const [index, { img }] of images.entries()) {
    y += 24;
    for (const caption of captions[index]) { context.fillText(caption, 60, y); y += 40; }
    const imageHeight = 1080 * img.naturalHeight / img.naturalWidth;
    context.drawImage(img, 60, y, 1080, imageHeight); y += imageHeight + 40;
  }
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Image export failed. Try PDF.')), 'image/png'));
}

export function downloadResponse(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = 'commerce-coach-answer.png'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
