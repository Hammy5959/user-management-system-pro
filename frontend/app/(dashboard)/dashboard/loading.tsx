import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1120] backdrop-blur-sm">
      <Loader2 className="animate-spin" size={36} color="#4F0DCB" />
    </div>
  );
}
