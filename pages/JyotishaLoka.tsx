import React, { useEffect, useRef } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
// The world itself is plain JavaScript (jyotisha-loka/), adapted from the Per Ankh
// realm; this page only gives it somewhere to live and a way out.
// @ts-ignore â€” untyped JS module
import { bootJyotishaLoka } from '../jyotisha-loka/boot.js';

/**
 * Jyotisha Loka â€” the world of light: the nine grahas at their real positions,
 * the panchanga, the Jyotish lessons, and Maa Kali dancing on the flying carpet.
 * Administrators only for now (the route sits behind ProtectedRoute).
 *
 * `?tour=1` opens the home-page prototype instead of the realm: the same world,
 * but with no body and no free movement â€” a camera rig flies between three
 * stops. It exists to answer one question before any content is built: does the
 * motion feel good?
 */
const JyotishaLoka: React.FC = () => {
  const mount = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const mode = params.get('tour') === '1' ? 'tour' : 'explore';
  /**
   * ?tour=1 here is retired. This page is the bare world with a stop bar — it
   * has no page content — and it is not what the tour became. Sending it to the
   * real thing is kinder than leaving two tour pages that look similar and
   * behave differently.
   */
  const retiredTour = mode === 'tour';

  useEffect(() => {
    if (!mount.current || retiredTour) return undefined;
    let dispose: (() => void) | null = null;
    try {
      dispose = bootJyotishaLoka({
        mount: mount.current,
        onExit: () => navigate('/admin/dashboard'),
        mode,
      });
    } catch (err) {
      console.error('[Jyotisha Loka] could not open:', err);
      if (mount.current) {
        mount.current.innerHTML = '<p style="padding:2rem;color:#f1d38a">Jyotisha Loka could not open on this device (it needs WebGL).</p>';
      }
    }
    return () => { dispose?.(); };
  }, [navigate, mode]);

  if (retiredTour) return <Navigate to="/?loka=1" replace />;

  return <div ref={mount} className="fixed inset-0 bg-[#05021a]" aria-label="Jyotisha Loka" />;
};

export default JyotishaLoka;
