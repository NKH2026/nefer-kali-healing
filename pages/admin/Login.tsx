import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Loader2 } from 'lucide-react';

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [factorId, setFactorId] = useState('');
    const [factors, setFactors] = useState<{ id: string; friendly_name?: string }[]>([]);
    const [setup, setSetup] = useState<{ qr: string; secret: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    async function prepareMfa() {
        const identity = await supabase.rpc('is_admin_identity');
        if (identity.error) throw new Error('Unable to check admin access. Please try again or contact the site owner.');
        if (identity.data !== true) {
            await supabase.auth.signOut({ scope: 'local' });
            throw new Error('This account does not have admin access.');
        }
        const assurance = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (assurance.error) throw assurance.error;
        if (assurance.data.currentLevel === 'aal2') {
            navigate('/admin/dashboard', { replace: true });
            return;
        }
        const listed = await supabase.auth.mfa.listFactors();
        if (listed.error) throw listed.error;
        if (listed.data.totp.length) {
            setFactors(listed.data.totp);
            setFactorId(listed.data.totp[0].id);
            return;
        }
        for (const factor of listed.data.all) {
            if (factor.factor_type === 'totp' && factor.status === 'unverified') {
                const removed = await supabase.auth.mfa.unenroll({ factorId: factor.id });
                if (removed.error) throw removed.error;
            }
        }
        const enrolled = await supabase.auth.mfa.enroll({ factorType: 'totp', issuer: 'Nefer Kali Healing' });
        if (enrolled.error) throw enrolled.error;
        setFactorId(enrolled.data.id);
        setSetup({ qr: enrolled.data.totp.qr_code, secret: enrolled.data.totp.secret });
    }

    useEffect(() => {
        let active = true;
        supabase.auth.getSession().then(async ({ data, error }) => {
            if (error) throw error;
            if (active && data.session) await prepareMfa();
        }).catch(err => { if (active) setError(err.message); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, []);

    async function submit(event: React.FormEvent) {
        event.preventDefault(); setLoading(true); setError('');
        try {
            if (!factorId) {
                const result = await supabase.auth.signInWithPassword({ email, password });
                if (result.error) throw result.error;
                setPassword('');
                await prepareMfa();
            } else {
                const result = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
                if (result.error) throw result.error;
                const admin = await supabase.rpc('is_admin');
                if (admin.error || admin.data !== true) throw new Error('Unable to confirm admin access. Please sign in again.');
                setSetup(null); setCode('');
                navigate('/admin/dashboard', { replace: true });
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to sign in. Please try again.');
            setCode('');
        } finally { setLoading(false); }
    }

    async function signOut() {
        setLoading(true);
        const result = await supabase.auth.signOut({ scope: 'local' });
        if (result.error) { setError(result.error.message); setLoading(false); return; }
        setSetup(null); setCode(''); setFactorId(''); setFactors([]); setError(''); setLoading(false);
    }
    const inputClass = 'w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500';
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
            <div className="text-center mb-8">
                <h1 className="font-cinzel text-3xl text-white mb-2">Admin Portal</h1>
                <p className="text-gray-400">{!factorId ? 'Sign in to continue to two-factor authentication' : setup ? 'Set up two-factor authentication' : 'Enter your authenticator code'}</p>
            </div>
            {error && <div role="alert" className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-200 text-sm">{error}</div>}
            <form onSubmit={submit} className="space-y-6">
                {!factorId ? <>
                    <div><label htmlFor="admin-email" className="block text-gray-300 mb-2">Email</label><input id="admin-email" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} required disabled={loading} /></div>
                    <div><label htmlFor="admin-password" className="block text-gray-300 mb-2">Password</label><input id="admin-password" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} className={inputClass} required disabled={loading} /></div>
                </> : <>
                    {setup && <div className="space-y-4 text-gray-300 text-sm">
                        <p>Scan this QR code with your authenticator app, then enter its six-digit code to finish setup.</p>
                        <img src={setup.qr.startsWith('data:') ? setup.qr : `data:image/svg+xml;charset=utf-8,${encodeURIComponent(setup.qr)}`} alt="Scan to set up your admin authenticator" className="mx-auto w-56 h-56 bg-white p-3 rounded-lg" />
                        <details><summary className="cursor-pointer">Can’t scan the code?</summary><p className="mt-2">Enter this setup key manually:</p><code className="block break-all mt-2 select-all">{setup.secret}</code></details>
                        <p>Keep access to your authenticator or its secure backup. If you lose it, the site owner must reset your factor in Supabase.</p>
                    </div>}
                    {factors.length > 1 && <div><label htmlFor="admin-factor" className="block text-gray-300 mb-2">Authenticator</label><select id="admin-factor" className={inputClass} value={factorId} onChange={e => { setFactorId(e.target.value); setCode(''); }} disabled={loading}>{factors.map((factor, index) => <option key={factor.id} value={factor.id}>{factor.friendly_name || `Authenticator ${index + 1}`}</option>)}</select></div>}
                    <div><label htmlFor="admin-code" className="block text-gray-300 mb-2">Authenticator code</label><input id="admin-code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} className={inputClass} placeholder="000000" required disabled={loading} /></div>
                </>}
                <button type="submit" disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">{loading ? <Loader2 aria-label="Signing in" className="w-5 h-5 animate-spin" /> : !factorId ? 'Continue' : setup ? 'Enable 2FA and Sign In' : 'Verify and Sign In'}</button>
                {factorId && <button type="button" disabled={loading} onClick={signOut} className="w-full text-gray-400 hover:text-white disabled:opacity-50">Sign out and use another account</button>}
            </form>
        </div>
    </div>;
}
