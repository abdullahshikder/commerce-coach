const screenshots = import.meta.glob('./screenshots/*.{png,jpg}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
export const screenshotUrl = (filename: string): string => screenshots[`./screenshots/${filename}`] || '';
