'use client';

import { BarChart3, Lightbulb, ArrowUp } from 'lucide-react';
import { PageHeader, Card } from '@/components/ui/SharedComponents';

const kpis = [
    { label: 'Avg Daily Check-ins',   value: '87', delta: '+12% vs last week',  good: true  },
    { label: 'Peak Hour Avg',          value: '6–8 PM', delta: 'Most consistent', good: true  },
    { label: 'Member Satisfaction',    value: '4.6 / 5', delta: '+0.2 this month', good: true  },
    { label: 'Trainer Utilisation',   value: '78.3%', delta: '-2% vs last month', good: false },
];

const insights = [
    { title: 'Peak Hours',     body: 'Weekday evenings 6–8 PM are consistently the busiest. Consider scheduling an extra trainer during this window.', impact: 'high' },
    { title: 'Cardio vs Strength', body: 'Cardio machine usage is 15% higher than strength equipment. Expand cardio zone or introduce time slots.', impact: 'medium' },
    { title: 'New Member Drop-off', body: '18% of new members don\'t return after the first 2 weeks. Implementing a buddy programme could improve retention.', impact: 'high' },
    { title: 'Weekend Occupancy', body: 'Weekend utilisation is 42% lower than weekdays. Promoting weekend group classes could help fill capacity.', impact: 'low' },
];

const impactColor: Record<string, string> = {
    high:   'text-red-400 bg-red-500/20',
    medium: 'text-yellow-400 bg-yellow-500/20',
    low:    'text-blue-400 bg-blue-500/20',
};

const occupancyByHour = [5, 8, 12, 18, 22, 28, 35, 52, 61, 55, 48, 42, 38, 40, 45, 52, 70, 85, 82, 65, 50, 35, 22, 10];

export default function ManagerInsightsPage() {
    const maxOcc = Math.max(...occupancyByHour);
    const hours  = Array.from({ length: 24 }, (_, i) => `${i === 0 ? 12 : i > 12 ? i - 12 : i}${i < 12 ? 'a' : 'p'}`);

    return (
        <div className="space-y-8">
            <PageHeader
                title="Gym Insights"
                subtitle="Data-driven insights for PowerWorld Kiribathgoda"
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map(k => (
                    <Card key={k.label} padding="md" className="hover:border-zinc-700/50 transition-colors">
                        <p className="text-2xl font-bold text-white mb-1">{k.value}</p>
                        <p className="text-xs text-zinc-500">{k.label}</p>
                        <p className={`text-xs mt-1 flex items-center gap-1 ${k.good ? 'text-green-400' : 'text-red-400'}`}>
                            <ArrowUp size={10} className={k.good ? '' : 'rotate-180'} /> {k.delta}
                        </p>
                    </Card>
                ))}
            </div>

            <Card padding="lg">
                <h2 className="text-lg font-semibold text-white mb-6">Average Hourly Occupancy</h2>
                <div className="flex items-end gap-px h-48 min-h-[12rem]">
                    {occupancyByHour.map((v, i) => (
                        <div key={i} className="flex flex-col items-center flex-1">
                            <div className={`w-full rounded-t-sm transition-all ${v > 60 ? 'bg-red-500' : v > 40 ? 'bg-orange-500' : 'bg-purple-700'}`}
                                style={{ height: `${(v / maxOcc) * 100}%`, minHeight: '4px' }} />
                            {i % 4 === 0 && <span className="text-zinc-500 text-[9px] mt-1">{hours[i]}</span>}
                        </div>
                    ))}
                </div>
                <div className="flex gap-4 mt-3 text-xs">
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500" /> Peak</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-orange-500" /> Moderate</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-purple-700" /> Low</span>
                </div>
            </Card>

            <div>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Lightbulb size={18} className="text-yellow-400" /> Recommendations
                </h2>
                <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                    {insights.map((ins, i) => (
                        <Card key={i} padding="md" className="hover:border-zinc-700/50 transition-colors">
                            <div className="flex items-start justify-between mb-2">
                                <p className="text-white font-semibold">{ins.title}</p>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${impactColor[ins.impact]}`}>{ins.impact} impact</span>
                            </div>
                            <p className="text-zinc-400 text-sm">{ins.body}</p>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
