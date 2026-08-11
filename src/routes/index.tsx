import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { CartDrawer } from '../components/cart/CartDrawer';
import { AdminRoute } from './AdminRoute';

// Lazy-loaded pages
const HomePage         = lazy(() => import('../pages/Home'));
const CatalogPage      = lazy(() => import('../pages/Catalog'));
const ProductDetail    = lazy(() => import('../pages/ProductDetail'));
const AboutPage        = lazy(() => import('../pages/About'));
const ContactPage      = lazy(() => import('../pages/Contact'));
const CheckoutPage     = lazy(() => import('../pages/Checkout'));
const AdminLoginPage   = lazy(() => import('../pages/admin/Login'));
const AdminDashboard   = lazy(() => import('../pages/admin/Dashboard'));
const AdminProducts    = lazy(() => import('../pages/admin/Products'));
const AdminCategories  = lazy(() => import('../pages/admin/Categories'));
const AdminSubcategories = lazy(() => import('../pages/admin/Subcategories'));
const AdminTestimonials  = lazy(() => import('../pages/admin/Testimonials'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div
        className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: 'var(--gold)', borderTopColor: 'transparent' }}
      />
    </div>
  );
}

/** Main store layout with header + footer */
function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <CartDrawer />
      {children}
      <Footer />
    </>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ── Store routes ──────────────────────────────────────────────── */}
        <Route
          path="/"
          element={
            <StoreLayout>
              <HomePage />
            </StoreLayout>
          }
        />
        <Route
          path="/catalog"
          element={
            <StoreLayout>
              <CatalogPage />
            </StoreLayout>
          }
        />
        <Route
          path="/product/:slug"
          element={
            <StoreLayout>
              <ProductDetail />
            </StoreLayout>
          }
        />
        <Route
          path="/about"
          element={
            <StoreLayout>
              <AboutPage />
            </StoreLayout>
          }
        />
        <Route
          path="/contact"
          element={
            <StoreLayout>
              <ContactPage />
            </StoreLayout>
          }
        />
        <Route
          path="/checkout"
          element={
            <StoreLayout>
              <CheckoutPage />
            </StoreLayout>
          }
        />

        {/* ── Admin routes ──────────────────────────────────────────────── */}
        <Route path="/admin" element={<AdminLoginPage />} />
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <AdminRoute>
              <AdminProducts />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <AdminRoute>
              <AdminCategories />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/subcategories"
          element={
            <AdminRoute>
              <AdminSubcategories />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/testimonials"
          element={
            <AdminRoute>
              <AdminTestimonials />
            </AdminRoute>
          }
        />

        {/* 404 */}
        <Route
          path="*"
          element={
            <StoreLayout>
              <div className="page-container py-32 text-center">
                <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '4rem', fontWeight: 300, color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  404
                </h1>
                <p style={{ fontSize: '1.125rem', marginBottom: '2rem' }}>Page not found.</p>
                <a href="/" className="btn-gold inline-block">Go Home</a>
              </div>
            </StoreLayout>
          }
        />
      </Routes>
    </Suspense>
  );
}
