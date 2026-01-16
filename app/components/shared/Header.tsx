import { Presentation, Zap, User } from "lucide-react";
import { SessionData } from "@/app/hooks/useSession";

interface HeaderProps {
  session?: SessionData | null;
}

export default function Header({ session }: HeaderProps) {
  return (
    <header className="mb-8 md:mb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Presentation className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Make your presenter</h1>
            <p className="text-gray-600">AI-powered tool</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {session && (
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full">
              <User className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">
                Session: {session.actions.length} actions
              </span>
            </div>
          )}
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm">
            <Zap className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">AI Assistant Active</span>
          </div>
          <div className="px-4 py-2 bg-blue-600 text-white rounded-full font-medium">
            Beta
          </div>
        </div>
      </div>
    </header>
  );
}
