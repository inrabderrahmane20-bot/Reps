export default function RootPage() {
  const basePath = process.env.GITHUB_PAGES === 'true' ? '/Reps' : '';

  return (
    <main className="grid min-h-screen place-items-center bg-sand-50 px-6 text-center text-ink-900">
      <div>
        <p className="font-display text-5xl font-semibold">Medina</p>
        <p className="mt-3 text-sm text-ink-500">Marrakech, all in one place.</p>
        <a href={`${basePath}/en/`} className="mt-6 inline-flex rounded-full bg-majorelle-600 px-5 py-3 text-sm font-semibold text-white">
          Enter Medina
        </a>
      </div>
    </main>
  );
}