'use client';

import React from 'react';

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default function HighlightedText({
  text,
  query,
  className,
}: {
  text: string;
  query?: string;
  className?: string;
}) {
  const q = (query || '').trim();
  if (!q) return <span className={className}>{text}</span>;

  const re = new RegExp(`(${escapeRegExp(q)})`, 'ig');
  const parts = text.split(re);

  return (
    <span className={className}>
      {parts.map((part, idx) => {
        if (!part) return null;
        const isMatch = part.toLowerCase() === q.toLowerCase();
        return isMatch ? (
          <span
            key={idx}
            className="bg-yellow-200 text-gray-900 rounded px-0.5"
          >
            {part}
          </span>
        ) : (
          <React.Fragment key={idx}>{part}</React.Fragment>
        );
      })}
    </span>
  );
}


