'use client';

import React from 'react';
import { Search, X, ExternalLink, FileText, Calendar } from 'lucide-react';
import Link from 'next/link';
import { cn } from '../../../lib/utils';
import { searchContent, type SearchableContent } from '../../../lib/search';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResult extends SearchableContent {
  score?: number;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [searchableContent, setSearchableContent] = React.useState<
    SearchableContent[] | null
  >(null);
  const [selectedIndex, setSelectedIndex] = React.useState(-1);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const resultsRef = React.useRef<HTMLDivElement>(null);

  const isSearching = searchQuery.trim() !== '' && searchableContent === null;

  // Fetched on first open instead of shipped with every page: the index holds
  // the body text of the whole site, and Next prefetches page payloads.
  React.useEffect(() => {
    if (!isOpen || searchableContent !== null) return;

    let cancelled = false;

    fetch('/api/search')
      .then(response => response.json())
      .then(json => {
        if (!cancelled) setSearchableContent(json.success ? json.data : []);
      })
      .catch(() => {
        if (!cancelled) setSearchableContent([]);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, searchableContent]);

  const performSearch = React.useCallback(
    (query: string) => {
      if (!query.trim() || searchableContent === null) {
        setResults([]);
        return;
      }

      setResults(searchContent(searchableContent, query));
      setSelectedIndex(-1);
    },
    [searchableContent],
  );

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = '';
      setSearchQuery('');
      setResults([]);
      setSelectedIndex(-1);
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  React.useEffect(() => {
    performSearch(searchQuery);
    setSelectedIndex(-1);
  }, [searchQuery, performSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      const selectedResult = results[selectedIndex];
      if (selectedResult) {
        window.location.href = selectedResult.url;
        onClose();
      }
    }
  };

  React.useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.children[
        selectedIndex + 1
      ] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  }, [selectedIndex]);

  const getDescription = (item: SearchableContent) =>
    (item.intro ?? item.body ?? item.heading ?? '').slice(0, 200);

  const getResultMetadata = (result: SearchableContent) => {
    const urlParts = result.url.toLowerCase().split('/').reverse();
    for (const part of urlParts) {
      if (part.includes('event'))
        return {
          icon: <Calendar size={16} className='text-green-500 mt-1' />,
          label: 'Event',
          className: 'bg-green-100 text-green-700',
        };
      else if (part.includes('news'))
        return {
          icon: <FileText size={16} className='text-blue-500 mt-1' />,
          label: 'News',
          className: 'bg-blue-100 text-blue-700',
        };
    }

    return {
      icon: <ExternalLink size={16} className='text-gray-500 mt-1' />,
      label: 'Page',
      className: 'bg-gray-100 text-gray-700',
    };
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50'>
      <div className='absolute inset-0 bg-black/50 backdrop-blur-sm' onClick={onClose} />

      <div className='absolute top-0 left-0 w-full h-full flex items-start justify-center pt-20 px-4'>
        <div className='w-full max-w-2xl bg-white rounded-lg shadow-xl overflow-hidden'>
          <div className='relative border-b border-gray-200'>
            <Search
              size={20}
              className='absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400'
            />
            <input
              ref={inputRef}
              type='text'
              placeholder='Search pages...'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className='w-full pl-12 pr-12 py-4 text-lg bg-transparent border-none outline-none'
            />
            <button
              onClick={onClose}
              className='absolute right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-lg hover:bg-gray-100 transition-colors'
            >
              <X size={20} className='text-gray-400' />
            </button>
          </div>

          <div className='max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400 scrollbar-track-gray-100'>
            {searchQuery && (
              <>
                {isSearching ?
                  <div className='p-8 text-center'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto'></div>
                    <p className='mt-4 text-gray-500'>Searching...</p>
                  </div>
                : results.length > 0 ?
                  <div ref={resultsRef} className='p-2'>
                    <div className='mb-2 px-2 py-1 text-xs text-gray-500'>
                      {results.length} result{results.length !== 1 ? 's' : ''} found
                    </div>
                    {results.map((result, index) => {
                      const metadata = getResultMetadata(result);
                      const description = getDescription(result);

                      return (
                        <Link
                          key={result.key}
                          href={result.url}
                          onClick={onClose}
                          className={cn(
                            'block p-4 rounded-lg transition-colors',
                            selectedIndex === index ?
                              'bg-blue-50 border-2 border-blue-200'
                            : 'hover:bg-gray-50',
                          )}
                        >
                          <div className='flex items-start gap-3'>
                            {metadata.icon}
                            <div className='flex-1 min-w-0'>
                              <h3 className='font-semibold text-gray-900 truncate'>
                                {result.heading || result.displayName}
                              </h3>
                              {description && (
                                <p
                                  className='text-sm text-gray-600 mt-1'
                                  style={{
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                  }}
                                >
                                  {description}
                                </p>
                              )}
                              <div className='flex items-center gap-4 mt-2'>
                                <span
                                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${metadata.className}`}
                                >
                                  {metadata.label}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                : <div className='p-8 text-center'>
                    <p className='text-gray-500'>No results found for "{searchQuery}"</p>
                    <p className='text-sm text-gray-400 mt-2'>
                      Try searching for different keywords
                    </p>
                  </div>
                }
              </>
            )}

            {!searchQuery && (
              <div className='p-8 text-center'>
                <Search size={48} className='mx-auto text-gray-300 mb-4' />
                <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                  Search Stride
                </h3>
                <p className='text-gray-500'>Find pages and content across the site</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
