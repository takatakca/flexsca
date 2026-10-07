import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import { captureAttribution } from "@/lib/lead-intake";
import MerchantLayout from "@/components/MerchantLayout";

const Admin = lazy(() => import("@/pages/app/Admin"));
const Notifications = lazy(() => import("@/pages/app/Notifications"));
const Welcome = lazy(() => import("@/pages/auth/Welcome"));
const CheckEmail = lazy(() => import("@/pages/auth/CheckEmail"));
const AuthCallback = lazy(() => import("@/pages/auth/AuthCallback"));
const Login = lazy(() => import("@/pages/auth/Login"));
const Onboarding = lazy(() => import("@/pages/onboarding/Onboarding"));
const Leads = lazy(() => import("@/pages/app/Leads"));
const LeadDetail = lazy(() => import("@/pages/app/LeadDetail"));
const Responses = lazy(() => import("@/pages/app/Responses"));
const Reminders = lazy(() => import("@/pages/app/Reminders"));
const Settings = lazy(() => import("@/pages/app/Settings"));
const StatusManagement = lazy(() => import("@/pages/app/StatusManagement"));
const ProfileSetup = lazy(() => import("@/pages/app/ProfileSetup"));
const OpenInApp = lazy(() => import("@/pages/app/OpenInApp"));
const PostJob = lazy(() => import("@/pages/customer/PostJob"));
const JobQuestionnaire = lazy(() => import("@/pages/customer/JobQuestionnaire"));
const JobContact = lazy(() => import("@/pages/customer/JobContact"));
const BuyerDashboard = lazy(() => import("@/pages/customer/BuyerDashboard"));
const JobSuccess = lazy(() => import("@/pages/customer/JobSuccess"));
const ServiceCategoryPage = lazy(() => import("@/pages/ServiceCategoryPage"));
const AboutPage = lazy(() => import("@/pages/AboutPage"));
const AffiliatePage = lazy(() => import("@/pages/AffiliatePage"));
const HelpCenter = lazy(() => import("@/pages/HelpCenter"));
const CookiesPage = lazy(() => import("@/pages/CookiesPage"));
const Dashboard = lazy(() => import("@/pages/app/Dashboard"));
const CustomerRequest = lazy(() => import("@/pages/customer/CustomerRequest"));
const Index = lazy(() => import("@/pages/Index"));
const PublicProfile = lazy(() => import("@/pages/PublicProfile"));
const ProLanding = lazy(() => import("@/pages/ProLanding"));
const MerchantHome = lazy(() => import("@/pages/merchant/MerchantHome"));
const MerchantOptimization = lazy(() => import("@/pages/merchant/MerchantOptimization"));
const MerchantMarketplace = lazy(() => import("@/pages/merchant/MerchantMarketplace"));
const MerchantMessages = lazy(() => import("@/pages/merchant/MerchantMessages"));
const MerchantNotifications = lazy(() => import("@/pages/merchant/MerchantNotifications"));
const MerchantMenu = lazy(() => import("@/pages/merchant/MerchantMenu"));
const NotFound = lazy(() => import("@/pages/NotFound"));

captureAttribution(window.location.search);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<div role="status" className="p-8 text-center text-muted-foreground">Loading…</div>}>
          <Routes>
            {/* Public landing */}
            <Route path="/" element={<Index />} />
            <Route path="/profile/:userId" element={<PublicProfile />} />

            {/* Customer lead posting flow (no auth required) */}
            <Route path="/post-job" element={<PostJob />} />
            <Route path="/post-job/contact" element={<JobContact />} />
            <Route path="/post-job/success" element={<JobSuccess />} />
            <Route path="/post-job/:slug" element={<JobQuestionnaire />} />
            <Route path="/my-requests" element={<ProtectedRoute><BuyerDashboard /></ProtectedRoute>} />
            <Route path="/customer-notifications" element={<ProtectedRoute><Notifications customer /></ProtectedRoute>} />
            <Route path="/my-requests/:id" element={<ProtectedRoute><CustomerRequest /></ProtectedRoute>} />

            {/* Public marketing pages */}
            <Route path="/services/:slug" element={<ServiceCategoryPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/affiliates" element={<AffiliatePage />} />
            <Route path="/cookies" element={<CookiesPage />} />
            <Route path="/help" element={<HelpCenter />} />
            <Route path="/help/:slug" element={<HelpCenter />} />

            {/* Auth routes */}
            <Route path="/auth/welcome" element={<Welcome />} />
            <Route path="/auth/check-email" element={<CheckEmail />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/auth/login" element={<Login />} />
            <Route path="/pro" element={<ProLanding />} />
            <Route path="/open-in-app" element={<OpenInApp />} />

            {/* Onboarding */}
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              }
            />

            {/* App shell with bottom tabs */}
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/app/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="admin" element={<Admin />} />
              <Route path="leads" element={<Leads />} />
              <Route path="leads/:id" element={<LeadDetail />} />
              <Route path="responses" element={<Responses />} />
              <Route path="reminders" element={<Reminders />} />
              <Route path="settings" element={<Settings />} />
              <Route path="settings/statuses" element={<StatusManagement />} />
              <Route path="settings/profile" element={<ProfileSetup />} />
            </Route>

            {/* Merchant dashboard */}
            <Route
              path="/merchant"
              element={
                <ProtectedRoute>
                  <MerchantLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<MerchantHome />} />
              <Route path="optimization" element={<MerchantOptimization />} />
              <Route path="marketplace" element={<MerchantMarketplace />} />
              <Route path="messages" element={<MerchantMessages />} />
              <Route path="notifications" element={<MerchantNotifications />} />
              <Route path="menu" element={<MerchantMenu />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
