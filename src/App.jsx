import React, { Suspense, lazy, useEffect } from "react";
import Home from "./pages/Home";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import Layout from "./components/Layout";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import AboutUs from "./pages/AboutUs";
import ContactUs from "./pages/ContactUs";
import HoaIssue from "./pages/HoaIssue";
import Overview from "./pages/NonLegalAdvocate/Overview";
import IntakeForm from "./pages/NonLegalAdvocate/IntakeForm";

import AttorneyDirectory from "./pages/FrequentlyAskedQuestions/AttorneyDirectory";
import AttorneyProfile from "./pages/FrequentlyAskedQuestions/AttorneyProfile";
import HoaHorrorStories from "./pages/HoaHorrorStories";
import HoaHorrorStoryDetail from "./pages/HoaHorrorStoryDetail";
import SubmitYourStory from "./pages/SubmitYourStory";
import AdminLogin from "./pages/Admin/AdminLogin";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import CmsPage from "./pages/CmsPage";
import LegalContentPage from "./pages/LegalContentPage";
import SettingsDisclaimerPage from "./pages/SettingsDisclaimerPage";
import Resources from "./pages/Resources";
import ThankYou from "./pages/ThankYou";
import FrequentlyAskedQuestions from "./pages/FrequentlyAskedQuestions";
import Cart from "./pages/Cart/Cart";
import AttorneySubmissionForm from "./pages/FrequentlyAskedQuestions/Attorneysubmissionform";
import Blog from "./pages/Blog";
import BlogDetail from "./pages/BlogDetail";
import NotFound from "./pages/NotFound";
import Mission from "./pages/Mission";
import RemovalRequest from "./pages/RemovalRequest";
import NewsletterUnsubscribe from "./pages/NewsletterUnsubscribe";
import NewsletterPopup from "./components/NewsletterPopup";

const AdminDashboard = lazy(() => import("./pages/Admin/AdminDashboard"));

function RestoreScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function SubmitStoryProtectedRoute() {
  const location = useLocation();

  if (location.state?.homepageDisclaimerAccepted !== true) {
    return <Navigate to="/" replace />;
  }

  return <SubmitYourStory />;
}

const routeFallback = (
  <div className="min-h-screen bg-[#f3f5f7] px-6 py-10 font-semibold text-[#405b6d]">
    Loading...
  </div>
);
const App = () => {
  return (
    <BrowserRouter>
      <RestoreScrollToTop />
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard/*"
          element={
            <AdminProtectedRoute>
              <Suspense fallback={routeFallback}>
                <AdminDashboard />
              </Suspense>
            </AdminProtectedRoute>
          }
        />

        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/mission" element={<Mission />} />
          <Route
            path="/correction-or-removal-request"
            element={<RemovalRequest />}
          />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route
            path="/terms-of-use"
            element={<LegalContentPage type="terms" />}
          />
          <Route path="/hoa-issue-form" element={<HoaIssue />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/contact-form" element={<ContactUs />} />
          <Route path="/submit-story" element={<SubmitStoryProtectedRoute />} />
          <Route
            path="/submit-your-story"
            element={<SubmitStoryProtectedRoute />}
          />
          <Route path="/thank-you" element={<ThankYou />} />
          <Route
            path="/newsletter"
            element={<Navigate to="/newsletters/subscribe" replace />}
          />
          <Route
            path="/newsletter/subscribe"
            element={<Navigate to="/newsletters/subscribe" replace />}
          />
          <Route
            path="/newsletters/subscribe"
            element={<NewsletterPopup standalone />}
          />
          <Route
            path="/newsletter/unsubscribe/:token"
            element={<NewsletterUnsubscribe />}
          />
          <Route
            path="/newsletters/unsubscribe/:token"
            element={<NewsletterUnsubscribe />}
          />
          <Route path="/hoa-horror-stories" element={<HoaHorrorStories />} />
          <Route path="/horror-stories" element={<HoaHorrorStories />} />
          <Route
            path="/hoa-horror-stories/:slug"
            element={<HoaHorrorStoryDetail />}
          />
          <Route
            path="/homeowner-help"
            element={
              <CmsPage
                slug="homeowner-help"
                title="Homeowner Help"
                description="Educational guidance hub for topic cards, evergreen resources, and calls to action."
              />
            }
          />
          <Route path="/resources" element={<Resources />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blogs" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogDetail />} />
          <Route
            path="/frequently-asked-questions"
            element={<FrequentlyAskedQuestions />}
          />
          <Route
            path="/legal-disclaimer"
            element={<SettingsDisclaimerPage type="legal" />}
          />
          <Route
            path="/attorney-disclaimer"
            element={<SettingsDisclaimerPage type="attorney" />}
          />

          <Route path="non-legal-advocate" element={<Overview />} />
          <Route path="non-legal-advocate/overview" element={<Overview />} />
          <Route
            path="non-legal-advocate/intake-form"
            element={<IntakeForm />}
          />
          <Route
            path="non-legal-advocate/disclaimer"
            element={<SettingsDisclaimerPage type="legal" />}
          />

          <Route
            path="attorneys/find-homeowner-attorney"
            element={<AttorneyDirectory />}
          />
          <Route path="/find-attorney" element={<AttorneyDirectory />} />
          <Route
            path="/find-attorney/submit"
            element={<AttorneySubmissionForm />}
          />
          <Route path="/find-attorney/:slug" element={<AttorneyProfile />} />
          <Route
            path="/attorneys/find-homeowner-attorney"
            element={<AttorneyDirectory />}
          />

          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Cart />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
