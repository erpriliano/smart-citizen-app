import { Route, Routes } from 'react-router-dom';

function WorkspaceOverview() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <p className="mb-2 text-sm font-medium text-emerald-700">RT community workspace</p>
        <h2 className="text-2xl font-semibold text-zinc-950 sm:text-3xl">Workspace overview</h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-600 sm:text-base">
          No community data has been configured.
        </p>
      </div>

      <section
        aria-label="Workspace status"
        className="mt-8 border border-zinc-200 bg-white px-5 py-8 shadow-sm sm:px-8"
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-zinc-900">Community setup</p>
            <p className="mt-1 text-sm leading-6 text-zinc-600">
              The workspace is ready for the first pilot configuration.
            </p>
          </div>
          <span className="w-fit rounded-md bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
            Not configured
          </span>
        </div>
      </section>
    </main>
  );
}

export function App() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <span
            aria-hidden="true"
            className="grid size-9 place-items-center rounded-md bg-emerald-700 text-sm font-semibold text-white"
          >
            SC
          </span>
          <h1 className="text-lg font-semibold">Smart Citizen</h1>
        </div>
      </header>
      <Routes>
        <Route path="*" element={<WorkspaceOverview />} />
      </Routes>
    </div>
  );
}

export default App;
