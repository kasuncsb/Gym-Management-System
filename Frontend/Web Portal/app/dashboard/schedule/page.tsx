"use client";

import { useState } from "react";
import { CalendarDays, Clock, MapPin, User, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data for schedule
const classes = [
    {
        id: 1,
        title: "Morning Yoga",
        time: "07:00 AM - 08:00 AM",
        instructor: "Sarah Jen",
        location: "Studio A",
        date: 27, // Day of month
        category: "Yoga"
    },
    {
        id: 2,
        title: "CrossFit Mayhem",
        time: "05:30 PM - 06:30 PM",
        instructor: "Mike Ross",
        location: "Main Gym",
        date: 27,
        category: "CrossFit"
    },
    {
        id: 3,
        title: "Spin Class",
        time: "08:00 AM - 09:00 AM",
        instructor: "Jessica Suits",
        location: "Cycle Room",
        date: 28,
        category: "Cardio"
    },
    {
        id: 4,
        title: "Power Lifting",
        time: "06:00 PM - 07:30 PM",
        instructor: "Big John",
        location: "Free Weights",
        date: 28,
        category: "Strength"
    },
    {
        id: 5,
        title: "Zumba Dance",
        time: "10:00 AM - 11:00 AM",
        instructor: "Maria C.",
        location: "Studio B",
        date: 29,
        category: "Dance"
    }
];

const days = [
    { name: "Mon", date: 27, active: true },
    { name: "Tue", date: 28, active: false },
    { name: "Wed", date: 29, active: false },
    { name: "Thu", date: 30, active: false },
    { name: "Fri", date: 31, active: false },
    { name: "Sat", date: 1, active: false },
    { name: "Sun", date: 2, active: false },
];

export default function SchedulePage() {
    const [selectedDate, setSelectedDate] = useState(27);

    const filteredClasses = classes.filter(c => c.date === selectedDate);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white">Class Schedule</h2>
                    <p className="text-zinc-400 mt-1">Book your classes and manage appointments</p>
                </div>
                <div className="flex items-center gap-2 text-zinc-400 bg-zinc-900/50 p-1.5 rounded-lg border border-zinc-800">
                    <button className="p-1.5 hover:text-white rounded-md transition-colors"><ChevronLeft size={20} /></button>
                    <span className="text-sm font-medium px-2 text-white">January 2025</span>
                    <button className="p-1.5 hover:text-white rounded-md transition-colors"><ChevronRight size={20} /></button>
                </div>
            </div>

            {/* Weekly Calendar Strip */}
            <div className="flex justify-between gap-4 overflow-x-auto pb-2 scrollbar-none">
                {days.map((day) => (
                    <button
                        key={day.date}
                        onClick={() => setSelectedDate(day.date)}
                        className={cn(
                            "flex flex-col items-center justify-center min-w-[3.5rem] md:min-w-[4.5rem] py-4 rounded-2xl transition-all border",
                            selectedDate === day.date
                                ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/25 scale-105"
                                : "bg-black/40 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                        )}
                    >
                        <span className="text-xs font-medium uppercase tracking-wider mb-1">{day.name}</span>
                        <span className="text-xl md:text-2xl font-bold">{day.date}</span>
                    </button>
                ))}
            </div>

            {/* Timeline View */}
            <div className="grid gap-4">
                {filteredClasses.length > 0 ? (
                    filteredClasses.map((item) => (
                        <div
                            key={item.id}
                            className="group flex flex-col md:flex-row gap-6 p-6 rounded-2xl bg-black/40 border border-zinc-800 backdrop-blur-sm transition-all hover:bg-zinc-900/40 hover:border-zinc-700"
                        >
                            {/* Time Column */}
                            <div className="flex flex-col items-start min-w-[140px] border-l-2 border-indigo-500 pl-4 py-1">
                                <span className="text-lg font-bold text-white">{item.time.split('-')[0]}</span>
                                <span className="text-sm text-zinc-400 mt-1">{item.time.split('-')[1]}</span>
                            </div>

                            {/* Content */}
                            <div className="flex-1">
                                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">{item.title}</h3>
                                        <p className="text-sm text-zinc-500 mt-1 bg-zinc-900 w-fit px-2 py-0.5 rounded-md border border-zinc-800 uppercase tracking-wide text-[10px]">
                                            {item.category}
                                        </p>
                                    </div>
                                    <button className="px-5 py-2 rounded-xl bg-white text-black font-semibold hover:bg-indigo-400 hover:text-white transition-all shadow-lg hover:shadow-indigo-500/30">
                                        Book Now
                                    </button>
                                </div>

                                <div className="flex flex-wrap items-center gap-6 mt-6">
                                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                                        <User size={16} className="text-zinc-500" />
                                        <span>with <span className="text-zinc-200 font-medium">{item.instructor}</span></span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                                        <MapPin size={16} className="text-zinc-500" />
                                        <span>{item.location}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-20 text-center rounded-2xl border border-dashed border-zinc-800 bg-black/20">
                        <CalendarDays className="mx-auto text-zinc-600 mb-4" size={48} />
                        <h3 className="text-xl font-bold text-white">No classes scheduled</h3>
                        <p className="text-zinc-500 mt-1">Take a rest day or check another date!</p>
                    </div>
                )}
            </div>

            <div className="fixed bottom-8 right-8 md:hidden">
                <button className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-indigo-600/30 hover:scale-110 transition-transform">
                    <Plus size={24} />
                </button>
            </div>
        </div>
    );
}
