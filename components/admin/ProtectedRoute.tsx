import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);

    useEffect(() => {
        let active = true;
        let revision = 0;
        const checkAuth = async () => {
            const current = ++revision;
            try {
                const { data, error } = await supabase.auth.getSession();
                const admin = !error && data.session ? await supabase.rpc('is_admin') : null;
                if (active && current === revision) setAuthenticated(admin?.data === true && !admin.error);
            } catch {
                if (active && current === revision) setAuthenticated(false);
            } finally {
                if (active && current === revision) setLoading(false);
            }
        };

        checkAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            setAuthenticated(false);
            setLoading(true);
            // Avoid re-entering the auth lock from its callback.
            setTimeout(() => { if (active) void checkAuth(); }, 0);
        });

        return () => { active = false; subscription.unsubscribe(); };
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">
                <div className="animate-pulse">Loading Admin...</div>
            </div>
        );
    }

    if (!authenticated) {
        return <Navigate to="/admin/login" replace />;
    }

    return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
