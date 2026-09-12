import React from 'react';

/**
 * Simple markdown-to-JSX renderer for chat messages.
 * Handles: **bold**, *italic*, `code`, bullet lists, numbered lists, line breaks.
 * No external dependencies.
 */

function parseInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Match **bold**, *italic*, `code`
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[2]) {
      // **bold**
      parts.push(<strong key={match.index} className="font-bold">{match[2]}</strong>);
    } else if (match[3]) {
      // *italic*
      parts.push(<em key={match.index} className="italic">{match[3]}</em>);
    } else if (match[4]) {
      // `code`
      parts.push(
        <code key={match.index} className="bg-gray-100 text-red-600 px-1 py-0.5 rounded text-[10px] font-mono">
          {match[4]}
        </code>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

export function renderMarkdown(content: string): React.ReactNode {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const flushList = () => {
    if (listItems.length > 0 && listType) {
      const Tag = listType;
      elements.push(
        <Tag key={`list-${elements.length}`} className={`my-1 ${listType === 'ul' ? 'list-disc' : 'list-decimal'} pl-4 space-y-0.5`}>
          {listItems}
        </Tag>
      );
      listItems = [];
      listType = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Empty line
    if (trimmed === '') {
      flushList();
      continue;
    }

    // Bullet list item: • or -
    if (/^[•\-]\s/.test(trimmed)) {
      listType = 'ul';
      listItems.push(
        <li key={i} className="text-[11px] text-gray-700 leading-relaxed">
          {parseInline(trimmed.replace(/^[•\-]\s/, ''))}
        </li>
      );
      continue;
    }

    // Numbered list item: 1. 2. etc
    if (/^\d+\.\s/.test(trimmed)) {
      listType = 'ol';
      listItems.push(
        <li key={i} className="text-[11px] text-gray-700 leading-relaxed">
          {parseInline(trimmed.replace(/^\d+\.\s/, ''))}
        </li>
      );
      continue;
    }

    // Header: **text** on its own line
    if (/^\*\*.+\*\*$/.test(trimmed)) {
      flushList();
      elements.push(
        <div key={i} className="text-[12px] font-bold text-gray-800 mt-2 mb-1">
          {parseInline(trimmed)}
        </div>
      );
      continue;
    }

    // Regular line
    flushList();
    elements.push(
      <div key={i} className="text-[11px] text-gray-700 leading-relaxed">
        {parseInline(trimmed)}
      </div>
    );
  }

  flushList();

  return <div className="space-y-0.5">{elements}</div>;
}
