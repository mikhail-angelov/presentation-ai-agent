import { FileText, Target, Sparkles, Users, Mic } from "lucide-react";
import { UserGuide } from "@/app/types";

const userGuides: UserGuide[] = [
  {
    title: "Start with a Clear Goal",
    description: "Define what you want your audience to learn or do after your presentation",
    icon: <Target className="h-5 w-5" />
  },
  {
    title: "Keep it Simple",
    description: "Focus on 3-5 key points maximum to avoid overwhelming your audience",
    icon: <Sparkles className="h-5 w-5" />
  },
  {
    title: "Engage Your Audience",
    description: "Use stories, questions, and interactive elements to keep attention",
    icon: <Users className="h-5 w-5" />
  },
  {
    title: "Practice Makes Perfect",
    description: "Rehearse multiple times to build confidence and smooth delivery",
    icon: <Mic className="h-5 w-5" />
  }
];

export default function UserGuides() {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="h-7 w-7 text-green-600" />
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Presentation Guides</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {userGuides.map((guide, index) => (
          <div
            key={index}
            className="p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                {guide.icon}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{guide.title}</h3>
                <p className="text-sm text-gray-600">{guide.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
