
import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import Hero from '../components/Hero';
import Section from '../components/Section';
import WombOfOfferings from '../components/WombOfOfferings';
import CosmicFeed from '../components/CosmicFeed';
import VacationBanner from '../components/VacationBanner';
import { DESTINY_PATHS } from '../constants';

const Home: React.FC = () => {
    const mainRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            // Basic smooth scroll setup or custom animations if needed
        }, mainRef);

        return () => ctx.revert();
    }, []);

    return (
        <>
            <VacationBanner />
            <div ref={mainRef}>
                <Hero />

                <div id="sections-container" className="relative z-10">
                    <Section
                        id="journey"
                        path={DESTINY_PATHS[0]}
                        content="Our mission is to provide accessible spiritual education and natural wellness to underserved communities through the synthesis of Kemetic, Orisha, and Vedic wisdom."
                        href="/about"
                    />

                    <Section
                        id="support"
                        path={DESTINY_PATHS[1]}
                        content="Support our nonprofit foundation. Your contributions help fund community workshops, herbal distributions, and the preservation of sacred indigenous knowledge."
                        href="/support"
                    />

                    <Section
                        id="community"
                        path={DESTINY_PATHS[2]}
                        content="Join the Unity Circle. Monthly gatherings, shared rituals, and a support network dedicated to collective evolution and soulful connection."
                        href="/community"
                    />

                    <WombOfOfferings id="wellness" path={DESTINY_PATHS[3]} />

                    <CosmicFeed id="wisdom" path={DESTINY_PATHS[4]} />
                </div>
            </div>
        </>
    );
};

export default Home;
