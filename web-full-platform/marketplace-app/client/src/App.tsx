import { useState, useEffect, lazy, Suspense } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { SettingsProvider } from "@/lib/settings-context";
import { SocketProvider } from "@/lib/socket-context";
import { cn } from "@/lib/utils";
import { usePageTitle } from "@/hooks/use-page-title";
import { ReferralBanner } from "@/components/referral-banner";

// Import age verification (not lazy loaded since it needs to run immediately)
import { AgeVerificationDialog } from "@/components/age-verification-dialog";

// Lazy load all pages to prevent circular dependencies
const Sidebar = lazy(() => import("@/components/layout/sidebar").then(m => ({ default: m.Sidebar })));
const AppHeader = lazy(() => import("@/components/layout/app-header").then(m => ({ default: m.AppHeader })));
const SocialAuthCompleteForm = lazy(() => import("@/components/auth/social-auth-complete-form").then(m => ({ default: m.SocialAuthCompleteForm })));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Orders = lazy(() => import("@/pages/commerce/orders"));
const Purchases = lazy(() => import("@/pages/commerce/purchases"));
const ThankYou = lazy(() => import("@/pages/commerce/thank-you"));
const Inventory = lazy(() => import("@/pages/seller/inventory"));
const AddProduct = lazy(() => import("@/pages/seller/add-product"));
const EditProduct = lazy(() => import("@/pages/seller/edit-product"));
const Shipping = lazy(() => import("@/pages/seller/shipping"));
const ShippingProfiles = lazy(() => import("@/pages/seller/shipping-profiles"));
const Addresses = lazy(() => import("@/pages/addresses"));
const Analytics = lazy(() => import("@/pages/seller/analytics"));
const LiveShows = lazy(() => import("@/pages/seller/live-shows"));
const Settings = lazy(() => import("@/pages/settings"));
const Profile = lazy(() => import("@/pages/profile"));
const ProfileView = lazy(() => import("@/pages/marketplace/profile-view"));
const ProductDetailWrapper = lazy(() => import("@/pages/marketplace/product-detail-wrapper"));
const AuctionDetail = lazy(() => import("@/pages/marketplace/auction-detail"));
const Account = lazy(() => import("@/pages/account"));
const Payments = lazy(() => import("@/pages/payments"));
const Login = lazy(() => import("@/pages/auth/login"));
const Signup = lazy(() => import("@/pages/auth/signup"));
const ForgotPassword = lazy(() => import("@/pages/auth/forgot-password"));
const ResetPassword = lazy(() => import("@/pages/auth/reset-password"));
const Transactions = lazy(() => import("@/pages/commerce/transactions"));
const MarketplaceHome = lazy(() => import("@/pages/marketplace/home"));
const Browse = lazy(() => import("@/pages/marketplace/browse"));
const Category = lazy(() => import("@/pages/marketplace/category"));
const SearchResults = lazy(() => import("@/pages/marketplace/search-results"));
const TrendingProducts = lazy(() => import("@/pages/marketplace/trending-products"));
const TrendingAuctions = lazy(() => import("@/pages/marketplace/trending-auctions"));
const FeaturedShows = lazy(() => import("@/pages/marketplace/featured-shows"));
const Deals = lazy(() => import("@/pages/marketplace/deals"));
const DealsAuctions = lazy(() => import("@/pages/marketplace/deals-auctions"));
const DealsTrending = lazy(() => import("@/pages/marketplace/deals-trending"));
const Giveaways = lazy(() => import("@/pages/marketplace/giveaways"));
const GiveawayDetail = lazy(() => import("@/pages/marketplace/giveaway-detail"));
const LandingPage = lazy(() => import("@/pages/marketplace/landing-page-8"));
const SellerLogin = lazy(() => import("@/pages/auth/seller-login"));
const ShowViewWrapper = lazy(() => import("@/pages/marketplace/show-view-wrapper"));
const ProfileViewWrapper = lazy(() => import("@/pages/marketplace/profile-view-wrapper"));
const PrivacyPolicy = lazy(() => import("@/pages/marketplace/privacy-policy"));
const TermsOfService = lazy(() => import("@/pages/marketplace/terms-of-service"));
const ContactUs = lazy(() => import("@/pages/marketplace/contact"));
const UserReports = lazy(() => import("@/pages/marketplace/user-reports"));
const FAQ = lazy(() => import("@/pages/marketplace/faq"));
const AboutUs = lazy(() => import("@/pages/marketplace/about"));
const KnowledgeBase = lazy(() => import("@/pages/marketplace/knowledge-base"));
const SellerHub = lazy(() => import("@/pages/seller/hub"));
const SellerOffers = lazy(() => import("@/pages/seller/offers"));
const BuyerOffers = lazy(() => import("@/pages/buyer/offers"));
const Inbox = lazy(() => import("@/pages/social/inbox"));
const Friends = lazy(() => import("@/pages/social/friends"));
const HelpCenter = lazy(() => import("@/pages/marketplace/help-center"));
const HelpArticle = lazy(() => import("@/pages/marketplace/help-article"));
const SellerSetup = lazy(() => import("@/pages/seller/setup"));
const ScheduleShow = lazy(() => import("@/pages/seller/schedule-show"));
const Payouts = lazy(() => import("@/pages/seller/payouts"));
const NotFound = lazy(() => import("@/pages/not-found"));
const DeepLink = lazy(() => import("@/pages/deep-link"));
const InvitePage = lazy(() => import("@/pages/invite"));
const ReferralPage = lazy(() => import("@/pages/referral"));

// Loading component
function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

function Router() {
  const { isAuthenticated, isLoading, user, pendingSocialAuth, pendingSocialAuthEmail, pendingSocialAuthData, completeSocialAuth } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const [justCompletedSocialAuth, setJustCompletedSocialAuth] = useState(false);
  
  // Set default page title from settings
  usePageTitle();

  // Fetch fresh user data for routing checks (same as header)
  const userId = (user as any)?._id || user?.id;
  const { data: freshUserData } = useQuery<any>({
    queryKey: [`/api/profile/${userId}`],
    enabled: !!userId && !!isAuthenticated,
    staleTime: 0, // Always fetch fresh data
  });
  
  // Use fresh user data if available, otherwise fall back to cached user
  const currentUser = freshUserData || user;

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Handle social auth completion
  const handleSocialAuthComplete = async (data: any) => {
    try {
      await completeSocialAuth(data);
      setJustCompletedSocialAuth(true);
    } catch (error) {
      console.error('Social auth completion failed:', error);
    }
  };

  // Redirect after social auth completion
  useEffect(() => {
    if (justCompletedSocialAuth && isAuthenticated && !pendingSocialAuth && user) {
      setLocation('/');
      setJustCompletedSocialAuth(false);
    }
  }, [justCompletedSocialAuth, isAuthenticated, pendingSocialAuth, user, setLocation]);

  // Show loading state
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Show social auth completion form if pending
  if (pendingSocialAuth && pendingSocialAuthEmail && pendingSocialAuthData) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <SocialAuthCompleteForm
          userEmail={pendingSocialAuthEmail}
          socialAuthData={pendingSocialAuthData}
          onComplete={handleSocialAuthComplete}
          isLoading={isLoading}
        />
      </Suspense>
    );
  }

  // Public pages that don't require authentication
  const publicPages = [
    '/',
    '/landing-1',
    '/landing-2',
    '/landing-3',
    '/landing-4',
    '/landing-5',
    '/landing-6',
    '/landing-7',
    '/landing-8',
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/seller/login',
    '/privacy-policy',
    '/terms-of-service',
    '/contact',
    '/faq',
    '/about',
    '/knowledge-base',
    '/help-center'
  ];

  // Extract pathname without query parameters for route matching
  // Use window.location.pathname and decode it (handles URL-encoded characters)
  const rawPathname = typeof window !== 'undefined' ? window.location.pathname : location;
  const currentPathname = decodeURIComponent(rawPathname).split('?')[0];
  const isPublicPage = publicPages.includes(currentPathname) || currentPathname.startsWith('/help-center/') || currentPathname.startsWith('/link/') || currentPathname.startsWith('/show') || currentPathname.startsWith('/user') || currentPathname.startsWith('/profile/') || currentPathname.startsWith('/invite/');

  // Redirect to login if trying to access protected pages without authentication
  if (!isAuthenticated && !isPublicPage) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <div className="flex flex-col h-screen bg-background">
          <AppHeader 
            hideLogo={false}
            onMobileMenuToggle={toggleMobileMenu}
            mobileMenuOpen={mobileMenuOpen}
            onMobileMenuClose={closeMobileMenu}
          />
          
          {/* Mobile Sidebar Sheet for unauthenticated users - hide desktop version */}
          <div className="lg:hidden">
            <Sidebar 
              isCollapsed={false}
              onToggle={toggleSidebar}
              isMobileOpen={mobileMenuOpen}
              onMobileClose={closeMobileMenu}
            />
          </div>
          
          <main className="flex-1 overflow-y-auto">
            <Switch>
              <Route path="/login" component={Login} />
              <Route component={Login} />
            </Switch>
          </main>
        </div>
      </Suspense>
    );
  }

  // Check if we're on a landing page that has its own header
  const isLandingPageWithCustomHeader = currentPathname === '/' || currentPathname === '/landing-8' || currentPathname === '/seller/login' || currentPathname.startsWith('/invite/');

  // Show public pages for unauthenticated users
  if (!isAuthenticated) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <div className="flex flex-col h-screen bg-background">
          {/* Hide default header on landing pages with custom headers */}
          {!isLandingPageWithCustomHeader && (
            <>
              <AppHeader 
                hideLogo={false}
                onMobileMenuToggle={toggleMobileMenu}
                mobileMenuOpen={mobileMenuOpen}
                onMobileMenuClose={closeMobileMenu}
              />
              
              {/* Mobile Sidebar Sheet for unauthenticated users - hide desktop version */}
              <div className="lg:hidden">
                <Sidebar 
                  isCollapsed={false}
                  onToggle={toggleSidebar}
                  isMobileOpen={mobileMenuOpen}
                  onMobileClose={closeMobileMenu}
                />
              </div>
            </>
          )}
          
          <main className={isLandingPageWithCustomHeader ? "flex-1" : "flex-1 overflow-y-auto"}>
            <Switch>
              <Route path="/" component={LandingPage} />
              <Route path="/landing-8" component={LandingPage} />
              <Route path="/seller/login" component={SellerLogin} />
              <Route path="/login" component={Login} />
              <Route path="/signup" component={Signup} />
              <Route path="/invite/:userId" component={InvitePage} />
              <Route path="/forgot-password" component={ForgotPassword} />
              <Route path="/reset-password" component={ResetPassword} />
              <Route path="/link/:type/:id" component={DeepLink} />
              <Route path="/show/:id" component={ShowViewWrapper} />
              <Route path="/show" component={ShowViewWrapper} />
              <Route path="/product/:productId" component={ProductDetailWrapper} />
              <Route path="/product" component={ProductDetailWrapper} />
              <Route path="/user" component={ProfileViewWrapper} />
              <Route path="/privacy-policy" component={PrivacyPolicy} />
              <Route path="/terms-of-service" component={TermsOfService} />
              <Route path="/contact" component={ContactUs} />
              <Route path="/faq" component={FAQ} />
              <Route path="/about" component={AboutUs} />
              <Route path="/knowledge-base" component={KnowledgeBase} />
              <Route path="/help-center/:slug" component={HelpArticle} />
              <Route path="/help-center" component={HelpCenter} />
              <Route component={LandingPage} />
            </Switch>
          </main>
        </div>
      </Suspense>
    );
  }

  // Seller-only routes that require seller status
  const sellerOnlyRoutes = [
    '/inventory',
    '/add-product',
    '/edit-product',
    '/shipping',
    '/shipping-profiles',
    '/analytics',
    '/live-shows',
    '/schedule-show',
    '/seller/hub',
    '/payouts'
  ];

  const isSellerOnlyRoute = sellerOnlyRoutes.some(route => location.startsWith(route));
  const isSeller = (currentUser as any)?.seller === true;

  // Redirect non-sellers trying to access seller pages to marketplace
  if (isSellerOnlyRoute && !isSeller) {
    setLocation('/marketplace');
    return <LoadingSpinner />;
  }

  const isDashboardRoute = location.startsWith('/orders') || 
                          location.startsWith('/purchases') || 
                          location.startsWith('/thank-you') ||
                          location.startsWith('/inventory') || 
                          location.startsWith('/add-product') || 
                          location.startsWith('/edit-product') || 
                          location.startsWith('/shipping') || 
                          location.startsWith('/addresses') || 
                          location.startsWith('/transactions') || 
                          location.startsWith('/profile-view') ||
                          location === '/profile' ||
                          location.startsWith('/account') ||
                          location.startsWith('/payments') ||
                          location.startsWith('/seller/hub') ||
                          location.startsWith('/friends') ||
                          location === '/settings' ||
                          location.startsWith('/analytics') ||
                          location.startsWith('/dashboard') ||
                          location.startsWith('/live-shows') ||
                          location.startsWith('/schedule-show') ||
                          location.startsWith('/offers') ||
                          location.startsWith('/my-offers') ||
                          location.startsWith('/payouts');

  if (isDashboardRoute) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <div className="flex flex-col min-h-screen bg-background">
          <AppHeader 
            onMobileMenuToggle={toggleMobileMenu}
            mobileMenuOpen={mobileMenuOpen}
            hideLogo={false}
            hideSearch={true}
            isDashboard={true}
          />
          <ReferralBanner settings={null} />
          <div className="flex flex-1 min-h-0">
            <div className="hidden lg:block">
              <Sidebar 
                isCollapsed={sidebarCollapsed} 
                onToggle={toggleSidebar} 
                isMobileOpen={false}
                onMobileClose={closeMobileMenu}
              />
            </div>
            {mobileMenuOpen && (
              <div className="lg:hidden fixed inset-0 z-50 bg-background">
                <Sidebar 
                  isCollapsed={false} 
                  onToggle={toggleSidebar} 
                  isMobileOpen={true}
                  onMobileClose={closeMobileMenu}
                />
              </div>
            )}
            <main className="flex-1 overflow-y-auto p-6">
              <Switch>
                <Route path="/dashboard" component={Dashboard} />
                <Route path="/orders" component={Orders} />
                <Route path="/offers" component={SellerOffers} />
                <Route path="/my-offers" component={BuyerOffers} />
                <Route path="/purchases" component={Purchases} />
                <Route path="/thank-you/:orderId" component={ThankYou} />
                <Route path="/inventory" component={Inventory} />
                <Route path="/add-product" component={AddProduct} />
                <Route path="/edit-product/:id" component={EditProduct} />
                <Route path="/shipping" component={Shipping} />
                <Route path="/shipping-profiles" component={ShippingProfiles} />
                <Route path="/addresses" component={Addresses} />
                <Route path="/transactions" component={Transactions} />
                <Route path="/profile" component={Profile} />
                <Route path="/profile-view" component={ProfileView} />
                <Route path="/account" component={Account} />
                <Route path="/payments" component={Payments} />
                <Route path="/settings" component={Settings} />
                <Route path="/analytics" component={Analytics} />
                <Route path="/live-shows" component={LiveShows} />
                <Route path="/schedule-show" component={ScheduleShow} />
                <Route path="/seller/hub" component={SellerHub} />
                <Route path="/friends" component={Friends} />
                <Route path="/payouts" component={Payouts} />
                <Route component={NotFound} />
              </Switch>
            </main>
          </div>
        </div>
      </Suspense>
    );
  }

  const isShowViewPage = location.startsWith('/show/') || location.startsWith('/show?');
  
  // Hide search on detail/inner pages, keep it on marketplace browsing pages
  // Extract pathname without query parameters
  const pathname = location.split('?')[0];
  const isMarketplaceBrowsingPage = pathname === '/' || 
                                    pathname === '/marketplace' || 
                                    pathname === '/browse' || 
                                    pathname.startsWith('/deals') || 
                                    pathname.startsWith('/category') || 
                                    pathname === '/search' ||
                                    pathname.startsWith('/trending');
  
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <div className="flex flex-col h-screen bg-background">
        <div className={cn(isShowViewPage && "hidden lg:block")}>
          <AppHeader 
            hideLogo={false}
            hideSearch={!isMarketplaceBrowsingPage}
            onMobileMenuToggle={toggleMobileMenu}
            mobileMenuOpen={mobileMenuOpen}
            onMobileMenuClose={closeMobileMenu}
          />
        </div>
        
        <ReferralBanner settings={null} />
        
        {/* Mobile Sidebar Sheet for non-dashboard pages - hide desktop version */}
        <div className="lg:hidden">
          <Sidebar 
            isCollapsed={false}
            onToggle={toggleSidebar}
            isMobileOpen={mobileMenuOpen}
            onMobileClose={closeMobileMenu}
          />
        </div>
        
        <main className="flex-1 min-h-0 overflow-y-auto">
          <Switch>
            <Route path="/" component={MarketplaceHome} />
            <Route path="/marketplace" component={MarketplaceHome} />
            <Route path="/browse" component={Browse} />
            <Route path="/deals" component={Deals} />
            <Route path="/deals/auctions" component={DealsAuctions} />
            <Route path="/deals/trending" component={DealsTrending} />
            <Route path="/giveaways" component={Giveaways} />
            <Route path="/giveaway/:id" component={GiveawayDetail} />
            <Route path="/category/:id" component={Category} />
            <Route path="/search" component={SearchResults} />
            <Route path="/trending/products" component={TrendingProducts} />
            <Route path="/trending/auctions" component={TrendingAuctions} />
            <Route path="/featured/shows" component={FeaturedShows} />
            <Route path="/show/:id" component={ShowViewWrapper} />
            <Route path="/show" component={ShowViewWrapper} />
            <Route path="/product/:productId" component={ProductDetailWrapper} />
            <Route path="/auction/:auctionId" component={AuctionDetail} />
            <Route path="/user" component={ProfileViewWrapper} />
            <Route path="/profile/:userId" component={ProfileViewWrapper} />
            <Route path="/referral" component={ReferralPage} />
            <Route path="/inbox/:userId?" component={Inbox} />
            <Route path="/seller/setup" component={SellerSetup} />
            <Route path="/login" component={MarketplaceHome} />
            <Route path="/signup" component={MarketplaceHome} />
            <Route path="/invite/:userId" component={MarketplaceHome} />
            <Route path="/forgot-password" component={ForgotPassword} />
            <Route path="/reset-password" component={ResetPassword} />
            <Route path="/seller/login" component={MarketplaceHome} />
            <Route path="/link/:type/:id" component={DeepLink} />
            <Route path="/privacy-policy" component={PrivacyPolicy} />
            <Route path="/terms-of-service" component={TermsOfService} />
            <Route path="/contact" component={ContactUs} />
            <Route path="/reports" component={UserReports} />
            <Route path="/faq" component={FAQ} />
            <Route path="/about" component={AboutUs} />
            <Route path="/knowledge-base" component={KnowledgeBase} />
            <Route path="/help-center/:slug" component={HelpArticle} />
            <Route path="/help-center" component={HelpCenter} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </Suspense>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <AuthProvider>
          <SocketProvider>
            <TooltipProvider>
              <AgeVerificationDialog />
              <Toaster />
              <Router />
            </TooltipProvider>
          </SocketProvider>
        </AuthProvider>
      </SettingsProvider>
    </QueryClientProvider>
  );
}
