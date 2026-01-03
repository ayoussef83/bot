'use client';

import { useState, useRef, useEffect } from 'react';
import { FiSearch, FiX, FiChevronDown } from 'react-icons/fi';
import { Student } from '@/lib/services';

interface StudentSearchSelectProps {
  students: Student[];
  value: string;
  onChange: (studentId: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
}

export default function StudentSearchSelect({
  students,
  value,
  onChange,
  placeholder = 'Search for a student...',
  required = false,
  error,
}: StudentSearchSelectProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedStudent = students.find((s) => s.id === value);

  // Filter students based on search term
  const filteredStudents = students.filter((student) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    const email = student.email?.toLowerCase() || '';
    const phone = student.phone || '';
    return fullName.includes(searchLower) || email.includes(searchLower) || phone.includes(searchLower);
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < filteredStudents.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredStudents[highlightedIndex]) {
          handleSelect(filteredStudents[highlightedIndex].id);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSelect = (studentId: string) => {
    onChange(studentId);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
    inputRef.current?.blur();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FiSearch className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchTerm : selectedStudent ? `${selectedStudent.firstName} ${selectedStudent.lastName}` : ''}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={selectedStudent ? undefined : placeholder}
          className={`mt-1 block w-full pl-10 pr-20 rounded-md border ${
            error ? 'border-red-300' : 'border-gray-300'
          } shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
            !isOpen && selectedStudent ? 'bg-gray-50' : 'bg-white'
          }`}
          required={required}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-2">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 mr-1"
            >
              <FiX className="h-4 w-4" />
            </button>
          )}
          <FiChevronDown className="h-4 w-4 text-gray-400" />
        </div>
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredStudents.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              No students found
            </div>
          ) : (
            <ul className="py-1">
              {filteredStudents.map((student, index) => (
                <li
                  key={student.id}
                  onClick={() => handleSelect(student.id)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`px-4 py-2 cursor-pointer text-sm ${
                    index === highlightedIndex
                      ? 'bg-indigo-50 text-indigo-900'
                      : 'text-gray-900 hover:bg-gray-50'
                  } ${
                    value === student.id ? 'bg-indigo-100 font-medium' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {student.firstName} {student.lastName}
                      </div>
                      {(student.email || student.phone) && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          {student.email && <span>{student.email}</span>}
                          {student.email && student.phone && <span> • </span>}
                          {student.phone && <span>{student.phone}</span>}
                        </div>
                      )}
                    </div>
                    {value === student.id && (
                      <span className="text-indigo-600">✓</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

