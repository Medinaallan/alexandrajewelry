import { lazy, Suspense } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
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
const AdminStock         = lazy(() => import('../pages/admin/Stock'));
const AdminStockMovements = lazy(() => import('../pages/admin/StockMovements'));
const AdminSales         = lazy(() => import('../pages/admin/Sales'));
const AdminSalesHistory  = lazy(() => import('../pages/admin/SalesHistory'));
const AdminReports       = lazy(() => import('../pages/admin/Reports'));
const AdminOrders        = lazy(() => import('../pages/admin/Orders'));

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

/** Shown when the catalog could not be loaded from the API */
function CatalogErrorBanner() {
  const { error, loading, refetch } = useData();
  const { t } = useLanguage();
  if (!error) return null;
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-center gap-4 px-4 py-3 text-center"
      style={{ background: 'rgba(239,68,68,0.08)', borderBottom: '1px solid rgba(239,68,68,0.25)', fontSize: '0.875rem' }}
    >
      <span>{t('common.loadError')}</span>
      <button
        type="button"
        disabled={loading}
        onClick={() => void refetch()}
        className="text-xs uppercase tracking-widest underline hover:text-(--gold) transition-colors"
      >
        {loading ? t('common.loading') : t('common.retry')}
      </button>
    </div>
  );
}

function NotFoundPage() {
  const { t } = useLanguage();
  return (
    <div className="page-container py-32 text-center">
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '4rem', fontWeight: 300, color: 'var(--text-muted)', marginBottom: '1rem' }}>
        404
      </h1>
      <p style={{ fontSize: '1.125rem', marginBottom: '2rem' }}>{t('notFound.message')}</p>
      <Link to="/" className="btn-gold inline-block">{t('notFound.goHome')}</Link>
    </div>
  );
}

/** Main store layout with header + footer */
function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <CatalogErrorBanner />
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
        <Route
          path="/admin/orders"
          element={
            <AdminRoute>
              <AdminOrders />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/stock"
          element={
            <AdminRoute>
              <AdminStock />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/stock/movements"
          element={
            <AdminRoute>
              <AdminStockMovements />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/sales"
          element={
            <AdminRoute>
              <AdminSales />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/sales/history"
          element={
            <AdminRoute>
              <AdminSalesHistory />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <AdminRoute>
              <AdminReports />
            </AdminRoute>
          }
        />

        {/* 404 */}
        <Route
          path="*"
          element={
            <StoreLayout>
              <NotFoundPage />
            </StoreLayout>
          }
        />
      </Routes>
    </Suspense>
  );
}
