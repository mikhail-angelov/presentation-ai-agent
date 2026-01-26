# Prez AI Presenter

A modern, AI-powered presentation preparation tool built with Next.js 14, TypeScript, and Tailwind CSS.

## Overview

Prez AI Presenter is a web application that helps users create compelling presentations through a guided, step-by-step process. The application provides:

- **Presentation Setup**: Input form for defining topic, audience, duration, and key points
- **User Guides**: Best practices and tips for effective presentations
- **Step-by-Step Flow**: 6-stage presentation preparation process
- **AI Integration**: Generate presentation content using AI
- **Usage Monitoring**: Track API requests and rate limits

## Features

### 1. Modern UI/UX
- **Responsive Design**: Fully responsive interface using Tailwind CSS
- **Card-Based Layout**: Clean, modern card design with shadows and rounded corners
- **Interactive Components**: Hover states, transitions, and interactive elements
- **Mobile-First Approach**: Optimized for all screen sizes
- **Internationalization**: Support for English and Russian languages
- **Toast Notifications**: User feedback with success/error/info messages

### 2. Step-by-Step Presentation Creation
1. **Setup**: Define topic, audience, duration, and key points
2. **Outline Generation**: AI-powered presentation structure creation
3. **Speech Creation**: Convert outline to natural spoken presentation
4. **Slides Creation**: Transform speech into slide content
5. **HTML Slides Generation**: Create interactive HTML presentation
6. **Review & Download**: Preview, edit, and download final presentation

### 3. AI-Powered Content Generation
- **DeepSeek LLM Integration**: Real AI content generation using DeepSeek API
- **Streaming Responses**: Real-time content streaming with progress indicators
- **Multi-Step Generation**: Sequential content generation with context preservation
- **Language Support**: Content generation in multiple languages
- **Error Handling**: Robust error handling with user-friendly messages

### 4. Session Management
- **User Session Tracking**: Automatic session creation and management
- **Action Logging**: Track all user actions for analytics
- **Supabase Integration**: PostgreSQL database for session storage
- **Rate Limiting**: Usage tracking and rate limit enforcement
- **Session Persistence**: Save and load presentation progress

### 5. Advanced UI Components
- **Independent Scrolling Panels**: Left and right panels scroll independently
- **Full Height Utilization**: Components extend to fill available space
- **Editable Content Areas**: All generated content is editable
- **Preview Modals**: Interactive HTML slides preview
- **Progress Tracking**: Visual step completion indicators
- **Regeneration Controls**: Regenerate any step with updated content

### 6. File Management
- **Save/Load Presentations**: Export and import presentation JSON files
- **HTML Export**: Download complete HTML presentations
- **Content Copy**: Copy any content to clipboard
- **Template System**: HTML template and example slides
- **File Size Tracking**: Automatic file size calculation

## Project Structure

```
prez-ai-next/
├── app/
│   ├── api/
│   │   ├── generate-content/          # AI content generation API
│   │   │   └── route.ts
│   │   ├── generate-slides-stream/    # HTML slides streaming API
│   │   │   └── route.ts
│   │   └── sessions/                  # Session management API
│   │       └── route.ts
│   ├── components/
│   │   ├── presentation/              # Presentation step components
│   │   │   ├── PresentationSetup.tsx
│   │   │   ├── OutlineStep.tsx
│   │   │   ├── SpeechStep.tsx
│   │   │   ├── SlidesStep.tsx
│   │   │   ├── HtmlSlidesStep.tsx
│   │   │   ├── PreparationSteps.tsx
│   │   │   ├── UserGuides.tsx
│   │   │   └── StreamingDisplay.tsx
│   │   ├── shared/                    # Shared components
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Toast.tsx
│   │   │   └── SlidesPreviewModal.tsx
│   │   └── monitoring/
│   │       └── AIUsageMonitoring.tsx
│   ├── contexts/                      # React contexts
│   │   └── ToastContext.tsx
│   ├── hooks/                         # Custom hooks
│   │   ├── useSession.ts
│   │   └── useTranslation.ts
│   ├── lib/                           # Business logic
│   │   ├── agent/                     # AI agent integrations
│   │   │   ├── deepseekAgent.ts
│   │   │   ├── prompts.ts
│   │   │   └── yandexML.ts
│   │   └── session/                   # Session management
│   │       ├── store.ts
│   │       └── supabaseStore.ts
│   ├── types/                         # TypeScript definitions
│   │   ├── index.ts
│   │   ├── steps.ts
│   │   └── session.ts
│   ├── page.tsx                       # Main page
│   ├── layout.tsx                     # Root layout
│   └── globals.css                    # Global styles
├── public/
│   ├── locales/                       # i18n translations
│   │   ├── en/
│   │   │   └── common.json
│   │   └── ru/
│   │       └── common.json
│   ├── presentation.html              # HTML template
│   └── example-slides.html            # Example slides
├── scripts/                           # Database scripts
│   ├── create_sessions_schema.sql
│   └── run_supabase_migration.js
├── package.json
├── next.config.ts
├── tsconfig.json
├── vitest.config.ts
├── README.md
└── README_SUPABASE.md
```

## Technical Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript development
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library for consistent UI
- **React Hooks** - State and effect management

### Backend & APIs
- **DeepSeek LLM** - AI content generation via API
- **Supabase** - PostgreSQL database for session management
- **Server-Sent Events (SSE)** - Real-time content streaming
- **REST APIs** - Structured API endpoints for data management

### Development Tools
- **ESLint** - Code linting and quality enforcement
- **Prettier** - Code formatting consistency
- **Vitest** - Testing framework
- **PostCSS** - CSS processing

### Internationalization
- **i18n** - Multi-language support (English/Russian)
- **JSON-based translations** - Easy translation management

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd prez-ai-next
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Integration

The application includes real API endpoints for AI-powered presentation content generation and session management.

### Core API Endpoints

#### 1. **POST /api/generate-content** - AI Content Generation
Generates presentation content using DeepSeek LLM with streaming response.

**Request:**
```json
{
  "topic": "Artificial Intelligence in Healthcare",
  "audience": "Medical professionals",
  "duration": "15",
  "keyPoints": ["Diagnosis assistance", "Treatment optimization", "Patient monitoring"],
  "stepType": "outline|speech|slides",
  "previousContent": "Optional previous step content",
  "language": "en|ru"
}
```

**Response:** Server-Sent Events (SSE) stream with chunks:
```json
data: {"chunk": "Generated content chunk..."}
data: {"done": true, "content": "Full generated content", "tokensUsed": 250, "duration": 1500}
```

#### 2. **POST /api/generate-slides-stream** - HTML Slides Generation
Generates interactive HTML presentation slides with streaming.

**Request:**
```json
{
  "topic": "Presentation Topic",
  "audience": "Target Audience",
  "duration": "10",
  "slidesContent": "Markdown slides content",
  "exampleHtml": "Example HTML template",
  "templateHtml": "Base HTML template",
  "language": "en|ru"
}
```

**Response:** SSE stream with HTML content chunks.

#### 3. **Session Management APIs**
- **GET /api/sessions** - Get current session
- **PUT /api/sessions** - Update session with actions
- **Automatic session creation** on first page load

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DEEPSEEK_API_KEY` | DeepSeek LLM API key | Yes |
| `SUPABASE_URL` | Supabase project URL | Yes (for session storage) |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Yes (for session storage) |
| `YANDEX_API_KEY` | Yandex ML API key | Optional (alternative AI) |

### Database Schema

The application uses Supabase PostgreSQL with the following schema (see `scripts/create_sessions_schema.sql`):

1. **sessions table**: User sessions with metadata
2. **user_actions table**: Tracked user actions and AI usage
3. **Indexes**: Performance optimization for common queries
4. **Views**: Session statistics and recent sessions
5. **Functions**: Automatic cleanup of expired sessions

## Integration with Existing Prez AI

This frontend application is designed to integrate with the existing Prez AI backend (`/Users/ma/repo/prez-ai/index.js`), which provides:

- **DeepSeek LLM Integration** - AI-powered content generation
- **Thinking Critic Tools** - Analyze thought processes
- **Planning Tools** - Create and manage plans
- **MCP Server Support** - Model Context Protocol integration

### Future Integration Points

1. **Real AI Backend**: Replace mock API with actual Prez AI agent calls
2. **Authentication**: Add user accounts and session management
3. **Presentation Storage**: Save and retrieve presentation drafts
4. **Export Features**: Download presentations as PDF, PPTX, or Markdown
5. **Collaboration**: Real-time collaboration features
6. **Templates**: Pre-built presentation templates

## Development

### Key Design Decisions

1. **Component Decomposition**: Modular components for maintainability
2. **Type Safety**: Comprehensive TypeScript definitions
3. **Responsive Design**: Mobile-first approach with Tailwind
4. **Mock APIs**: Simulated backend for development
5. **State Management**: React hooks for local state

### Code Quality

- TypeScript for type safety
- ESLint configuration
- Prettier for code formatting
- Component-based architecture

## Testing

The application can be tested by:

1. **Manual Testing**: Interact with the UI components
2. **API Testing**: Use curl or Postman to test endpoints
3. **Integration Testing**: Test component interactions

Example API test:
```bash
curl -X POST http://localhost:3000/api/generate-content \
  -H "Content-Type: application/json" \
  -d '{"topic": "Test", "audience": "developers", "duration": "15", "keyPoints": ["Point 1"]}'
```

## Deployment

The application can be deployed to:

- **Vercel** (Recommended for Next.js)
- **Netlify**
- **AWS Amplify**
- **Docker** container

### Vercel Deployment

1. Push code to GitHub/GitLab
2. Import project in Vercel
3. Configure environment variables
4. Deploy automatically on push

| Variable | Description | Default |
|----------|-------------|---------|
| `DEEPSEEK_API_KEY` | Your DeepSeek API key | (required) |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- Built with Next.js and Tailwind CSS
- Icons from Lucide React
- Inspired by modern presentation tools
- Integrates with Prez AI backend capabilities
