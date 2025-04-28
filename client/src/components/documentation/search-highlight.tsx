import React from 'react';

type SearchHighlightProps = {
  text: string;
  query: string;
};

/**
 * Component to highlight matched search terms within text
 * Renders text with highlighted portions that match the search query
 */
export function SearchHighlight({ text, query }: SearchHighlightProps) {
  // If no query, just return the plain text
  if (!query.trim()) {
    return <span>{text}</span>;
  }
  
  // Prepare for case-insensitive matching
  const lowercaseText = text.toLowerCase();
  const lowercaseQuery = query.toLowerCase();
  
  // If query not found in text, just return the plain text
  if (!lowercaseText.includes(lowercaseQuery)) {
    return <span>{text}</span>;
  }
  
  // Find all occurrences of the query in the text
  const parts: { highlighted: boolean; text: string }[] = [];
  let lastIndex = 0;
  
  // Iterate through the text to find matches
  let currentIndex = lowercaseText.indexOf(lowercaseQuery, 0);
  
  while (currentIndex !== -1) {
    // Add non-highlighted part before the match
    if (currentIndex > lastIndex) {
      parts.push({
        highlighted: false,
        text: text.substring(lastIndex, currentIndex)
      });
    }
    
    // Add highlighted part (matching the query)
    parts.push({
      highlighted: true,
      text: text.substring(currentIndex, currentIndex + query.length)
    });
    
    // Update indices for next iteration
    lastIndex = currentIndex + query.length;
    currentIndex = lowercaseText.indexOf(lowercaseQuery, lastIndex);
  }
  
  // Add any remaining text after the last match
  if (lastIndex < text.length) {
    parts.push({
      highlighted: false,
      text: text.substring(lastIndex)
    });
  }
  
  // Render all parts, with highlighted sections styled differently
  return (
    <span>
      {parts.map((part, index) => (
        part.highlighted ? (
          <span key={index} className="bg-primary/20 text-primary font-medium rounded px-0.5">
            {part.text}
          </span>
        ) : (
          <span key={index}>{part.text}</span>
        )
      ))}
    </span>
  );
}