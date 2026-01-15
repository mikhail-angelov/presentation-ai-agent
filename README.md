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
- Responsive design with Tailwind CSS
- Gradient backgrounds and card-based layout
- Interactive components with hover states
- Mobile-friendly interface

### 2. Presentation Preparation Flow
1. **Define Your Topic** - Clearly articulate presentation subject
2. **Know Your Audience** - Understand who you're presenting to
3. **Structure Your Content** - Organize presentation logically
4. **Design Visuals** - Create compelling slides and visuals
5. **Practice Delivery** - Rehearse your presentation
6. **Final Review** - Polish and perfect your presentation

### 3. AI-Powered Content Generation
- Generate structured presentation outlines
- Customized content based on topic, audience, and duration
- Design and delivery tips
- Mock API integration with realistic response simulation

### 4. Usage Monitoring
- Real-time API request tracking
- Rate limit visualization
- Request status and token usage
- Historical request log

## Project Structure

```
prez-ai-next/
├── app/
│   ├── api/
│   │   └── generate-content/
│   │       └── route.ts          # AI content generation API
│   ├── components/
│   │   ├── presentation/         # Presentation-related components
│   │   │   ├── PresentationSetup.tsx
│   │   │   ├── UserGuides.tsx
│   │   │   └── PreparationSteps.tsx
│   │   ├── monitoring/           # Monitoring components
│   │   │   └── AIUsageMonitoring.tsx
│   │   └── shared/              # Shared components
│   │       └── Header.tsx
│   ├── types/
│   │   └── index.ts             # TypeScript type definitions
│   ├── page.tsx                 # Main page
│   └── layout.tsx               # Root layout
├── public/                      # Static assets
└── package.json                 # Dependencies
```

## Technical Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **React Hooks** - State management

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

The application includes a mock API endpoint at `/api/generate-content` that simulates AI-powered presentation content generation.

### API Endpoints

**POST /api/generate-content**
```json
{
  "topic": "Presentation Topic",
  "audience": "Target Audience",
  "duration": "10",
  "keyPoints": ["Point 1", "Point 2"]
}
```

Response:
```json
{
  "success": true,
  "content": "Generated presentation content...",
  "metadata": {
    "topic": "...",
    "audience": "...",
    "duration": "...",
    "keyPoints": [...],
    "generatedAt": "...",
    "tokensUsed": 250,
    "estimatedReadingTime": "1 minutes"
  }
}
```

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
