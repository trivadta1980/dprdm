import { useState, useEffect, useMemo } from 'react';
import { documentationContent, DocumentationSection, DocumentationSubsection } from '@/data/documentation-content';

// Define the structure for search results
export type SearchResult = {
  tabId: string;
  sectionId: string;
  subsectionId?: string;
  title: string;
  content: string;
  snippet: string;
  matchScore: number;
};

// Utility function to create a snippet around the matched text
function createSnippet(text: string, query: string, maxLength: number = 200): string {
  const lowercaseText = text.toLowerCase();
  const lowercaseQuery = query.toLowerCase();
  
  const index = lowercaseText.indexOf(lowercaseQuery);
  if (index === -1) return text.substring(0, maxLength) + '...';
  
  const startIndex = Math.max(0, index - 50);
  const endIndex = Math.min(text.length, index + query.length + 100);
  
  let snippet = text.substring(startIndex, endIndex);
  
  // Add ellipsis if we're not at the beginning/end
  if (startIndex > 0) snippet = '...' + snippet;
  if (endIndex < text.length) snippet = snippet + '...';
  
  return snippet;
}

// Calculate match score based on various factors
function calculateMatchScore(
  query: string, 
  title: string, 
  content: string, 
  isMainSection: boolean
): number {
  const lowercaseQuery = query.toLowerCase();
  const lowercaseTitle = title.toLowerCase();
  const lowercaseContent = content.toLowerCase();
  
  let score = 0;
  
  // Title matches are weighted higher
  if (lowercaseTitle.includes(lowercaseQuery)) {
    score += 100;
    
    // Exact title match is highest priority
    if (lowercaseTitle === lowercaseQuery) {
      score += 200;
    }
    
    // Title starts with query
    if (lowercaseTitle.startsWith(lowercaseQuery)) {
      score += 50;
    }
  }
  
  // Content matches
  if (lowercaseContent.includes(lowercaseQuery)) {
    score += 50;
    
    // Calculate frequency of match in content
    const matchCount = (lowercaseContent.match(new RegExp(lowercaseQuery, 'g')) || []).length;
    score += matchCount * 5;
  }
  
  // Main sections are slightly more important than subsections
  if (isMainSection) {
    score += 20;
  }
  
  return score;
}

/**
 * Custom hook for searching through documentation content
 * @param query The search query string
 * @returns Object containing search results and search status
 */
export function useDocumentationSearch(query: string) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Debounce mechanism to avoid excessive searching while typing
  const debouncedQuery = useMemo(() => {
    return query.trim();
  }, [query]);
  
  useEffect(() => {
    // Don't search if query is empty
    if (!debouncedQuery) {
      setResults([]);
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    
    // Perform the search
    const searchResults: SearchResult[] = [];
    
    // Loop through all tabs and their content
    Object.entries(documentationContent).forEach(([tabId, sections]) => {
      sections.forEach((section) => {
        // Check main section
        const mainSectionScore = calculateMatchScore(
          debouncedQuery, 
          section.title, 
          section.content, 
          true
        );
        
        if (mainSectionScore > 0) {
          searchResults.push({
            tabId,
            sectionId: section.id,
            title: section.title,
            content: section.content,
            snippet: createSnippet(section.content, debouncedQuery),
            matchScore: mainSectionScore
          });
        }
        
        // Check subsections if available
        if (section.subsections) {
          section.subsections.forEach((subsection) => {
            const subsectionScore = calculateMatchScore(
              debouncedQuery,
              subsection.title,
              subsection.content,
              false
            );
            
            if (subsectionScore > 0) {
              searchResults.push({
                tabId,
                sectionId: section.id,
                subsectionId: subsection.id,
                title: subsection.title,
                content: subsection.content,
                snippet: createSnippet(subsection.content, debouncedQuery),
                matchScore: subsectionScore
              });
            }
          });
        }
      });
    });
    
    // Sort results by match score (highest first)
    searchResults.sort((a, b) => b.matchScore - a.matchScore);
    
    setResults(searchResults);
    setIsSearching(false);
  }, [debouncedQuery]);
  
  return {
    results,
    isSearching,
    hasResults: results.length > 0,
    query: debouncedQuery
  };
}