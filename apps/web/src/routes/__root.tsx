import { TanstackDevtools } from "@tanstack/react-devtools"
import { Outlet, createRootRoute } from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"

import { UserCreationHandler } from "@/components/auth/UserCreationHandler"
import Header from "@/components/Header"

export const Route = createRootRoute({
  component: () => (
    <UserCreationHandler>
      <Header />

      <Outlet />

      <TanstackDevtools
        config={{
          position: "bottom-left",
        }}
        plugins={[
          {
            name: "Tanstack Router",
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      />
    </UserCreationHandler>
  ),
})
