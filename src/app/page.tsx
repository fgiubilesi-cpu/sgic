import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="flex flex-col items-center gap-4 rounded-lg border border-zinc-200 bg-white px-6 py-8 text-center shadow-sm">
        <h1 className="text-lg font-semibold text-zinc-900">
          SGIC - Audit Management
        </h1>
        <p className="max-w-md text-sm text-zinc-500">
          Stai per essere reindirizzato alla dashboard. Se il redirect non avviene,
          usa il link qui sotto.
        </p>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-zinc-900 underline-offset-4 hover:underline"
        >
          Vai alla Dashboard
        </Link>
      </div>
    </main>
  );
}

