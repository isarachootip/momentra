'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { ItemType, SearchFacets, SearchResultItem } from '@/types';
import { SearchBar } from './search-bar';
import { FacetSidebar } from './facet-sidebar';
import { SearchResults } from './search-results';

export function SearchInterface() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<ItemType | undefined>(undefined);
  const [fromYear, setFromYear] = useState<number | undefined>(undefined);
  const [toYear, setToYear] = useState<number | undefined>(undefined);
  const [circaOnly, setCircaOnly] = useState(false);

  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [totalHits, setTotalHits] = useState(0);
  const [facets, setFacets] = useState<SearchFacets>({ types: [], tags: [], years: [] });
  const [isLoading, setIsLoading] = useState(false);

  const executeSearch = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.set('q', searchTerm.trim());
      if (selectedType) params.set('type', selectedType);
      if (fromYear) params.set('from_year', fromYear.toString());
      if (toYear) params.set('to_year', toYear.toString());
      if (circaOnly) params.set('circa', 'true');

      const res = await fetch(`/api/v1/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
        setTotalHits(data.total_hits || 0);
        setFacets(data.facets || { types: [], tags: [], years: [] });
      }
    } catch (err) {
      console.error('Search request failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, selectedType, fromYear, toYear, circaOnly]);

  useEffect(() => {
    executeSearch();
  }, [executeSearch]);

  const handleReset = () => {
    setSearchTerm('');
    setSelectedType(undefined);
    setFromYear(undefined);
    setToYear(undefined);
    setCircaOnly(false);
  };

  return (
    <div className="w-full space-y-6">
      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        onSearch={executeSearch}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Facet Sidebar */}
        <div className="lg:col-span-1">
          <FacetSidebar
            facets={facets}
            selectedType={selectedType}
            fromYear={fromYear}
            toYear={toYear}
            circaOnly={circaOnly}
            onTypeSelect={setSelectedType}
            onFromYearChange={setFromYear}
            onToYearChange={setToYear}
            onCircaToggle={setCircaOnly}
            onReset={handleReset}
          />
        </div>

        {/* Results Stream */}
        <div className="lg:col-span-3">
          <SearchResults
            results={results}
            totalHits={totalHits}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
