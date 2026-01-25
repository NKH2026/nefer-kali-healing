import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface VacationSettings {
    enabled: boolean;
    message: string;
}

const VacationBanner: React.FC = () => {
    const [settings, setSettings] = useState<VacationSettings | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVacationMode = async () => {
            try {
                const { data, error } = await supabase
                    .from('site_settings')
                    .select('value')
                    .eq('key', 'vacation_mode')
                    .single();

                if (error) {
                    setLoading(false);
                    return;
                }

                if (data) {
                    setSettings(data.value as VacationSettings);
                }
            } catch (err) {
                console.error('Error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchVacationMode();
    }, []);

    // Don't render anything while loading or if vacation mode is disabled/has no message
    if (loading || !settings?.enabled || !settings?.message) {
        return null;
    }

    return (
        <div style={{
            background: 'linear-gradient(to right, rgba(146, 64, 14, 0.6), rgba(120, 53, 15, 0.5), rgba(146, 64, 14, 0.6))',
            borderBottom: '1px solid rgba(217, 119, 6, 0.3)',
            padding: '12px 16px',
            textAlign: 'center'
        }}>
            <p style={{
                color: '#fef3c7',
                fontFamily: 'Urbanist, sans-serif',
                fontSize: '14px',
                margin: 0
            }}>
                ✨ {settings.message} ✨
            </p>
        </div>
    );
};

export default VacationBanner;
