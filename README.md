# HR-Agentic-System

An AI-powered HR interview platform built with React 19, Tanstack Router, Tailwind 4, Clerk, and Convex DB.

## Features

- **Authentication**: Separate roles for HR managers and candidates using Clerk
- **Dynamic Question Generation**: AI-powered interview question generation based on job descriptions
- **Interview Flow**: Sequential questions with audio responses
- **Data Management**: Store and manage job descriptions, questions, and interview responses
- **Responsive Design**: Clean, minimal interface for desktop and mobile

## Project Structure

The project is organized as a monorepo using Turborepo:

- `apps/web`: React 19 application with Tanstack Router and Tailwind 4
- `apps/api`: Python FastAPI application for AI question generation
- `packages/ui`: Shared UI components
- `packages/eslint-config`: Shared ESLint configuration
- `packages/typescript-config`: Shared TypeScript configuration

## Getting Started

### Prerequisites

- Node.js (v18+)
- pnpm
- Python 3.9+
- OpenAI API key (for AI question generation)

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
   - Create `.env.local` in `apps/web` with your Clerk and Convex keys:
     ```
     VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key
     VITE_CONVEX_URL=your_convex_url
     API_URL=http://localhost:8000
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
