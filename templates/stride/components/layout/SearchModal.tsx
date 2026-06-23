'use client';

import React from 'react';
import { Search, X, Calendar, MapPin, FileText, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { cn } from '../../lib/utils';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResult {
  id: string;
  title: string;
  description?: string;
  type: 'page' | 'news' | 'event';
  url: string;
  date?: string;
  location?: string;
  image?: string;
}

const newsEventsData = {
  news: [
    {
      id: 1,
      title: 'Stride raises Series B to expand global fitness community',
      img: '/sports-1.jpg',
      date: '2026-02-01',
      summary:
        'We are thrilled to announce our latest funding round led by top-tier investors to accelerate our mission of making the world move more.',
    },
    {
      id: 2,
      title: 'Introducing Stride Stats 2.0 with AI coaching',
      img: '/sports-2.jpg',
      date: '2026-01-15',
      summary:
        'Our biggest update yet includes automated form analysis, recovery recommendations, and predictive race pacing.',
    },
    {
      id: 3,
      title: 'Stride named Top 10 Fitness App of 2025',
      img: '/sports-3.jpg',
      date: '2025-12-10',
      summary:
        'FitTech Magazine has recognized Stride as a leading solution for endurance athletes in their annual awards.',
    },
  ],
  events: [
    {
      id: 1,
      title: 'Global Running Summit 2026',
      date: '2026-04-20',
      location: 'San Francisco, CA',
      description:
        'Join us for a day of keynotes and workshops on the future of endurance sports and wearable technology.',
    },
    {
      id: 2,
      title: 'Stride Community Marathon',
      date: '2026-06-15',
      location: 'London, UK',
      description:
        'Connect with other Stride athletes, break your personal bests, and celebrate with the community.',
    },
  ],
};

const allPages: SearchResult[] = [
  {
    id: 'features',
    title: 'Features',
    description:
      'Discover all the powerful features that make Stride the perfect training companion',
    type: 'page',
    url: '/features',
  },
  {
    id: 'challenges',
    title: 'Challenges',
    description: 'Take on community challenges and push your limits with fellow athletes',
    type: 'page',
    url: '/challenges',
  },
  {
    id: 'subscriptions',
    title: 'Subscriptions',
    description: 'Choose the perfect plan for your training needs',
    type: 'page',
    url: '/subscriptions',
  },
  {
    id: 'about',
    title: 'About Us',
    description:
      'Learn about our mission to help everyone reach their athletic potential',
    type: 'page',
    url: '/about',
  },
  {
    id: 'contact',
    title: 'Contact Us',
    description: 'Get in touch with our team',
    type: 'page',
    url: '/about/contact',
  },
  {
    id: 'coaches',
    title: 'Become a Coach',
    description: 'Join our network of professional coaches and trainers',
    type: 'page',
    url: '/about/coaches',
  },
  {
    id: 'management',
    title: 'Management',
    description: 'Meet our leadership team',
    type: 'page',
    url: '/about/management',
  },
  {
    id: 'reseller',
    title: 'Reseller Program',
    description: 'Partner with us to bring Stride to more athletes',
    type: 'page',
    url: '/about/reseller',
  },
];

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(-1);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const resultsRef = React.useRef<HTMLDivElement>(null);

  // Transform news and events data into search results
  const newsResults: SearchResult[] = React.useMemo(
    () =>
      newsEventsData.news.map(item => ({
        id: `news-${item.id}`,
        title: item.title,
        description: item.summary,
        type: 'news' as const,
        url: `/about/news-events/news/${item.id}`,
        date: item.date,
        image: item.img,
      })),
    [],
  );

  const eventResults: SearchResult[] = React.useMemo(
    () =>
      newsEventsData.events.map(item => ({
        id: `event-${item.id}`,
        title: item.title,
        description: item.description,
        type: 'event' as const,
        url: `/about/news-events/events/${item.id}`,
        date: item.date,
        location: item.location,
      })),
    [],
  );

  const allSearchableContent = React.useMemo(
    () => [...allPages, ...newsResults, ...eventResults],
    [newsResults, eventResults],
  );

  const performSearch = React.useCallback(
    (query: string) => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setIsSearching(true);

      // Simulate search delay for better UX
      setTimeout(() => {
        const searchTerm = query.toLowerCase();
        const filtered = allSearchableContent.filter(
          item =>
            item.title.toLowerCase().includes(searchTerm) ||
            item.description?.toLowerCase().includes(searchTerm) ||
            item.location?.toLowerCase().includes(searchTerm),
        );

        // Sort results: exact title matches first, then description matches
        const sorted = filtered.sort((a, b) => {
          const aExactTitle = a.title.toLowerCase().includes(searchTerm);
          const bExactTitle = b.title.toLowerCase().includes(searchTerm);

          if (aExactTitle && !bExactTitle) return -1;
          if (!aExactTitle && bExactTitle) return 1;
          return 0;
        });

        setResults(sorted); // Show all matching results
        setSelectedIndex(-1); // Reset selection
        setIsSearching(false);
      }, 200);
    },
    [allSearchableContent],
  );

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Focus input with slight delay to ensure modal is rendered
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
    setSelectedIndex(-1); // Reset selection when query changes
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

  // Scroll selected item into view
  React.useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.children[
        selectedIndex + 1
      ] as HTMLElement; // +1 for result count
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  }, [selectedIndex]);

  const getResultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'news':
        return <FileText size={16} className='text-blue-500 mt-1' />;
      case 'event':
        return <Calendar size={16} className='text-green-500 mt-1' />;
      case 'page':
        return <ExternalLink size={16} className='text-gray-500 mt-1' />;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50'>
      {/* Backdrop */}
      <div className='absolute inset-0 bg-black/50 backdrop-blur-sm' onClick={onClose} />

      {/* Search Modal */}
      <div className='absolute top-0 left-0 w-full h-full flex items-start justify-center pt-20 px-4'>
        <div className='w-full max-w-2xl bg-white rounded-lg shadow-xl overflow-hidden'>
          {/* Search Input */}
          <div className='relative border-b border-gray-200'>
            <Search
              size={20}
              className='absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400'
            />
            <input
              ref={inputRef}
              type='text'
              placeholder='Search pages, news, events...'
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

          {/* Search Results */}
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
                    {results.map((result, index) => (
                      <Link
                        key={result.id}
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
                          {getResultIcon(result.type)}
                          <div className='flex-1 min-w-0'>
                            <h3 className='font-semibold text-gray-900 truncate'>
                              {result.title}
                            </h3>
                            {result.description && (
                              <p
                                className='text-sm text-gray-600 mt-1'
                                style={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}
                              >
                                {result.description}
                              </p>
                            )}
                            <div className='flex items-center gap-4 mt-2'>
                              <span
                                className={cn(
                                  'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                                  result.type === 'page' && 'bg-gray-100 text-gray-700',
                                  result.type === 'news' && 'bg-blue-100 text-blue-700',
                                  result.type === 'event' &&
                                    'bg-green-100 text-green-700',
                                )}
                              >
                                {result.type === 'page' ?
                                  'Page'
                                : result.type === 'news' ?
                                  'News'
                                : 'Event'}
                              </span>
                              {result.date && (
                                <span className='text-xs text-gray-500 flex items-center gap-1'>
                                  <Calendar size={12} />
                                  {formatDate(result.date)}
                                </span>
                              )}
                              {result.location && (
                                <span className='text-xs text-gray-500 flex items-center gap-1'>
                                  <MapPin size={12} />
                                  {result.location}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                : <div className='p-8 text-center'>
                    <p className='text-gray-500'>No results found for "{searchQuery}"</p>
                    <p className='text-sm text-gray-400 mt-2'>
                      Try searching for features, news, events, or pages
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
                <p className='text-gray-500'>
                  Find pages, news articles, events, and more
                </p>
                <div className='mt-6 flex flex-wrap gap-2 justify-center'>
                  {['Features', 'Challenges', 'Events', 'News', 'About'].map(
                    suggestion => (
                      <button
                        key={suggestion}
                        onClick={() => setSearchQuery(suggestion)}
                        className='px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors'
                      >
                        {suggestion}
                      </button>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
