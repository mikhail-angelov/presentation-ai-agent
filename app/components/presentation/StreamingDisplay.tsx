"use client";

import { useEffect, useRef } from "react";

interface StreamingDisplayProps {
  isGenerating: boolean;
  streamingContent: string;
}

export default function StreamingDisplay({
  isGenerating,
  streamingContent,
}: StreamingDisplayProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const prevContentLengthRef = useRef(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to bottom when new content is added
  useEffect(() => {
    if (!contentRef.current) return;

    const contentElement = contentRef.current;
    const isAtBottom = 
      contentElement.scrollHeight - contentElement.scrollTop <= contentElement.clientHeight + 100; // 100px threshold
    
    // Clear any existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Only auto-scroll if user is already at the bottom or content just started
    if (isAtBottom || streamingContent.length <= prevContentLengthRef.current) {
      // Use requestAnimationFrame for smooth scrolling
      requestAnimationFrame(() => {
        contentElement.scrollTop = contentElement.scrollHeight;
      });
      
      // Also schedule another scroll after a short delay to handle multiple line updates
      scrollTimeoutRef.current = setTimeout(() => {
        if (contentElement.scrollHeight - contentElement.scrollTop > contentElement.clientHeight + 50) {
          contentElement.scrollTop = contentElement.scrollHeight;
        }
      }, 50);
    }
    
    prevContentLengthRef.current = streamingContent.length;
    
    // Cleanup timeout on unmount
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [streamingContent]);

  if (!isGenerating) return null;

  return (
    <div className="mb-6 bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-3 w-3 bg-blue-600 rounded-full animate-pulse"></div>
        <h3 className="text-lg font-semibold text-gray-900">AI is generating your presentation...</h3>
      </div>
      <div 
        ref={contentRef}
        className="bg-gray-50 rounded-xl p-4 min-h-[200px] max-h-[400px] overflow-y-auto"
      >
        <div className="prose prose-blue max-w-none">
          <pre className="whitespace-pre-wrap font-sans text-gray-800">
            {streamingContent}
            {!streamingContent && "Starting AI generation..."}
            <span className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse"></span>
          </pre>
        </div>
      </div>
      <div className="mt-4 text-sm text-gray-500">
        <p>Please wait while our AI creates a comprehensive presentation plan for you.</p>
      </div>
    </div>
  );
}
