import Link from "next/link";

export const metadata = {
  title: "Offline",
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-app px-6 text-center text-white">
      <h1 className="text-2xl font-bold">You are offline</h1>
      <p className="max-w-md text-zinc-400">
        Check your connection, then try again. Cached pages may still open while you have no network.
      </p>
      <Link
        href="/"
        className="rounded-full bg-gradient-to-r from-red-700 to-red-900 px-8 py-3 font-bold text-white hover:from-red-600 hover:to-red-800"
      >
        Go home
      </Link>
    </div>
  );
}
