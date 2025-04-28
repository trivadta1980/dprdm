import React from 'react';
import { SearchResult } from '@/hooks/use-documentation-search';
import { SearchHighlight } from './search-highlight';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, FolderSearch } from 'lucide-react';

type SearchResultsProps = {
  results: SearchResult[];
  query: string;
  onSelectResult: (tabId: string, sectionId: string, subsectionId?: string) => void;
};

/**
 * Component to display search results
 * Shows a list of search results with highlighted matches and section navigation
 */
export function SearchResults({ results, query, onSelectResult }: SearchResultsProps) {
  // If no results, show a message
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FolderSearch className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No results found</h3>
        <p className="text-muted-foreground mt-2">
          Try using different keywords or check your spelling
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">
          {results.length} {results.length === 1 ? 'result' : 'results'} for "{query}"
        </h3>
      </div>
      
      <div className="space-y-4">
        {results.map((result, index) => (
          <Card key={`${result.sectionId}-${result.subsectionId || ''}-${index}`}>
            <CardContent className="p-4">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <span className="capitalize">{result.tabId.replace(/-/g, ' ')}</span>
                  <ChevronRight className="h-4 w-4 mx-1" />
                  <span>{result.title}</span>
                </div>
                
                <h4 className="text-md font-medium">
                  <SearchHighlight text={result.title} query={query} />
                </h4>
                
                <p className="text-sm text-muted-foreground">
                  <SearchHighlight text={result.snippet} query={query} />
                </p>
                
                <div className="flex justify-end mt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onSelectResult(result.tabId, result.sectionId, result.subsectionId)}
                    className="text-xs"
                  >
                    View Section
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}