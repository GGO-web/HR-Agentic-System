interface ImportMetaEnv {
  readonly VITE_CLERK_PUBLISHABLE_KEY: string;
  readonly VITE_CONVEX_URL: string;
  readonly VITE_API_URL: string;

  readonly VITE_AWS_REGION: string;
  readonly VITE_AWS_ACCESS_KEY_ID: string;
  readonly VITE_AWS_SECRET_ACCESS_KEY: string;

  readonly VITE_ELEVENLABS_API_KEY: string;
  readonly VITE_ELEVENLABS_VOICE_ID: string;
  readonly VITE_ELEVENLABS_AGENT_ID: string;
  readonly VITE_ELEVENLABS_SERVER_LOCATION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
