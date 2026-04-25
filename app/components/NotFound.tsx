import { Link } from "@tanstack/react-router";

export function NotFound() {
  return (
    <div className="flex h-dvh flex-col items-center justify-center bg-[#111] px-6 text-center">
      <p className="text-6xl font-bold text-white">404</p>
      <p className="mt-3 text-lg font-medium text-white">Page not found</p>
      <p className="mt-2 text-sm text-[#aaa]">
        The page you're looking for doesn't exist.
      </p>
      <Link
        to="/tracker"
        className="mt-8 rounded-full bg-white px-6 py-2 text-sm font-medium text-black transition-opacity hover:opacity-80"
      >
        Go to Tracker
      </Link>
    </div>
  );
}
