import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Support from './pages/Support';
import Community from './pages/Community';
import EventDetail from './pages/EventDetail';
import About from './pages/About';
import Wisdom from './pages/Wisdom';
import BlogPost from './pages/BlogPost';
import CosmicReadings from './pages/CosmicReadings';
import CosmicDeepDive from './pages/CosmicDeepDive';
import OrderConfirmation from './pages/OrderConfirmation';
import HealingGuides from './pages/HealingGuides';
import SeaMossGuide from './pages/guides/SeaMossGuide';
import HetHerWombPlusTeaGuide from './pages/guides/HetHerWombPlusTeaGuide';
import StJohnsBushTeaGuide from './pages/guides/StJohnsBushTeaGuide';
import HetHerWombPlusExtractGuide from './pages/guides/HetHerWombPlusExtractGuide';
import BalanceTinctureGuide from './pages/guides/BalanceTinctureGuide';
import RohiniTinctureGuide from './pages/guides/RohiniTinctureGuide';
import HetHerWombTinctureGuide from './pages/guides/HetHerWombTinctureGuide';
import CreosoteBushGuide from './pages/guides/CreosoteBushGuide';
import DreamElixirGuide from './pages/guides/DreamElixirGuide';
import UatchetGuide from './pages/guides/UatchetGuide';
import GullyRootGuide from './pages/guides/GullyRootGuide';
import CashewBarkGuide from './pages/guides/CashewBarkGuide';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsAndConditions from './pages/TermsAndConditions';

// Cart
import { CartProvider, CartDrawer } from './components/cart';

// Admin Imports
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import Blog from './pages/admin/Blog';
import Products from './pages/admin/Products';
import Events from './pages/admin/Events';
import Coupons from './pages/admin/Coupons';
import Reviews from './pages/admin/Reviews';
import Orders from './pages/admin/Orders';
import AdminSubscriptions from './pages/admin/Subscriptions';
import AdminSettings from './pages/admin/Settings';
import AdminLayout from './components/admin/AdminLayout';
import ProtectedRoute from './components/admin/ProtectedRoute';


gsap.registerPlugin(ScrollTrigger);

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

import { supabase } from './lib/supabase';

const App: React.FC = () => {
  console.log('--- App component rendering ---');
  React.useEffect(() => {
    const checkConnection = async () => {
      console.log('Checking Supabase connection...');
      try {
        const { data, error } = await supabase.from('blog_posts').select('count').limit(1);
        if (error) {
          console.error('Supabase Connection Error:', error.message);
        } else {
          console.log('✅ Supabase Connection Successful! Database is reachable.');
        }
      } catch (err: any) {
        console.error('Supabase Connection Exception:', err.message);
      }
    };
    checkConnection();
  }, []);
  return (
    <CartProvider>
      <Router>
        <ScrollToTop />
        <div className="relative bg-[#0a0a0a] text-white overflow-x-hidden">
          <Navbar />
          <CartDrawer />

          <main className="overflow-x-hidden">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/offerings" element={<Shop />} />
              <Route path="/offerings/:slug" element={<ProductDetail />} />
              <Route path="/support" element={<Support />} />
              <Route path="/community" element={<Community />} />
              <Route path="/community/events/:eventId" element={<EventDetail />} />
              <Route path="/wisdom" element={<Wisdom />} />
              <Route path="/wisdom/:slug" element={<BlogPost />} />
              <Route path="/sky-watch" element={<CosmicReadings />} />
              <Route path="/cosmic-deep-dive" element={<CosmicDeepDive />} />
              <Route path="/order-confirmation" element={<OrderConfirmation />} />
              <Route path="/healing-guides" element={<HealingGuides />} />
              <Route path="/guides/sea-moss" element={<SeaMossGuide />} />
              <Route path="/guides/het-her-womb-plus-tea" element={<HetHerWombPlusTeaGuide />} />
              <Route path="/guides/st-johns-bush-tea" element={<StJohnsBushTeaGuide />} />
              <Route path="/guides/het-her-womb-plus-extract" element={<HetHerWombPlusExtractGuide />} />
              <Route path="/guides/balance-tincture" element={<BalanceTinctureGuide />} />
              <Route path="/guides/rohini-tincture" element={<RohiniTinctureGuide />} />
              <Route path="/guides/het-her-womb-tincture" element={<HetHerWombTinctureGuide />} />
              <Route path="/guides/creosote-bush" element={<CreosoteBushGuide />} />
              <Route path="/guides/dream-elixir" element={<DreamElixirGuide />} />
              <Route path="/guides/uatchet" element={<UatchetGuide />} />
              <Route path="/guides/gully-root" element={<GullyRootGuide />} />
              <Route path="/guides/cashew-bark" element={<CashewBarkGuide />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsAndConditions />} />

              {/* Admin Routes */}
              <Route path="/admin/login" element={<Login />} />
              <Route path="/admin" element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="blog" element={<Blog />} />
                <Route path="products" element={<Products />} />
                <Route path="events" element={<Events />} />
                <Route path="coupons" element={<Coupons />} />
                <Route path="reviews" element={<Reviews />} />
                <Route path="orders" element={<Orders />} />
                <Route path="subscriptions" element={<AdminSubscriptions />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>
            </Routes>
          </main>

          <Footer />
        </div>
      </Router>
    </CartProvider>
  );
};

export default App;

