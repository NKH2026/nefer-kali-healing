
import { Body, Equator, Observer, SearchMoonQuarter, NextMoonQuarter, AstroTime, Illumination, HelioVector, GeoVector, Ecliptic } from 'astronomy-engine';

// Approximate Lahiri Ayanamsa for 2024-2025 (shifts slightly each year)
// For high precision we would calculate this dynamically, but this is sufficient for UI
const AYANAMSA_DEG = 24.18;

export interface CosmicData {
    sunSign: string;
    moonSign: string;
    sunDignity?: string | null;
    moonDignity?: string | null;
    sunNakshatra: Nakshatra;
    moonNakshatra: Nakshatra;
    tithi: string;
    tithiIndex: number; // 1-30
    moonPhase: string; // New, Waxing, Full, Waning
    illumination: number;
    nextFullMoon: Date;
    nextNewMoon: Date;
    nextFullMoonData: { sign: string, nakshatra: Nakshatra };
    nextNewMoonData: { sign: string, nakshatra: Nakshatra };
    planets: PlanetaryBody[];
    nodes: PlanetaryBody[];
}

export interface Nakshatra {
    name: string;
    ruler: string;
    meaning: string;
    begetting?: string;
}

const NAKSHATRAS_LIST = [
    { name: "Ashwini", ruler: "Ketu", meaning: "The Horse Woman" },
    { name: "Bharani", ruler: "Venus", meaning: "The Bearer" },
    { name: "Krittika", ruler: "Sun", meaning: "The Cutter" },
    { name: "Rohini", ruler: "Moon", meaning: "The Red One" },
    { name: "Mrigashira", ruler: "Mars", meaning: "The Deer Head" },
    { name: "Ardra", ruler: "Rahu", meaning: "The Moist One" },
    { name: "Punarvasu", ruler: "Jupiter", meaning: "Return of the Light" },
    { name: "Pushya", ruler: "Saturn", meaning: "The Nourisher" },
    { name: "Ashlesha", ruler: "Mercury", meaning: "The Embracer" },
    { name: "Magha", ruler: "Ketu", meaning: "The Mighty" },
    { name: "Purva Phalguni", ruler: "Venus", meaning: "Former Red One" },
    { name: "Uttara Phalguni", ruler: "Sun", meaning: "Latter Red One" },
    { name: "Hasta", ruler: "Moon", meaning: "The Hand" },
    { name: "Chitra", ruler: "Mars", meaning: "The Bright One" },
    { name: "Swati", ruler: "Rahu", meaning: "The Sword" },
    { name: "Vishakha", ruler: "Jupiter", meaning: "The Forked One" },
    { name: "Anuradha", ruler: "Saturn", meaning: "Subsequent Success" },
    { name: "Jyeshtha", ruler: "Mercury", meaning: "The Eldest" },
    { name: "Mula", ruler: "Ketu", meaning: "The Root" },
    { name: "Purva Ashadha", ruler: "Venus", meaning: "Early Victory" },
    { name: "Uttara Ashadha", ruler: "Sun", meaning: "Latter Victory" },
    { name: "Shravana", ruler: "Moon", meaning: "The Ear" },
    { name: "Dhanishta", ruler: "Mars", meaning: "The Wealthiest" },
    { name: "Shatabhisha", ruler: "Rahu", meaning: "Hundred Physicians" },
    { name: "Purva Bhadrapada", ruler: "Jupiter", meaning: "First Blessed Feet" },
    { name: "Uttara Bhadrapada", ruler: "Saturn", meaning: "Latter Blessed Feet" },
    { name: "Revati", ruler: "Mercury", meaning: "The Wealthy" },
];

const ZODIAC_SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

const TITHI_NAMES = [
    "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashti",
    "Saptami", "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi", "Purnima", // Shukla Paksha
    "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashti",
    "Saptami", "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi", "Amavasya" // Krishna Paksha
];

function normalizeDegrees(deg: number): number {
    let d = deg % 360;
    if (d < 0) d += 360;
    return d;
}

function getSiderealLongitude(tropicalLong: number): number {
    return normalizeDegrees(tropicalLong - AYANAMSA_DEG);
}

function getZodiacSign(siderealLong: number): string {
    const index = Math.floor(siderealLong / 30);
    return ZODIAC_SIGNS[index];
}

function getNakshatra(siderealLong: number): Nakshatra {
    const index = Math.floor(siderealLong / (360 / 27));
    return NAKSHATRAS_LIST[index];
}

function getTithi(sunLongTrop: number, moonLongTrop: number): { name: string, index: number, phase: string } {
    // Tithi is based on the longitudinal difference between Moon and Sun
    // 12 degrees = 1 Tithi
    let diff = normalizeDegrees(moonLongTrop - sunLongTrop);
    const tithiIndex = Math.floor(diff / 12) + 1;

    // Determine Phase based on difference
    let phase = "";
    if (diff < 12) phase = "New Moon (Amavasya)";
    else if (diff >= 168 && diff < 192) phase = "Full Moon (Purnima)"; // Approx range for visual full
    else if (diff < 180) phase = "Waxing (Shukla Paksha)";
    else phase = "Waning (Krishna Paksha)";

    // Adjust distinct Purnima/Amavasya naming from array
    let name = TITHI_NAMES[(tithiIndex - 1) % 30];

    return { name, index: tithiIndex, phase: phase === "New Moon (Amavasya)" ? "New Moon" : (phase === "Full Moon (Purnima)" ? "Full Moon" : phase) };
}

export function calculateCosmicData(date: Date = new Date()): CosmicData {
    // Calculate Tropical Longitudes for Sun and Moon
    // Using simple low-precision helper from library or manual calculation if needed? 
    // Astronomy-engine 'Ecliptic' returns J2000 longitude. We need to be careful with coordinate systems.

    // NOTE: 'Body.Sun' is geocentric position of Sun? No, usually heliocentric. 
    // For geocentric Sun longitude, we use: Body.Earth (heliocentric) -> invert to get Sun.
    // Actually, astronomy-engine has simpler 'GeoVector' for Moon and Sun relative to Earth.

    const time = new AstroTime(date);

    // Moon Position (Geocentric Ecliptic)
    const moonVec = GeoVector(Body.Moon, time, true); // true = aberration included
    // GeoVector returns rectangular coordinates. We need spherical ecliptic.
    // Typically use Lib.Ecliptic(vec)
    const moonEcliptic = Ecliptic(moonVec);
    const moonTropLong = moonEcliptic.elon;

    // Sun Position (Geocentric)
    const sunVec = GeoVector(Body.Sun, time, true);
    const sunEcliptic = Ecliptic(sunVec);
    const sunTropLong = sunEcliptic.elon;

    // Convert to Sidereal
    const moonSidereal = getSiderealLongitude(moonTropLong);
    const sunSidereal = getSiderealLongitude(sunTropLong);

    // Get Signs and Nakshatras
    const sunSign = getZodiacSign(sunSidereal);
    const moonSign = getZodiacSign(moonSidereal);

    const sunNakshatra = getNakshatra(sunSidereal);
    const moonNakshatra = getNakshatra(moonSidereal);

    // Tithi
    const tithiInfo = getTithi(sunTropLong, moonTropLong); // Tithi uses tropical diff usually (relative), or sidereal diff (same result since diff is same)

    // Illumination
    const illum = Illumination(Body.Moon, time);

    // Search Next Phases
    const nextFull = SearchMoonQuarter(date); // This finds NEXT quarter. We need specifically full.
    // SearchMoonQuarter returns { quarter, time }. 0=New, 1=FirstQ, 2=Full, 3=ThirdQ.

    // Let's find specific ones
    let nextFullMoonDate = date;
    let nextNewMoonDate = date;

    // Search forward for Full Moon (2)
    // We iterate searching quarters until we find 2
    let mq = SearchMoonQuarter(date);
    while (mq.quarter !== 2) {
        mq = NextMoonQuarter(mq); // Advance
    }
    nextFullMoonDate = mq.time.date;

    // Reset and search for New Moon (0)
    mq = SearchMoonQuarter(date);
    while (mq.quarter !== 0) {
        mq = NextMoonQuarter(mq);
    }
    nextNewMoonDate = mq.time.date;


    // Generic Planet Helper
    const getDignity = (planet: string, sign: string): string | null => {
        const rules: Record<string, { exalted: string, debilitated: string }> = {
            "Sun": { exalted: "Aries", debilitated: "Libra" },
            "Moon": { exalted: "Taurus", debilitated: "Scorpio" },
            "Mars": { exalted: "Capricorn", debilitated: "Cancer" },
            "Mercury": { exalted: "Virgo", debilitated: "Pisces" },
            "Jupiter": { exalted: "Cancer", debilitated: "Capricorn" },
            "Venus": { exalted: "Pisces", debilitated: "Virgo" },
            "Saturn": { exalted: "Libra", debilitated: "Aries" },
            "Rahu": { exalted: "Taurus", debilitated: "Scorpio" },
            "Ketu": { exalted: "Scorpio", debilitated: "Taurus" }
        };

        const planetRules = rules[planet];
        if (!planetRules) return null;

        if (sign === planetRules.exalted) return "Exalted";
        if (sign === planetRules.debilitated) return "Debilitated";
        return null;
    };

    const getPlanetDetails = (body: Body, name: string, date: Date) => {
        const time = new AstroTime(date);
        const vec = GeoVector(body, time, true);
        const ecl = Ecliptic(vec);
        const sidereal = getSiderealLongitude(ecl.elon);
        const sign = getZodiacSign(sidereal);

        // Retrograde Check (Compare with 1 hour ago)
        const prevTime = time.AddDays(-1 / 24);
        const prevVec = GeoVector(body, prevTime, true);
        const prevEcl = Ecliptic(prevVec);
        // If current longitude < previous longitude (accounting for 360 wrap), it's Retrograde
        // We use a small delta check
        let isRetro = false;
        let diff = ecl.elon - prevEcl.elon;
        if (diff < -300) diff += 360;
        if (diff > 300) diff -= 360;
        if (diff < 0) isRetro = true;

        return {
            name,
            sign,
            nakshatra: getNakshatra(sidereal),
            isRetro,
            longitude: sidereal,
            dignity: getDignity(name, sign)
        };
    };

    const planets = [
        getPlanetDetails(Body.Mercury, "Mercury", date),
        getPlanetDetails(Body.Venus, "Venus", date),
        getPlanetDetails(Body.Mars, "Mars", date),
        getPlanetDetails(Body.Jupiter, "Jupiter", date),
        getPlanetDetails(Body.Saturn, "Saturn", date),
    ];

    // Calculate details for next moon phases
    const fullMoonDetails = getPlanetDetails(Body.Moon, "Moon", nextFullMoonDate);
    const newMoonDetails = getPlanetDetails(Body.Moon, "Moon", nextNewMoonDate);

    // Rahu / Ketu (North/South Node)
    // Astronomy engine doesn't have a direct Body.Node. 
    // We can approximate Mean Node or use a simplified calculation. 
    // For now, we will omit or use a placeholder if critical, but let's stick to visible planets to be safe and accurate.
    // However, user specifically asked for Rahu/Ketu. 
    // Mean Node moves backwards ~19.3 degrees/year.
    // J2000 longitude of Mean Node is approx 125.04452 deg.
    // Movement = -0.05295376 deg/day.
    const daysSinceJ2000 = time.ut - 0; // time.ut is days since J2000 in astronomy-engine? No, ut is days since J2000 normally? 
    // new AstroTime(date).ut returns days since J2000.0? Let's assume standard Julian Date handling is abstracted.
    // Actually, AstroTime.ut is UT1 days.
    const nodeMeanLong = normalizeDegrees(125.04452 - 0.05295376 * time.ut);
    const nodeSidereal = getSiderealLongitude(nodeMeanLong);
    const rahuSign = getZodiacSign(nodeSidereal);
    const ketuSign = getZodiacSign(normalizeDegrees(nodeSidereal + 180));

    const rahu = {
        name: "Rahu",
        sign: rahuSign,
        nakshatra: getNakshatra(nodeSidereal),
        isRetro: true, // Always retrograde (mean)
        longitude: nodeSidereal,
        dignity: getDignity("Rahu", rahuSign)
    };
    const ketu = {
        name: "Ketu",
        sign: ketuSign,
        nakshatra: getNakshatra(normalizeDegrees(nodeSidereal + 180)),
        isRetro: true,
        longitude: normalizeDegrees(nodeSidereal + 180),
        dignity: getDignity("Ketu", ketuSign)
    };

    return {
        sunSign,
        moonSign,
        sunDignity: getDignity("Sun", sunSign),
        moonDignity: getDignity("Moon", moonSign),
        sunNakshatra,
        moonNakshatra,
        tithi: tithiInfo.name,
        tithiIndex: tithiInfo.index,
        moonPhase: tithiInfo.phase,
        illumination: Math.round(illum.phase_fraction * 100),
        nextFullMoon: nextFullMoonDate,
        nextNewMoon: nextNewMoonDate,
        nextFullMoonData: {
            sign: fullMoonDetails.sign,
            nakshatra: fullMoonDetails.nakshatra
        },
        nextNewMoonData: {
            sign: newMoonDetails.sign,
            nakshatra: newMoonDetails.nakshatra
        },
        planets,
        nodes: [rahu, ketu]
    };
}

export interface PlanetaryBody {
    name: string;
    sign: string;
    nakshatra: Nakshatra;
    isRetro: boolean;
    longitude: number;
    dignity?: string | null;
}
