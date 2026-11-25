import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  subLabel?: string;
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: (string | SelectOption)[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  dropdownClassName?: string;
  id?: string;
  searchPlaceholder?: string;
  align?: 'right' | 'left';
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'اختر...',
  disabled = false,
  className = '',
  triggerClassName = '',
  dropdownClassName = '',
  id,
  searchPlaceholder = 'بحث...',
  align = 'right'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Normalize options to SelectOption format
  const normalizedOptions: SelectOption[] = options.map((opt) => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt };
    }
    return opt;
  });

  // Find currently selected option
  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  // Filter options based on search query
  const filteredOptions = normalizedOptions.filter((opt) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const labelMatch = opt.label.toLowerCase().includes(q);
    const valueMatch = opt.value.toLowerCase().includes(q);
    const subLabelMatch = opt.subLabel ? opt.subLabel.toLowerCase().includes(q) : false;
    return labelMatch || valueMatch || subLabelMatch;
  });

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div ref={containerRef} className={`relative inline-block w-full text-right ${className}`} id={id}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            if (!isOpen) setSearchQuery('');
          }
        }}
        className={`w-full flex items-center justify-between gap-1.5 px-2.5 py-1.5 bg-[#fffef0] border border-slate-300 focus:border-sky-500 rounded-lg text-xs font-bold text-slate-800 focus:outline-none cursor-pointer shadow-inner transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${triggerClassName}`}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : <span className="text-slate-400 font-normal">{placeholder}</span>}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-sky-600' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute z-50 mt-1 w-full min-w-[170px] max-w-xs ${align === 'left' ? 'left-0' : 'right-0'} bg-[#fffef0] border border-slate-300 rounded-xl shadow-2xl overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100 ${dropdownClassName}`}
          style={{ maxHeight: '280px' }}
        >
          {/* Search Box Header */}
          <div className="p-1.5 border-b border-slate-200 sticky top-0 bg-[#fffef0] z-10">
            <div className="relative flex items-center">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pr-7 pl-2 py-1 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-sky-500 font-bold text-slate-900 shadow-inner"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && filteredOptions.length > 0) {
                    e.preventDefault();
                    handleSelect(filteredOptions[0].value);
                  }
                }}
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2 pointer-events-none" />
            </div>
          </div>

          {/* Options List */}
          <div className="overflow-y-auto max-h-48 divide-y divide-slate-200/50">
            {filteredOptions.length === 0 ? (
              <div className="p-2.5 text-center text-xs text-slate-400 font-medium">
                لا توجد نتائج مطابقة
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full text-right px-2.5 py-1.5 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-sky-600 text-white font-bold'
                        : 'text-slate-800 hover:bg-sky-50 font-semibold'
                    }`}
                  >
                    <div className="flex flex-col text-right truncate">
                      <span className="truncate">{opt.label}</span>
                      {opt.subLabel && (
                        <span className={`text-[10px] ${isSelected ? 'text-sky-100' : 'text-slate-400'}`}>
                          {opt.subLabel}
                        </span>
                      )}
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0 mr-1.5 text-white" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
