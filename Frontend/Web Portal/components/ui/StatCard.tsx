import { LucideIcon } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface StatCardProps {
    title: string;
    value: string;
    trend?: string;
    trendUp?: boolean;
    icon: LucideIcon;
    color?: "blue" | "green" | "purple" | "orange";
}

const colorStyles = {
    blue: "bg-blue-500/10 text-blue-500",
    green: "bg-green-500/10 text-green-500",
    purple: "bg-purple-500/10 text-purple-500",
    orange: "bg-orange-500/10 text-orange-500",
};

export function StatCard({ title, value, trend, trendUp, icon: Icon, color = "blue" }: StatCardProps) {
    return (
        <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700 backdrop-blur-sm hover:-translate-y-1 transition-transform duration-300">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-400">{title}</p>
                    <h3 className="text-2xl font-bold text-white mt-2">{value}</h3>
                    {trend && (
                        <p className={cn("text-xs font-medium mt-1", trendUp ? "text-green-400" : "text-red-400")}>
                            {trendUp ? "↑" : "↓"} {trend}
                        </p>
                    )}
                </div>
                <div className={cn("p-3 rounded-xl", colorStyles[color])}>
                    <Icon size={24} />
                </div>
            </div>
        </div>
    );
}
