import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  iconBgColor?: string;
}

export default function StatsCard({
  icon: Icon,
  label,
  value,
  iconBgColor = "bg-[#4F0DCB]",
}: StatsCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 hover:shadow-md transition-shadow duration-200 mt-3">
      <div className="flex items-center justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-4xl font-bold text-gray-900">{value}</p>
        </div>
        <div
          className={`w-14 h-14 rounded-xl ${iconBgColor} flex items-center justify-center shrink-0`}
        >
          <Icon className="text-white" size={24} />
        </div>
      </div>
    </div>
  );
}
