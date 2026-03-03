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
    color?: "blue" | "green" | "purple" | "red";
}

const colorStyles = {
    blue: "bg-red-500/10 text-red-500",
    green: "bg-green-500/10 text-green-500",
    purple: "bg-purple-500/10 text-purple-500",
    red: "bg-red-600/10 text-red-600",
};

export function StatCard({ title, value, trend, trendUp, icon: Icon, color = "blue" }: StatCardProps) {
    return (
        <div className="p-6 rounded-2xl bg-black/40 border border-zinc-800 backdrop-blur-md hover:-translate-y-1 hover:bg-zinc-900/40 hover:border-red-600/30 hover:shadow-lg hover:shadow-red-600/10 transition-all duration-300 group">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-zinc-400 group-hover:text-zinc-300 transition-colors">{title}</p>
                    <h3 className="text-2xl font-bold text-white mt-2 group-hover:scale-105 transition-transform origin-left">{value}</h3>
                    {trend && (
                        <p className={cn("text-xs font-medium mt-1 flex items-center gap-1", trendUp ? "text-green-400" : "text-red-400")}>
                            {trendUp ? "↑" : "↓"} {trend}
                        </p>
                    )}
                </div>
                <div className={cn("p-3 rounded-xl transition-all duration-300 group-hover:bg-opacity-20", colorStyles[color])}>
                    <Icon size={24} className="transition-transform duration-300 group-hover:rotate-12" />
                </div>
            </div>
        </div>
    );
}
