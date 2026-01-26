import React from 'react';

interface RohiniCycleChartProps {
    className?: string;
}

const RohiniCycleChart: React.FC<RohiniCycleChartProps> = ({ className = '' }) => {
    // 28 days in the cycle
    const days = Array.from({ length: 28 }, (_, i) => i + 1);

    // Days to take Rohini: Day 3 of menstruation until ovulation (Day 3 → Day 14)
    const teaDays = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

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
            {/* Mobile-friendly container */}
            <div className="relative w-full max-w-md mx-auto px-2">
                {/* MENSTRUATION - Top */}
                <div className="text-center mb-3 lg:mb-4">
                    <span className="text-pink-400 font-bold text-lg lg:text-2xl tracking-wide">MENSTRUATION</span>
                    <span className="block text-pink-300/70 text-xs lg:text-sm">Days 1-5</span>
                </div>

                {/* Mobile/Tablet: Stack vertically, Desktop: Side by side */}
                <div className="flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-2 lg:gap-4">

                    {/* LUTEAL - Shows on left for desktop only (1024px+) */}
                    <div className="hidden lg:block text-left w-24 xl:w-28 flex-shrink-0">
                        <span className="text-amber-200 font-bold text-lg xl:text-xl tracking-wide">LUTEAL</span>
                        <span className="block text-amber-100/70 text-xs xl:text-sm">Days 16-28</span>
                    </div>

                    {/* The Cycle Circle - Responsive sizing */}
                    <div className="w-full max-w-[280px] lg:max-w-[256px] aspect-square flex-shrink-0 mx-auto">
                        <svg viewBox="0 0 200 200" className="w-full h-full">
                            {/* Center circle */}
                            <circle cx="100" cy="100" r="35" fill="#1e1b2e" stroke="#f9a8d4" strokeWidth="1" opacity="0.9" />
                            <text x="100" y="92" textAnchor="middle" fontSize="9" fill="#f9a8d4" fontWeight="bold">Take Rohini</text>
                            <text x="100" y="106" textAnchor="middle" fontSize="8" fill="#fef3c7">Days 3 → 14</text>

                            {days.map((day) => {
                                const pos = getDayPosition(day);
                                const isTakeDay = teaDays.includes(day);
                                const phase = getPhase(day);
                                const isStart = day === 3;
                                const isEnd = day === 14;

                                let fillColor = '#fef3c7';
                                if (phase === 'menstruation') fillColor = '#f472b6';
                                if (phase === 'follicular') fillColor = '#fbcfe8';
                                if (phase === 'ovulation') fillColor = '#fbbf24';
                                if (isTakeDay) fillColor = 'url(#rohiniGradient)';

                                return (
                                    <g key={day}>
                                        <circle
                                            cx={pos.x}
                                            cy={pos.y}
                                            r={isStart || isEnd ? 11 : isTakeDay ? 9 : 7}
                                            fill={fillColor}
                                            stroke={isStart ? '#22c55e' : isEnd ? '#ef4444' : isTakeDay ? '#f9a8d4' : '#555'}
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
                                <linearGradient id="rohiniGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#f9a8d4" />
                                    <stop offset="100%" stopColor="#fef3c7" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>

                    {/* FOLLICULAR - Shows on right for desktop only (1024px+) */}
                    <div className="hidden lg:block text-right w-24 xl:w-28 flex-shrink-0">
                        <span className="text-pink-200 font-bold text-lg xl:text-xl tracking-wide">FOLLICULAR</span>
                        <span className="block text-pink-100/70 text-xs xl:text-sm">Days 6-13</span>
                    </div>
                </div>

                {/* Mobile/Tablet: LUTEAL and FOLLICULAR side by side below chart (up to 1024px) */}
                <div className="flex lg:hidden justify-between px-4 mt-3">
                    <div className="text-left">
                        <span className="text-amber-200 font-bold text-base tracking-wide">LUTEAL</span>
                        <span className="block text-amber-100/70 text-xs">Days 16-28</span>
                    </div>
                    <div className="text-right">
                        <span className="text-pink-200 font-bold text-base tracking-wide">FOLLICULAR</span>
                        <span className="block text-pink-100/70 text-xs">Days 6-13</span>
                    </div>
                </div>

                {/* OVULATION - Bottom */}
                <div className="text-center mt-3 lg:mt-4">
                    <span className="text-amber-400 font-bold text-lg lg:text-2xl tracking-wide">OVULATION</span>
                    <span className="block text-amber-300/70 text-xs lg:text-sm">Days 14-15</span>
                </div>
            </div>

            {/* Legend Box */}
            <div className="mt-6 lg:mt-10 max-w-xl mx-auto px-2">
                <div className="bg-gradient-to-r from-pink-600/30 to-amber-100/20 border-2 border-pink-400/50 rounded-xl p-3 sm:p-5 mb-4 lg:mb-6 shadow-lg">
                    <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-pink-400 to-amber-100 animate-pulse flex items-center justify-center">
                            <span className="text-white text-base sm:text-lg">✨</span>
                        </div>
                        <span className="text-sm sm:text-base lg:text-xl font-bold text-pink-200">Take Rohini Tincture</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="bg-green-900/30 border border-green-500/40 rounded-lg p-2.5 sm:p-3 flex items-center gap-2 sm:gap-3">
                            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-green-500 border-2 border-green-300 flex-shrink-0" />
                            <div>
                                <span className="text-green-400 font-bold block text-sm sm:text-base">▶ START: Day 3</span>
                                <span className="text-white text-xs sm:text-sm">During menstruation</span>
                            </div>
                        </div>
                        <div className="bg-red-900/30 border border-red-500/40 rounded-lg p-2.5 sm:p-3 flex items-center gap-2 sm:gap-3">
                            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-red-500 border-2 border-red-300 flex-shrink-0" />
                            <div>
                                <span className="text-red-400 font-bold block text-sm sm:text-base">■ STOP: Day 14</span>
                                <span className="text-white text-xs sm:text-sm">At ovulation</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Phase Legend - Simple row */}
                <div className="flex flex-wrap justify-center gap-3 md:gap-6">
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

                <p className="text-center text-pink-200/40 text-xs mt-6 italic">
                    Every woman's body is different — these are approximate time frames.
                </p>
            </div>
        </div>
    );
};

export default RohiniCycleChart;

