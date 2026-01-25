
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CartIcon } from './cart';
import { Menu, X } from 'lucide-react';

const navItems = [
  { label: 'Home', id: 'home', path: '/' },
  { label: 'Our Journey', id: 'journey', path: '/about' },
  { label: 'Support', id: 'support', path: '/support' },
  { label: 'Community', id: 'community', path: '/community' },
  { label: 'Offerings', id: 'wellness', path: '/offerings' },
  { label: 'Wisdom', id: 'wisdom', path: '/wisdom' },
  { label: 'Healing Guides', id: 'guides', path: '/healing-guides' },
  { label: 'Planetary', id: 'planetary', path: '/sky-watch' }
];

const Navbar: React.FC = () => {
  const { pathname } = useLocation();
  const isHome = pathname === '/';
  const isAdmin = pathname.startsWith('/admin');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  if (isAdmin) return null;

  return (
    <>
      <nav className="fixed top-0 left-0 w-full z-[100] px-4 md:px-8 py-4 md:py-6 flex justify-between items-center pointer-events-none">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 md:gap-4 pointer-events-auto group cursor-pointer">
          <div
            id="nav-sun-dock"
            className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-tr from-[#D4AF37] to-[#8B7322] shadow-[0_0_15px_#D4AF37] opacity-0"
          />
          <h2 className="text-lg md:text-xl font-display uppercase tracking-[0.15em] md:tracking-[0.2em] text-[#D4AF37]">
            Nefer Kali Healing
          </h2>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-8 pointer-events-auto items-center">
          {navItems.map((item) => (
            item.path ? (
              <Link
                key={item.id}
                to={item.path}
                className={`text-[10px] uppercase tracking-widest transition-colors ${pathname === item.path ? 'text-[#D4AF37]' : 'text-white/60 hover:text-[#D4AF37]'}`}
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.id}
                href={isHome ? `#${item.id}` : `/#${item.id}`}
                className="text-[10px] uppercase tracking-widest text-white/60 hover:text-[#D4AF37] transition-colors"
              >
                {item.label}
              </a>
            )
          ))}
          <CartIcon />
        </div>

        {/* Mobile Controls - Cart + Hamburger */}
        <div className="flex md:hidden items-center gap-2 pointer-events-auto">
          <CartIcon />
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 text-white/70 hover:text-[#D4AF37] transition-colors"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-[150] transition-opacity duration-300 md:hidden ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Mobile Menu Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-[280px] bg-[#0a0a0a] border-l border-white/10 z-[200] transform transition-transform duration-300 ease-out md:hidden ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        {/* Close Button */}
        <div className="flex justify-end p-4">
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 text-white/70 hover:text-[#D4AF37] transition-colors"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        {/* Mobile Nav Links */}
        <nav className="px-6 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.id}>
                <Link
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block py-3 px-4 text-sm uppercase tracking-widest transition-colors rounded-lg ${pathname === item.path
                      ? 'text-[#D4AF37] bg-[#D4AF37]/10'
                      : 'text-white/60 hover:text-[#D4AF37] hover:bg-white/5'
                    }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Mobile Menu Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-white/10">
          <p className="text-[9px] uppercase tracking-widest text-white/30 text-center">
            Nefer Kali Healing & Spiritual Education
          </p>
        </div>
      </div>
    </>
  );
};

export default Navbar;

