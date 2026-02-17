export default function DashboardPage() {
  return (
    <section className="flex flex-1 flex-col justify-center gap-6 rounded-lg border border-dashed border-zinc-200 bg-white px-6 py-10 text-center shadow-sm md:px-10">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 md:text-3xl">
        Benvenuto in SGIC
      </h1>
      <p className="mx-auto max-w-xl text-sm text-zinc-500 md:text-base">
        Seleziona un modulo dal menu laterale per iniziare a gestire audit,
        organizzazioni e non conformità secondo ISO 9001.
      </p>
    </section>
  );
}

