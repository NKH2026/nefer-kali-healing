import React, { useState, useEffect } from 'react';
import { calculateCosmicData, CosmicData } from '../utils/astrology';
import { Moon, Sun, Star, ArrowRight, Calendar } from 'lucide-react';

const CosmicReadings: React.FC = () => {
    const [data, setData] = useState<CosmicData | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        // Initial calculation
        setData(calculateCosmicData(new Date()));

        // Update time every minute
        const timer = setInterval(() => {
            const now = new Date();
            setCurrentTime(now);
            setData(calculateCosmicData(now));
        }, 60000);

        return () => clearInterval(timer);
    }, []);

    if (!data) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">Loading Sky Data...</div>;

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] pt-32 pb-24 px-8 relative overflow-hidden">
            {/* Background Atmosphere */}
            <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-purple-900/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-16">
                    <h1 className="text-5xl md:text-7xl font-display mb-6 tracking-tight">
                        Cosmic <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#F4CF57]">Sky Watch</span>
                    </h1>
                    <p className="text-white/40 max-w-2xl mx-auto text-sm tracking-widest uppercase font-light">
                        Real-time planetary alignments, Nakshatras, and Lunar Cycles.
                        <br />
                        <span className="text-[#D4AF37] mt-2 block">{currentTime.toLocaleDateString()} • {currentTime.toLocaleTimeString()}</span>
                    </p>
                </div>

                {/* Main Dashboard Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">

                    {/* Sun Card */}
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 hover:border-[#D4AF37]/30 transition-all group">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h3 className="text-2xl font-display text-[#D4AF37] mb-1">The Sun</h3>
                                <p className="text-xs text-white/40 uppercase tracking-widest">Surya Deva</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-600 flex items-center justify-center shadow-[0_0_20px_rgba(255,100,0,0.3)]">
                                <Sun className="text-white" size={24} />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] text-white/30 uppercase tracking-widest block mb-1">Zodiac Sign</label>
                                <p className="text-3xl font-light">{data.sunSign}</p>
                                {data.sunDignity && (
                                    <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full mt-2 inline-block ${data.sunDignity === 'Exalted' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                        {data.sunDignity}
                                    </span>
                                )}
                            </div>
                            <div className="pt-6 border-t border-white/5">
                                <label className="text-[10px] text-white/30 uppercase tracking-widest block mb-1">Nakshatra</label>
                                <p className="text-xl font-display">{data.sunNakshatra.name}</p>
                                <p className="text-sm text-white/50 italic mt-1">"{data.sunNakshatra.meaning}"</p>
                                <div className="mt-2 text-xs text-[#D4AF37]/80 bg-[#D4AF37]/10 px-3 py-1 rounded-full w-fit">
                                    Ruled by {data.sunNakshatra.ruler}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Moon Card */}
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 hover:border-[#D4AF37]/30 transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full pointer-events-none" />

                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h3 className="text-2xl font-display text-[#D4AF37] mb-1">The Moon</h3>
                                <p className="text-xs text-white/40 uppercase tracking-widest">Chandra Ma</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-200 to-slate-400 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                                <Moon className="text-slate-900" size={24} />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] text-white/30 uppercase tracking-widest block mb-1">Zodiac Sign</label>
                                <p className="text-3xl font-light">{data.moonSign}</p>
                                {data.moonDignity && (
                                    <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full mt-2 inline-block ${data.moonDignity === 'Exalted' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                        {data.moonDignity}
                                    </span>
                                )}
                            </div>
                            <div className="pt-6 border-t border-white/5">
                                <label className="text-[10px] text-white/30 uppercase tracking-widest block mb-1">Nakshatra</label>
                                <p className="text-xl font-display">{data.moonNakshatra.name}</p>
                                <p className="text-sm text-white/50 italic mt-1">"{data.moonNakshatra.meaning}"</p>
                                <div className="mt-2 text-xs text-[#D4AF37]/80 bg-[#D4AF37]/10 px-3 py-1 rounded-full w-fit">
                                    Ruled by {data.moonNakshatra.ruler}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tithi & Phase Card */}
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 hover:border-[#D4AF37]/30 transition-all group">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h3 className="text-2xl font-display text-[#D4AF37] mb-1">Lunar Day</h3>
                                <p className="text-xs text-white/40 uppercase tracking-widest">Tithi & Phase</p>
                            </div>
                            <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center">
                                <span className="text-lg font-bold">{data.tithiIndex}</span>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] text-white/30 uppercase tracking-widest block mb-1">Current Tithi</label>
                                <p className="text-3xl font-light">{data.tithi}</p>
                                <p className="text-sm text-[#D4AF37] mt-1">{data.moonPhase} ({data.illumination}% Illumination)</p>
                            </div>

                            <div className="pt-6 space-y-4 border-t border-white/5">
                                <div className="flex flex-col gap-1 text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-white/40">Next Full Moon</span>
                                        <span className="text-white/80">{formatDate(data.nextFullMoon)}</span>
                                    </div>
                                    <p className="text-xs text-[#D4AF37]/80 text-right">
                                        in {data.nextFullMoonData.sign} ({data.nextFullMoonData.nakshatra.name})
                                    </p>
                                </div>
                                <div className="flex flex-col gap-1 text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-white/40">Next New Moon</span>
                                        <span className="text-white/80">{formatDate(data.nextNewMoon)}</span>
                                    </div>
                                    <p className="text-xs text-[#D4AF37]/80 text-right">
                                        in {data.nextNewMoonData.sign} ({data.nextNewMoonData.nakshatra.name})
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Additional Info Section (Placeholder for Monthly Readings) */}
                <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-white/10 rounded-3xl p-12 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('/assets/noise.png')] opacity-20 pointer-events-none" />

                    <Star size={48} className="text-[#D4AF37] mx-auto mb-6 animate-pulse" />
                    <h2 className="text-4xl font-display mb-4">Deep Cosmic Dive</h2>
                    <p className="text-lg text-white/60 max-w-2xl mx-auto mb-8 leading-relaxed">
                        Explore the current positions of all planets, retrograde movements, and the axis of destiny (Rahu & Ketu).
                    </p>
                    <a href="/cosmic-deep-dive" className="inline-block px-8 py-3 bg-[#D4AF37] text-black font-display uppercase tracking-widest rounded-full hover:bg-white transition-colors">
                        View Planetary Alignments
                    </a>
                </div>
            </div>
        </div>
    );
};

export default CosmicReadings;
