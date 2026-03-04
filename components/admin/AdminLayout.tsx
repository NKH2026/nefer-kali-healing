import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { LayoutDashboard, FileText, ShoppingBag, MessageSquare, LogOut, Home, Tag, Calendar, Package, RefreshCw, Settings, Menu, X } from 'lucide-react';

const AdminLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/admin/login');
    };

    const navItems = [
        { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/admin/orders', icon: Package, label: 'Orders' },
        { path: '/admin/subscriptions', icon: RefreshCw, label: 'Subscriptions' },
        { path: '/admin/products', icon: ShoppingBag, label: 'Products' },
        { path: '/admin/blog', icon: FileText, label: 'Blog Posts' },
        { path: '/admin/events', icon: Calendar, label: 'Events' },
        { path: '/admin/coupons', icon: Tag, label: 'Coupons' },
        { path: '/admin/reviews', icon: MessageSquare, label: 'Reviews' },
        { path: '/admin/settings', icon: Settings, label: 'Settings' },
    ];

    // Close sidebar when navigating on mobile
    React.useEffect(() => {
        setIsSidebarOpen(false);
    }, [location.pathname]);

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white flex relative">
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-black/90 backdrop-blur-md border-b border-white/10 p-4 flex items-center justify-between">
                <h1 className="text-lg font-cinzel text-purple-400 font-bold tracking-wider">NKH Admin</h1>
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 text-gray-400 hover:text-white"
                >
                    {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/80 z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                w-64 border-r border-white/10 bg-black/95 backdrop-blur-md fixed h-full z-50 transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="p-6 hidden lg:block">
                    <h1 className="text-xl font-cinzel text-purple-400 font-bold tracking-wider">NKH Admin</h1>
                </div>

                <div className="p-6 lg:hidden flex justify-between items-center border-b border-white/10 mb-4">
                    <span className="text-gray-400 font-urbanist text-sm">Menu</span>
                    <button onClick={() => setIsSidebarOpen(false)} className="text-gray-400">
                        <X size={20} />
                    </button>
                </div>

                <nav className="px-4 space-y-2 lg:mt-4 overflow-y-auto max-h-[calc(100vh-140px)]">
                    {navItems.map((item) => {
                        const isActive = location.pathname.startsWith(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${isActive
                                    ? 'bg-purple-900/30 text-purple-300 border border-purple-500/30'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <item.icon className="w-5 h-5" />
                                <span className="font-urbanist">{item.label}</span>
                            </Link>
                        )
                    })}
                </nav>

                <div className="absolute bottom-0 w-full p-4 border-t border-white/10 space-y-2 bg-black/95">
                    <Link
                        to="/"
                        className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <Home className="w-5 h-5" />
                        <span className="font-urbanist">View Site</span>
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-900/10 rounded-lg transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-urbanist">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 w-full lg:ml-64 p-4 lg:p-8 pt-20 lg:pt-8 min-h-screen">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
