import React from 'react';

interface CycleChartProps {
    className?: string;
}

const CycleChart: React.FC<CycleChartProps> = ({ className = '' }) => {
    // 28 days in the cycle
    const days = Array.from({ length: 28 }, (_, i) => i + 1);

    // Days to take tea: After ovulation (day 16) through day 2 of menstruation
    const teaDays = [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 1, 2];

    // Phase definitions
    const getPhase = (day: number) => {
        if (day >= 1 && day <= 5) return 'menstruation';
        if (day >= 6 && day <= 13) return 'follicular';
        if (day >= 14 && day <= 15) return 'ovulation';
        return 'luteal';
    };

    // Calculate position for a given day
    const getDayPosition = (day: number, radius: number = 80) => {
        const angle = ((day - 1) / 28) * 360 - 90;
        const radians = (angle * Math.PI) / 180;
        return {
            x: 100 + radius * Math.cos(radians),
            y: 100 + radius * Math.sin(radians),
        };
    };

    return (
        <div className={`${className}`}>
            {/* Container with phase labels OUTSIDE */}
            <div className="relative max-w-md mx-auto">
                {/* MENSTRUATION - Top */}
                <div className="text-center mb-4">
                    <span className="text-pink-400 font-bold text-2xl tracking-wide">MENSTRUATION</span>
                    <span className="block text-pink-300/70 text-sm">Days 1-5</span>
                </div>

                {/* Middle row with LUTEAL - Circle - FOLLICULAR */}
                <div className="flex items-center justify-between">
                    {/* LUTEAL - Left */}
                    <div className="text-left w-28">
                        <span className="text-amber-300 font-bold text-xl tracking-wide">LUTEAL</span>
                        <span className="block text-amber-200/70 text-sm">Days 16-28</span>
                    </div>

                    {/* The Cycle Circle */}
                    <div className="w-64 h-64 flex-shrink-0">
                        <svg viewBox="0 0 200 200" className="w-full h-full">
                            {/* Center circle */}
                            <circle cx="100" cy="100" r="35" fill="#1e1b4b" stroke="#f59e0b" strokeWidth="1" opacity="0.9" />
                            <text x="100" y="92" textAnchor="middle" fontSize="9" fill="#f59e0b" fontWeight="bold">Take Tea</text>
                            <text x="100" y="106" textAnchor="middle" fontSize="8" fill="#fbcfe8">Days 16 → 2</text>

                            {days.map((day) => {
                                const pos = getDayPosition(day);
                                const isTakeDay = teaDays.includes(day);
                                const phase = getPhase(day);
                                const isStart = day === 16;
                                const isEnd = day === 2;

                                let fillColor = '#fef3c7';
                                if (phase === 'menstruation') fillColor = '#ec4899';
                                if (phase === 'follicular') fillColor = '#fbcfe8';
                                if (phase === 'ovulation') fillColor = '#fbbf24';
                                if (isTakeDay) fillColor = 'url(#teaGradient)';

                                return (
                                    <g key={day}>
                                        <circle
                                            cx={pos.x}
                                            cy={pos.y}
                                            r={isStart || isEnd ? 11 : isTakeDay ? 9 : 7}
                                            fill={fillColor}
                                            stroke={isStart ? '#22c55e' : isEnd ? '#ef4444' : isTakeDay ? '#f59e0b' : '#555'}
                                            strokeWidth={isStart || isEnd ? 3 : isTakeDay ? 1.5 : 0.5}
                                            className={isTakeDay ? 'animate-pulse' : ''}
                                        />
                                        <text
                                            x={pos.x}
                                            y={pos.y}
                                            textAnchor="middle"
                                            dominantBaseline="central"
                                            fontSize={isStart || isEnd ? '8' : '6'}
                                            fontWeight="700"
                                            fill={isTakeDay || phase === 'menstruation' ? '#fff' : '#333'}
                                        >
                                            {day}
                                        </text>
                                    </g>
                                );
                            })}

                            <defs>
                                <linearGradient id="teaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#f59e0b" />
                                    <stop offset="100%" stopColor="#ec4899" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>

                    {/* FOLLICULAR - Right */}
                    <div className="text-right w-28">
                        <span className="text-pink-200 font-bold text-xl tracking-wide">FOLLICULAR</span>
                        <span className="block text-pink-100/70 text-sm">Days 6-13</span>
                    </div>
                </div>

                {/* OVULATION - Bottom */}
                <div className="text-center mt-4">
                    <span className="text-amber-400 font-bold text-2xl tracking-wide">OVULATION</span>
                    <span className="block text-amber-300/70 text-sm">Days 14-15</span>
                </div>
            </div>

            {/* Legend Box */}
            <div className="mt-10 max-w-xl mx-auto">
                <div className="bg-gradient-to-r from-amber-600/30 to-pink-600/30 border-2 border-amber-400/50 rounded-xl p-5 mb-6 shadow-lg">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 to-pink-500 animate-pulse flex items-center justify-center">
                            <span className="text-white text-lg">☕</span>
                        </div>
                        <span className="text-xl font-bold text-amber-200">Take Het Her Womb PLUS Tea</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-green-900/30 border border-green-500/40 rounded-lg p-3 flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-green-300" />
                            <div>
                                <span className="text-green-400 font-bold block">▶ START: Day 16</span>
                                <span className="text-white text-sm">48 hours after ovulation</span>
                            </div>
                        </div>
                        <div className="bg-red-900/30 border border-red-500/40 rounded-lg p-3 flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-red-300" />
                            <div>
                                <span className="text-red-400 font-bold block">■ STOP: Day 2</span>
                                <span className="text-white text-sm">During menstruation</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Phase Legend - Simple row */}
                <div className="flex flex-wrap justify-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-pink-500" />
                        <span className="text-pink-300 text-sm">Menstruation</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-pink-200" />
                        <span className="text-pink-200 text-sm">Follicular</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-amber-400" />
                        <span className="text-amber-300 text-sm">Ovulation</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-amber-100" />
                        <span className="text-amber-200 text-sm">Luteal</span>
                    </div>
                </div>

                <p className="text-center text-amber-200/40 text-xs mt-6 italic">
                    Every woman's body is different — these are approximate time frames.
                </p>
            </div>
        </div>
    );
};

export default CycleChart;
