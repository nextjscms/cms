export default function Loading() {
  return (
    <div className="flex-1 flex flex-col font-sans animate-pulse">
      
      {/* Header Banner */}
      <div className="bg-[#161b22] border-b border-white/[0.08]">
        <div className="max-w-6xl w-full mx-auto px-8 py-10 flex items-start gap-6">
          <div className="w-24 h-24 rounded-lg bg-white/[0.05] flex-shrink-0"></div>

          <div className="flex-1 min-w-0 pt-2">
            <div className="h-8 w-64 bg-white/[0.05] rounded mb-4"></div>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="h-4 w-32 bg-white/[0.05] rounded"></div>
              <div className="h-4 w-24 bg-white/[0.05] rounded"></div>
              <div className="h-4 w-24 bg-white/[0.05] rounded"></div>
            </div>

            <div className="h-10 w-24 bg-white/[0.05] rounded"></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/[0.08] bg-[#161b22]">
        <div className="max-w-6xl w-full mx-auto px-8 flex gap-8">
          <div className="px-1 py-4"><div className="h-5 w-20 bg-white/[0.05] rounded"></div></div>
          <div className="px-1 py-4"><div className="h-5 w-28 bg-white/[0.05] rounded"></div></div>
          <div className="px-1 py-4"><div className="h-5 w-16 bg-white/[0.05] rounded"></div></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex max-w-6xl w-full mx-auto px-8 py-10 gap-16">
        <main className="flex-1 min-w-0">
          <div className="space-y-4">
            <div className="h-6 w-48 bg-white/[0.05] rounded mb-8"></div>
            <div className="h-4 w-full bg-white/[0.05] rounded"></div>
            <div className="h-4 w-[90%] bg-white/[0.05] rounded"></div>
            <div className="h-4 w-[95%] bg-white/[0.05] rounded"></div>
            <div className="h-4 w-[80%] bg-white/[0.05] rounded"></div>
            <div className="h-4 w-full bg-white/[0.05] rounded mt-8"></div>
            <div className="h-4 w-[85%] bg-white/[0.05] rounded"></div>
          </div>
        </main>

        <aside className="w-64 flex-shrink-0">
          <div className="space-y-8">
            <div>
              <div className="h-4 w-24 bg-white/[0.05] rounded mb-3"></div>
              <div className="flex gap-2">
                <div className="h-6 w-16 bg-white/[0.05] rounded"></div>
                <div className="h-6 w-12 bg-white/[0.05] rounded"></div>
              </div>
            </div>
            <div>
              <div className="h-4 w-16 bg-white/[0.05] rounded mb-3"></div>
              <div className="flex gap-2">
                <div className="h-6 w-16 bg-white/[0.05] rounded"></div>
                <div className="h-6 w-20 bg-white/[0.05] rounded"></div>
              </div>
            </div>
            <div>
              <div className="h-4 w-24 bg-white/[0.05] rounded mb-3"></div>
              <div className="space-y-2">
                <div className="h-4 w-28 bg-white/[0.05] rounded"></div>
                <div className="h-4 w-28 bg-white/[0.05] rounded"></div>
                <div className="h-4 w-28 bg-white/[0.05] rounded"></div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
