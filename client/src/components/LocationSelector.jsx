import { useEffect, useRef, useState } from 'react';
import { locationsApi } from '../api/locations.js';
import useDebounce from '../hooks/useDebounce.js';

export default function LocationSelector({
  id = 'location',
  name = 'location',
  value = '',
  onChange,
  onBlur,
  className = '',
  placeholder = 'Search or enter location (e.g. Bandra, Mumbai)',
  disabled = false,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const containerRef = useRef(null);
  const selectedRef = useRef(false);

  const debouncedValue = useDebounce(value, 300);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions when debounced text changes
  useEffect(() => {
    // If the user just clicked a suggestion, don't re-trigger search
    if (selectedRef.current) {
      selectedRef.current = false;
      return;
    }

    const query = (debouncedValue || '').trim();
    if (query.length < 2) {
      setSuggestions([]);
      setLoading(false);
      setHasSearched(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    locationsApi
      .search(query, controller.signal)
      .then((data) => {
        setSuggestions(Array.isArray(data) ? data : []);
        setHasSearched(true);
        setIsOpen(true);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setSuggestions([]);
          setHasSearched(true);
        }
      })
      .finally(() => {
        setLoading(false);
      });

    return () => controller.abort();
  }, [debouncedValue]);

  const handleSelect = (location) => {
    selectedRef.current = true;
    setIsOpen(false);
    setSuggestions([]);
    if (onChange) {
      onChange(location);
    }
  };

  const handleChange = (e) => {
    selectedRef.current = false;
    if (onChange) {
      onChange(e.target.value);
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <input
        id={id}
        name={name}
        type="text"
        value={value}
        onChange={handleChange}
        onFocus={() => {
          if (suggestions.length > 0 && (value || '').trim().length >= 2) {
            setIsOpen(true);
          }
        }}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        className={className}
      />

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-700/80 rounded-xl shadow-lg overflow-hidden max-h-60 overflow-y-auto">
          {loading && (
            <div className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
              Searching locations…
            </div>
          )}

          {!loading && suggestions.length > 0 && (
            <ul className="m-0 p-0 list-none divide-y divide-slate-100 dark:divide-slate-800">
              {suggestions.map((item, idx) => (
                <li
                  key={idx}
                  onClick={() => handleSelect(item)}
                  className="px-4 py-2.5 text-xs text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  {item}
                </li>
              ))}
            </ul>
          )}

          {!loading && hasSearched && suggestions.length === 0 && (
            <div className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 text-center">
              No locations found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
