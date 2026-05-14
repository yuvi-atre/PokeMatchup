import { useState, useRef, useEffect, useCallback } from 'react';
import { fuzzyMatch } from '@/lib/utils';

interface SearchableDropdownProps<T> {
  options: T[];
  getLabel: (option: T) => string;
  getValue: (option: T) => string;
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function SearchableDropdown<T>({
  options,
  getLabel,
  getValue,
  value,
  onChange,
  placeholder = 'Search…',
  disabled = false,
}: SearchableDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = value != null
    ? options.find((o) => getValue(o) === value)
    : undefined;

  const filtered = query
    ? options.filter((o) => fuzzyMatch(query, getLabel(o)))
    : options;

  const open = useCallback(() => {
    setQuery('');
    setHighlightedIndex(0);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
  }, []);

  const select = useCallback(
    (option: T) => {
      onChange(getValue(option));
      close();
    },
    [onChange, getValue, close],
  );

  // Reset highlight when filtered list changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [query]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (!isOpen || !listRef.current) return;
    const item = listRef.current.children[highlightedIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [highlightedIndex, isOpen]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, close]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        e.preventDefault();
        open();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filtered[highlightedIndex]) {
          select(filtered[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        close();
        inputRef.current?.blur();
        break;
    }
  }

  const displayValue = isOpen ? query : (selectedOption ? getLabel(selectedOption) : '');

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        className={[
          'w-full rounded px-3 py-1.5 text-sm bg-gray-800 border text-gray-100',
          'placeholder:text-gray-500 focus:outline-none focus:ring-1',
          disabled
            ? 'border-gray-700 text-gray-500 cursor-not-allowed'
            : 'border-gray-600 hover:border-gray-500 focus:border-blue-500 focus:ring-blue-500/30 cursor-pointer',
        ].join(' ')}
        placeholder={placeholder}
        value={displayValue}
        disabled={disabled}
        onFocus={open}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />

      {isOpen && (
        <ul
          ref={listRef}
          className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded border border-gray-600 bg-gray-850 shadow-xl"
          style={{ backgroundColor: '#1a1f2e' }}
          role="listbox"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-500">No results</li>
          ) : (
            filtered.map((option, i) => (
              <li
                key={getValue(option)}
                role="option"
                aria-selected={getValue(option) === value}
                className={[
                  'px-3 py-1.5 text-sm cursor-pointer',
                  i === highlightedIndex
                    ? 'bg-blue-600 text-white'
                    : getValue(option) === value
                    ? 'bg-gray-700 text-gray-100'
                    : 'text-gray-300 hover:bg-gray-700',
                ].join(' ')}
                onMouseEnter={() => setHighlightedIndex(i)}
                onMouseDown={(e) => {
                  e.preventDefault(); // prevent input blur before click registers
                  select(option);
                }}
              >
                {getLabel(option)}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
