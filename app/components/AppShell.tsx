import { Outlet } from "@tanstack/react-router";
import { UserButton } from "@clerk/react";
import PillNav from "./PillNav";

export default function AppShell() {
  return (
    <div className="flex flex-col h-dvh bg-[#111] text-white max-w-md mx-auto">
      <div className="flex items-center justify-between px-4 pt-5 pb-1">
        <span className="text-lg font-bold tracking-tight">habitus</span>
        <UserButton />
      </div>
      <PillNav />
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
