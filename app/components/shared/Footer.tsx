"use client";

import { BarChart3, Activity, Database, Github } from "lucide-react";
import { RateLimit } from "@/app/types";
import { SessionData } from "@/app/hooks/useSession";

interface FooterProps {
  rateLimit: RateLimit;
  session?: SessionData | null;
}

export default function Footer({ rateLimit, session }: FooterProps) {
  const progressPercentage = (rateLimit.used / rateLimit.limit) * 100;
  
  // Calculate total tokens used in session
  const totalSessionTokens = session?.actions?.reduce((sum, action) => sum + (action.tokensUsed || 0), 0) || 0;
  
  // Get last action from session
  const lastAction = session?.actions && session.actions.length > 0 ? session.actions[0] : null;

  return (
    <footer className="bg-white border-t border-gray-200 py-3 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left side: Rate limit and session info */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Rate limit */}
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-gray-500" />
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">
                  {rateLimit.used}/{rateLimit.limit}
                </span>
                <div className="w-16 bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${
                      progressPercentage > 90 ? "bg-red-600" : 
                      progressPercentage > 70 ? "bg-yellow-500" : "bg-green-600"
                    }`}
                    style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Session info */}
            {session && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Database className="h-3 w-3 text-blue-500" />
                  <span className="text-xs text-gray-600">
                    {session.actions.length} actions
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Activity className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-gray-600">
                    {totalSessionTokens.toLocaleString()} tokens
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right side: Last action info and GitHub link */}
          <div className="flex items-center gap-4">
            {/* Last action info */}
            {lastAction ? (
              <div className="text-right">
                <div className="text-xs font-medium text-gray-700">
                  Last: {lastAction.type?.replace(/_/g, ' ')}
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <span>{lastAction.tokensUsed?.toLocaleString() || 0} tokens</span>
                  <span>•</span>
                  <span>{lastAction.duration || 0}ms</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-500">
                No actions yet
              </div>
            )}
            
            {/* GitHub link */}
            <a 
              href="https://github.com/mikhail-angelov/presentation-ai-agent" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors"
              title="View on GitHub"
            >
              <Github className="h-4 w-4" />
              <span className="text-xs hidden sm:inline">GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
