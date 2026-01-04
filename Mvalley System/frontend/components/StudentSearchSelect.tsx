'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Student } from '@/lib/services';

export default function StudentSearchSelect(props: {
  students: Student[];
  value: string;
  onChange: (studentId: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  const { students, value, onChange, placeholder, disabled, className } = props;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement | null>(null);

  const selected = useMemo(() => students.find((s) => s.id === value), [students, value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => {
      const name = `${s.firstName || ''} ${s.lastName || ''}`.trim().toLowerCase();
      const phone = String((s as any).phone || '').toLowerCase();
      const email = String(s.email || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || email.includes(q);
    });
  }, [students, query]);

  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (rootRef.current.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, []);

  return (
    <div ref={rootRef} className={`relative ${className || ''}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={`w-full text-left rounded-md border border-gray-400 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
          disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'hover:border-gray-500'
        }`}
      >
        {selected ? (
          <span>
            {selected.firstName} {selected.lastName}
            {selected.email ? <span className="text-gray-500"> ({selected.email})</span> : null}
          </span>
        ) : (
          <span className="text-gray-500">{placeholder || 'Search student…'}</span>
        )}
      </button>

      {open && !disabled && (
        <div className="absolute z-50 mt-2 w-full rounded-md border border-gray-200 bg-white shadow-lg">
          <div className="p-2 border-b border-gray-100">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to search…"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div className="max-h-64 overflow-auto">
            {filtered.length === 0 ? (
              <div className="p-3 text-sm text-gray-500">No matching students</div>
            ) : (
              filtered.slice(0, 200).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    onChange(s.id);
                    setOpen(false);
                    setQuery('');
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                >
                  <div className="text-gray-900">
                    {s.firstName} {s.lastName}
                  </div>
                  <div className="text-xs text-gray-500">
                    {s.email || (s as any).phone || ''}
                  </div>
                </button>
              ))
            )}
          </div>
          <div className="p-2 border-t border-gray-100 flex justify-between">
            <button
              type="button"
              className="text-xs text-gray-600 hover:text-gray-900"
              onClick={() => {
                onChange('');
                setOpen(false);
                setQuery('');
              }}
            >
              Clear
            </button>
            <button
              type="button"
              className="text-xs text-gray-600 hover:text-gray-900"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


