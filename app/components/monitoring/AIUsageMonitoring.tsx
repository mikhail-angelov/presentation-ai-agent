"use client";

import { BarChart3, Clock, CheckCircle, AlertCircle, Database, Activity } from "lucide-react";
import { LLMRequest, RateLimit } from "@/app/types";
import { SessionData } from "@/app/hooks/useSession";

interface AIUsageMonitoringProps {
  rateLimit: RateLimit;
  llmRequests: LLMRequest[];
  session?: SessionData | null;
}

export default function AIUsageMonitoring({ rateLimit, llmRequests, session }: AIUsageMonitoringProps) {
  const progressPercentage = (rateLimit.used / rateLimit.limit) * 100;
  const resetTime = new Date(rateLimit.resetTime);
  const timeUntilReset = Math.max(0, Math.floor((rateLimit.resetTime - Date.now()) / 1000 / 60)); // minutes

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="h-7 w-7 text-orange-600" />
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">AI Usage Monitoring</h2>
      </div>

      <div className="mb-6 p-4 bg-gray-50 rounded-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Rate Limit</span>
          </div>
          <span className="text-sm font-medium text-gray-900">
            {rateLimit.used} / {rateLimit.limit} requests
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
          <div
            className={`h-2.5 rounded-full ${
              progressPercentage > 90 ? "bg-red-600" : 
              progressPercentage > 70 ? "bg-yellow-500" : "bg-green-600"
            }`}
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>0%</span>
          <span>Resets in {timeUntilReset} min</span>
          <span>100%</span>
        </div>
      </div>

      {session && (
        <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <div className="flex items-center gap-2 mb-3">
            <Database className="h-4 w-4 text-blue-600" />
            <h3 className="font-semibold text-blue-900">Session Analytics</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-3 rounded-lg border border-blue-100">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="h-3 w-3 text-blue-500" />
                <span className="text-xs font-medium text-blue-700">Total Actions</span>
              </div>
              <div className="text-xl font-bold text-blue-900">{session.actions.length}</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-blue-100">
              <div className="text-xs font-medium text-blue-700 mb-1">Session Duration</div>
              <div className="text-xl font-bold text-blue-900">
                {Math.round((new Date().getTime() - new Date(session.createdAt).getTime()) / 1000 / 60)}m
              </div>
            </div>
          </div>
          {session.actions.length > 0 && (
            <div className="mt-3 pt-3 border-t border-blue-200">
              <div className="text-xs font-medium text-blue-700 mb-2">Recent Actions</div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {session.actions.slice(-3).map((action, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <span className="text-blue-900 truncate">{action.type}</span>
                    <span className="text-blue-600">
                      {new Date(action.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Recent API Requests</h3>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {llmRequests.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No API requests yet. Start preparing your presentation!
            </div>
          ) : (
            llmRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {request.status === "success" ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : request.status === "error" ? (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  ) : (
                    <div className="h-4 w-4 rounded-full bg-yellow-500"></div>
                  )}
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {request.endpoint}
                    </div>
                    <div className="text-xs text-gray-500">
                      {request.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {request.tokensUsed} tokens
                  </div>
                  <div className="text-xs text-gray-500">
                    {request.duration}ms
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
