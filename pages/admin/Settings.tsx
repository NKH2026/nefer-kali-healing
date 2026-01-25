import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ToggleLeft, ToggleRight, Save, AlertCircle, Check } from 'lucide-react';

interface VacationSettings {
    enabled: boolean;
    message: string;
}

const Settings = () => {
    const [vacationMode, setVacationMode] = useState<VacationSettings>({
        enabled: false,
        message: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('site_settings')
                .select('value')
                .eq('key', 'vacation_mode')
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            if (data) {
                setVacationMode(data.value as VacationSettings);
            }
        } catch (err: any) {
            console.error('Error fetching settings:', err);
            setError('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setSaveSuccess(false);
        setError(null);

        try {
            const { error } = await supabase
                .from('site_settings')
                .upsert({
                    key: 'vacation_mode',
                    value: vacationMode,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'key'
                });

            if (error) throw error;

            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err: any) {
            console.error('Error saving settings:', err);
            setError('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="text-white font-urbanist">Loading settings...</div>;
    }

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-cinzel text-white mb-2">Site Settings</h2>
                <p className="text-gray-400 font-urbanist">Configure site-wide settings and notifications.</p>
            </div>

            {error && (
                <div className="flex items-center gap-2 p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-red-300 font-urbanist">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    {error}
                </div>
            )}

            {saveSuccess && (
                <div className="flex items-center gap-2 p-4 bg-green-900/20 border border-green-500/30 rounded-xl text-green-300 font-urbanist">
                    <Check className="w-5 h-5 flex-shrink-0" />
                    Settings saved successfully!
                </div>
            )}

            {/* Vacation Mode Section */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-cinzel text-white mb-1">Vacation Mode</h3>
                        <p className="text-gray-400 font-urbanist text-sm">
                            Display a banner on the Home and Offerings pages when you're away.
                        </p>
                    </div>
                    <button
                        onClick={() => setVacationMode(prev => ({ ...prev, enabled: !prev.enabled }))}
                        className="relative focus:outline-none"
                        aria-label={vacationMode.enabled ? 'Disable vacation mode' : 'Enable vacation mode'}
                    >
                        {vacationMode.enabled ? (
                            <ToggleRight className="w-12 h-12 text-purple-400 transition-colors" />
                        ) : (
                            <ToggleLeft className="w-12 h-12 text-gray-500 transition-colors" />
                        )}
                    </button>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-urbanist text-gray-300">
                        Vacation Message
                    </label>
                    <textarea
                        value={vacationMode.message}
                        onChange={(e) => setVacationMode(prev => ({ ...prev, message: e.target.value }))}
                        placeholder="e.g., We're taking a short break! Orders will resume on February 15th."
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white font-urbanist placeholder:text-gray-500 focus:border-purple-500/50 focus:outline-none resize-none transition-colors"
                        rows={3}
                    />
                    <p className="text-xs text-gray-500 font-urbanist">
                        This message will be displayed in a banner across the site when vacation mode is enabled.
                    </p>
                </div>

                {/* Preview */}
                {vacationMode.enabled && vacationMode.message && (
                    <div className="space-y-2">
                        <label className="block text-sm font-urbanist text-gray-300">Preview</label>
                        <div className="bg-gradient-to-r from-amber-900/40 via-amber-800/30 to-amber-900/40 border border-amber-500/30 rounded-lg px-4 py-3">
                            <p className="text-amber-200 font-urbanist text-center">
                                ✨ {vacationMode.message}
                            </p>
                        </div>
                    </div>
                )}

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 disabled:cursor-not-allowed rounded-lg font-urbanist font-medium transition-colors"
                >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>
        </div>
    );
};

export default Settings;
