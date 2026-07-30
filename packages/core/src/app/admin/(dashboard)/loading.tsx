import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="h-[60vh] w-full flex flex-col items-center justify-center space-y-4">
      <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
      <p className="text-slate-500 font-medium animate-pulse">Loading data...</p>
    </div>
  );
}
