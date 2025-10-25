# HR-Agentic-System

An AI-powered HR interview platform built with React 19, Tanstack Router, Tailwind 4, Clerk, Convex DB, ElevenLabs Agents Platform, and react-i18next for internationalization.

## Features

- **Authentication**: Separate roles for HR managers and candidates using Clerk
- **Dynamic Question Generation**: AI-powered interview question generation based on job descriptions
- **AI-Powered Interviews**: Real-time voice conversations with ElevenLabs AI agents
- **Fallback Interview Flow**: Manual interview mode with audio recording when ElevenLabs is not configured
- **Data Management**: Store and manage job descriptions, questions, and interview responses
- **Responsive Design**: Clean, minimal interface for desktop and mobile
- **Internationalization**: Multi-language support with react-i18next (currently English)

## Project Structure

The project is organized as a monorepo using Turborepo:

- `apps/web`: React 19 application with Tanstack Router and Tailwind 4
- `apps/api`: Python FastAPI application for AI question generation
- `packages/ui`: Shared UI components
- `packages/eslint-config`: Shared ESLint configuration
- `packages/typescript-config`: Shared TypeScript configuration

## Internationalization (i18n)

The application uses react-i18next for internationalization with the following structure:

- `apps/web/src/i18n/`: Translation configuration and setup
- `apps/web/src/i18n/locales/en.json`: English translation keys
- All hardcoded text has been extracted to translation files
- Translation keys follow a hierarchical structure (e.g., `common.loading`, `header.hrManager`)

### Adding New Text

When adding new text to the application:
1. Add the translation key to `apps/web/src/i18n/locales/en.json`
2. Use the `useTranslation` hook in your component
3. Replace hardcoded text with `t('translation.key')`

Example:
```typescript
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { t } = useTranslation()
  return <h1>{t('common.loading')}</h1>
}
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- pnpm
- Python 3.9+
- OpenAI API key (for AI question generation)
- ElevenLabs API key and Agent ID (for AI-powered interviews)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/HR-Agentic-System.git
   cd HR-Agentic-System
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up the Python API:
   ```bash
   cd apps/api
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

4. Create environment files:
   - Create `.env.local` in `apps/web` with your keys:
     ```
     VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key
     VITE_CONVEX_URL=your_convex_url
     VITE_API_URL=http://localhost:8000
     
     # ElevenLabs Configuration (for AI-powered interviews)
     VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key
     VITE_ELEVENLABS_AGENT_ID=your_agent_id
     VITE_ELEVENLABS_SERVER_LOCATION=us
     VITE_ELEVENLABS_VOICE_ID=your_voice_id
     
     # AWS Configuration (for file uploads)
     VITE_AWS_REGION=your_aws_region
     VITE_AWS_ACCESS_KEY_ID=your_aws_access_key
     VITE_AWS_SECRET_ACCESS_KEY=your_aws_secret_key
     ```
   - Create `.env` in `apps/api` with your OpenAI API key:
     ```
     OPENAI_API_KEY=your_openai_key
     ```

### Running the Application

1. Start the web application:
   ```bash
   cd apps/web
   pnpm dev
   ```

2. Start the Convex backend:
   ```bash
   cd apps/web
   npx convex dev
   ```

3. Start the Python API:
   ```bash
   cd apps/api
   uvicorn app.main:app --reload
   ```

4. Open your browser and navigate to `http://localhost:3000`

## ElevenLabs AI Interview Integration

The platform uses ElevenLabs Agents Platform to conduct AI-powered interviews by default. Here's how it works:

### Interview Flow Behavior

1. **ElevenLabs Enabled (Default)**: When `VITE_ELEVENLABS_AGENT_ID` is configured, the system automatically uses ElevenLabs AI agents for interviews
   - Real-time voice conversation with AI interviewer
   - Automatic question progression based on predefined questions
   - Professional voice synthesis and audio recording
   - Seamless interview experience with progress tracking

2. **Fallback Mode**: When ElevenLabs is not configured, the system falls back to manual interview mode
   - Traditional question-by-question flow
   - Manual audio recording for each response
   - Text-to-speech for question delivery
   - Manual progression through questions

### Setting Up ElevenLabs

1. **Get ElevenLabs API Key**:
   - Sign up at [ElevenLabs](https://elevenlabs.io)
   - Go to Settings > API Keys
   - Create a new API key

2. **Create an Agent**:
   - Go to [ElevenLabs Agents Platform](https://elevenlabs.io/app/agents)
   - Create a new agent for interviews
   - Configure the agent with professional interview prompts
   - Copy the Agent ID

3. **Configure Environment Variables**:
   ```bash
   VITE_ELEVENLABS_API_KEY=your_api_key
   VITE_ELEVENLABS_AGENT_ID=your_agent_id
   VITE_ELEVENLABS_SERVER_LOCATION=us  # or "eu-residency", "in-residency", "global"
   ```

### Agent Configuration Recommendations

When setting up your ElevenLabs agent, use these settings:

- **Connection Type**: WebSocket
- **Voice**: Choose a professional, clear voice
- **Language**: English
- **Prompt**: Configure to conduct professional interviews
- **Behavior**: Sequential question asking with natural conversation flow

### Dynamic Variables

The system automatically passes dynamic variables to your ElevenLabs agent by including them directly in the prompt and first message:

- **`candidate_name`**: Extracted from the candidate's email address (part before @)
- **`job_title`**: The title of the job position being interviewed for

These variables are dynamically inserted into the agent's prompt and first message at runtime.

**Example Agent Prompt:**
```
You are conducting a professional interview for the position: [Job Title].

Hello [Candidate Name]! I'm your AI interviewer for the [Job Title] position. 
I'll be asking you several questions today. Please speak clearly and take your time with each response.
```

**Example First Message:**
```
Hello [Candidate Name]! I'm your AI interviewer for the [Job Title] position. 
I'll be asking you several questions today. Please speak clearly and take your time with each response. Let's begin!
```

The system automatically replaces these placeholders with the actual candidate name and job title when starting the interview session.

## Authentication Flow

1. Users can sign up as either HR managers or candidates
2. HR managers can create company profiles and job descriptions
3. Candidates can apply for jobs and take interviews

## Development

### Adding New Features

1. Create a new branch: `git checkout -b feature/your-feature-name`
2. Implement your changes
3. Test thoroughly
4. Create a pull request

### Running Tests

```bash
pnpm test
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
