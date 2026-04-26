import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SignIn, useAuth } from "@clerk/react";
import { useMutation } from "convex/react";
import { useEffect } from "react";
import { api } from "../../../convex/_generated/api";
import AppShell from "../../components/AppShell";

function AppLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  const upsert = useMutation(api.userPreferences.upsert);

  useEffect(() => {
    if (isSignedIn) {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      upsert({ timezone: tz }).catch(() => {});
    }
  }, [isSignedIn, upsert]);

  if (!isLoaded) {
    return <div className="flex items-center justify-center min-h-dvh bg-[#111]" />;
  }

  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-[#111]">
        <div className="flex flex-col items-center gap-6">
          <h1 className="text-3xl font-bold text-white tracking-tight">habitus</h1>
          <SignIn />
        </div>
      </div>
    );
  }

  return <AppShell />;
}

export const Route = createFileRoute("/_app")({
  component: AppLayout,
  ssr: false,
});
