'use client';

import React, { useMemo } from 'react';
import katex from 'katex';

interface MathRendererProps {
  content: string;
  className?: string;
  inline?: boolean;
}

interface Segment {
  type: 'text' | 'inline-math' | 'display-math';
  value: string;
}

function parseMathSegments(text: string): Segment[] {
  if (!text) return [];

  const segments: Segment[] = [];
  // Regex to match $$...$$, \[...\], $...$, or \(...\)
  // Non-greedy matching with lookbehind/lookahead considerations
  const regex = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\$(?!\$)[^\$\n]+?\$|\\\([\s\S]+?\\\))/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        value: text.slice(lastIndex, match.index),
      });
    }

    const token = match[0];
    if (token.startsWith('$$') && token.endsWith('$$')) {
      segments.push({
        type: 'display-math',
        value: token.slice(2, -2).trim(),
      });
    } else if (token.startsWith('\\[') && token.endsWith('\\]')) {
      segments.push({
        type: 'display-math',
        value: token.slice(2, -2).trim(),
      });
    } else if (token.startsWith('$') && token.endsWith('$')) {
      segments.push({
        type: 'inline-math',
        value: token.slice(1, -1).trim(),
      });
    } else if (token.startsWith('\\(') && token.endsWith('\\)')) {
      segments.push({
        type: 'inline-math',
        value: token.slice(2, -2).trim(),
      });
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      value: text.slice(lastIndex),
    });
  }

  return segments;
}

const MathRenderer: React.FC<MathRendererProps> = ({
  content,
  className = '',
  inline = false,
}) => {
  const renderedSegments = useMemo(() => {
    const segments = parseMathSegments(content);

    return segments.map((seg, idx) => {
      if (seg.type === 'text') {
        // Retain line breaks in text
        return <span key={idx} className="whitespace-pre-wrap">{seg.value}</span>;
      }

      const isDisplay = seg.type === 'display-math';
      try {
        const html = katex.renderToString(seg.value, {
          displayMode: isDisplay,
          throwOnError: false,
        });

        if (isDisplay) {
          return (
            <div
              key={idx}
              className="my-2 overflow-x-auto text-center"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }

        return (
          <span
            key={idx}
            className="inline-math px-0.5"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      } catch {
        return (
          <code key={idx} className="font-mono text-red-500 bg-red-50 px-1 py-0.5 rounded text-xs">
            {seg.value}
          </code>
        );
      }
    });
  }, [content]);

  if (inline) {
    return <span className={`inline ${className}`}>{renderedSegments}</span>;
  }

  return <div className={`math-rendered-container ${className}`}>{renderedSegments}</div>;
};

export default MathRenderer;
