export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse" />
            <div className="w-24 h-5 rounded bg-gray-200 animate-pulse" />
          </div>
          <div className="flex items-center gap-4">
            <div className="w-28 h-4 rounded bg-gray-200 animate-pulse hidden sm:block" />
            <div className="w-20 h-8 rounded-lg bg-gray-200 animate-pulse" />
            <div className="w-16 h-8 rounded-lg bg-violet-200 animate-pulse" />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="w-40 h-8 rounded bg-gray-200 animate-pulse" />
          <div className="w-36 h-10 rounded-xl bg-violet-200 animate-pulse" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="aspect-square bg-gray-100 animate-pulse" />
              <div className="p-4 space-y-2">
                <div className="w-3/4 h-4 rounded bg-gray-200 animate-pulse" />
                <div className="w-1/2 h-3 rounded bg-gray-200 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
