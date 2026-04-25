import { ReactNode } from "react";
import {
  createRootRoute,
  Outlet,
  HeadContent,
  Scripts
} from "@tanstack/react-router";
import { ClerkProvider } from "@clerk/react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/react";
import { NotFound } from "../components/NotFound";
import "../styles.css";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL!);

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "habitus - Habit Tracker" },
      { name: "description", content: "The simple habit tracker" },
    ]
  }),
  component: RootComponent,
  notFoundComponent: NotFound,
});

function RootComponent() {
  return (
    <RootDocument>
      <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY!}>
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          <Outlet />
        </ConvexProviderWithClerk>
      </ClerkProvider>
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
