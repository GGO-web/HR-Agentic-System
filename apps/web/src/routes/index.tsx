import { createFileRoute } from "@tanstack/react-router"
import { Button } from "@workspace/ui/components/button"

import logo from "../logo.svg"

export const Route = createFileRoute("/")({
  component: App,
})

function App() {
  return (
    <div className="text-center">
      <header className="flex min-h-screen flex-col items-center justify-center bg-[#282c34] text-[calc(10px+2vmin)] text-white">
        <img
          src={logo}
          className="pointer-events-none h-[40vmin] animate-[spin_20s_linear_infinite]"
          alt="logo"
        />
        <p>
          Edit{" "}
          <code className="rounded bg-gray-700 px-2 py-1">
            src/routes/index.tsx
          </code>{" "}
          and save to reload.
        </p>
        <a
          className="text-[#61dafb] hover:underline"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        <a
          className="text-[#61dafb] hover:underline"
          href="https://tanstack.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn TanStack
        </a>

        <div className="flex flex-wrap items-center gap-2 md:flex-row">
          <Button>Button</Button>
        </div>
      </header>
    </div>
  )
}
