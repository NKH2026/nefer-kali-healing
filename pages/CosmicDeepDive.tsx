import React, { useState, useEffect } from 'react';
import { calculateCosmicData, CosmicData, PlanetaryBody } from '../utils/astrology';
import { ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const CosmicDeepDive: React.FC = () => {
    const [data, setData] = useState<CosmicData | null>(null);

    useEffect(() => {
        setData(calculateCosmicData(new Date()));
    }, []);

    if (!data) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">Calculating Celestial Measurements...</div>;

    return (
        <div className="min-h-screen bg-[#0a0a0a] pt-32 pb-24 px-8 relative overflow-hidden">
            {/* Dynamic Background */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-900/20 to-transparent pointer-events-none" />

            <div className="max-w-5xl mx-auto relative z-10">
                <Link to="/sky-watch" className="inline-flex items-center gap-2 text-white/40 hover:text-[#D4AF37] transition-colors mb-8 group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
                </Link>

                <div className="mb-12">
                    <h1 className="text-5xl font-display mb-4">Planetary Deep Dive</h1>
                    <p className="text-white/60 max-w-2xl leading-relaxed">
                        Detailed analysis of the current celestial positions. Any planet marked with <span className="text-red-400 font-bold text-xs uppercase bg-red-500/10 px-2 py-0.5 rounded">Rx</span> is currently in retrograde motion, inviting us to review and reflect.
                    </p>
                </div>

                <div className="space-y-12">
                    {/* Inner Planets */}
                    <section>
                        <h2 className="text-2xl font-display text-white/80 mb-6 flex items-center gap-3">
                            <span className="w-8 h-[1px] bg-[#D4AF37]" /> The Cosmic Council
                        </h2>
                        <div className="space-y-4">
                            {data.planets.map((planet) => (
                                <PlanetRow key={planet.name} planet={planet} />
                            ))}
                        </div>
                    </section>

                    {/* Nodes */}
                    <section>
                        <h2 className="text-2xl font-display text-white/80 mb-6 flex items-center gap-3">
                            <span className="w-8 h-[1px] bg-purple-500" /> Karmic Axis (Rahu & Ketu)
                        </h2>
                        <div className="bg-purple-900/10 border border-purple-500/20 rounded-3xl p-8 mb-6">
                            <div className="flex items-start gap-4">
                                <AlertCircle className="text-purple-400 shrink-0 mt-1" />
                                <div>
                                    <h4 className="text-purple-200 font-bold mb-2">The Nodes of Destiny</h4>
                                    <p className="text-purple-200/60 text-sm leading-relaxed">
                                        Rahu (North Node) indicates our obsessions and where we are headed in this lifetime,
                                        while Ketu (South Node) represents our past life mastery and what we must release.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {data.nodes.map((node) => (
                                <PlanetRow key={node.name} planet={node} isNode />
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

const PlanetRow = ({ planet, isNode = false }: { planet: PlanetaryBody, isNode?: boolean }) => {
    // Determine orbital speed based on planet
    const getOrbitDuration = (name: string): string => {
        switch (name) {
            case "Mercury": return "4s";
            case "Venus": return "6s";
            case "Mars": return "8s";
            case "Jupiter": return "12s";
            case "Saturn": return "16s";
            case "Rahu":
            case "Ketu": return "18s";
            default: return "10s";
        }
    };

    const duration = getOrbitDuration(planet.name);

    return (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-[#D4AF37]/30 transition-all group">
            <div className="flex items-center gap-4 mb-4 md:mb-0">
                <div className="relative w-14 h-14 flex items-center justify-center mr-2">
                    {/* Orbit Track */}
                    <div className={`absolute inset-0 rounded-full border ${isNode ? 'border-purple-500/20' : 'border-[#D4AF37]/20'} w-full h-full`} />

                    {/* Orbiting Satellite */}
                    <div
                        className="absolute inset-0 animate-spin-slow"
                        style={{ animationDuration: duration }}
                    >
                        <div className={`w-1.5 h-1.5 rounded-full absolute -top-[3px] left-1/2 -translate-x-1/2 shadow-[0_0_8px_currentColor] ${isNode ? 'bg-purple-400 text-purple-400' : 'bg-[#D4AF37] text-[#D4AF37]'}`} />
                    </div>

                    {/* Planet Icon (Center) */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center relative z-10 ${isNode ? 'bg-purple-900/20 text-purple-400' : 'bg-[#D4AF37]/10 text-[#D4AF37]'}`}>
                        <span className="font-display text-lg">{planet.name.charAt(0)}</span>
                    </div>
                </div>
                <div>
                    <h3 className="text-xl font-display flex items-center gap-2">
                        {planet.name}
                        {planet.isRetro && (
                            <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] uppercase tracking-widest rounded-full flex items-center gap-1">
                                <RefreshCw size={10} className="animate-spin-slow" /> Rx
                            </span>
                        )}
                    </h3>
                    <p className="text-xs text-white/40 uppercase tracking-widest">
                        {Math.floor(planet.longitude % 30)}° {Math.floor((planet.longitude % 1) * 60)}'
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-12 w-full md:w-auto justify-between md:justify-end">
                <div className="text-right">
                    <label className="text-[9px] text-white/30 uppercase tracking-widest block mb-1">Zodiac Sign</label>
                    <p className="text-lg font-light">{planet.sign}</p>
                    {planet.dignity && (
                        <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full ${planet.dignity === 'Exalted' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {planet.dignity}
                        </span>
                    )}
                </div>
                <div className="text-right min-w-[120px]">
                    <label className="text-[9px] text-white/30 uppercase tracking-widest block mb-1">Nakshatra</label>
                    <p className="text-lg font-display text-[#D4AF37]">{planet.nakshatra.name}</p>
                    <p className="text-[10px] text-white/40 italic">"{planet.nakshatra.meaning}"</p>
                </div>
            </div>
        </div>
    );
};

export default CosmicDeepDive;
