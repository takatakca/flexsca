import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Welcome from "@/pages/auth/Welcome";
import CheckEmail from "@/pages/auth/CheckEmail";
import AuthCallback from "@/pages/auth/AuthCallback";
import Login from "@/pages/auth/Login";
import Onboarding from "@/pages/onboarding/Onboarding";
import AppLayout from "@/components/AppLayout";
import Leads from "@/pages/app/Leads";
import LeadDetail from "@/pages/app/LeadDetail";
import Responses from "@/pages/app/Responses";
import Reminders from "@/pages/app/Reminders";
import Settings from "@/pages/app/Settings";
import StatusManagement from "@/pages/app/StatusManagement";
import ProfileSetup from "@/pages/app/ProfileSetup";
import OpenInApp from "@/pages/app/OpenInApp";
import PostJob from "@/pages/customer/PostJob";
import JobQuestionnaire from "@/pages/customer/JobQuestionnaire";
import JobContact from "@/pages/customer/JobContact";
import BuyerDashboard from "@/pages/customer/BuyerDashboard";
import JobSuccess from "@/pages/customer/JobSuccess";
import ServiceCategoryPage from "@/pages/ServiceCategoryPage";
import AboutPage from "@/pages/AboutPage";
import AffiliatePage from "@/pages/AffiliatePage";
import HelpCenter from "@/pages/HelpCenter";
import CookiesPage from "@/pages/CookiesPage";
import Index from "@/pages/Index";
import PublicProfile from "@/pages/PublicProfile";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public landing */}
            <Route path="/" element={<Index />} />
            <Route path="/profile/:userId" element={<PublicProfile />} />

            {/* Customer lead posting flow (no auth required) */}
            <Route path="/post-job" element={<PostJob />} />
            <Route path="/post-job/contact" element={<JobContact />} />
            <Route path="/post-job/success" element={<JobSuccess />} />
            <Route path="/post-job/:slug" element={<JobQuestionnaire />} />
            <Route path="/my-requests" element={<BuyerDashboard />} />

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
              <Route index element={<Navigate to="/app/leads" replace />} />
              <Route path="leads" element={<Leads />} />
              <Route path="leads/:id" element={<LeadDetail />} />
              <Route path="responses" element={<Responses />} />
              <Route path="reminders" element={<Reminders />} />
              <Route path="settings" element={<Settings />} />
              <Route path="settings/statuses" element={<StatusManagement />} />
              <Route path="settings/profile" element={<ProfileSetup />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
