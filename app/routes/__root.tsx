import { createRootRoute, Outlet } from "@tanstack/react-router";
import { ClerkProvider } from "@clerk/react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/react";
import "../styles.css";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL!);

function RootComponent() {
  return (
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY!}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <Outlet />
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
});
