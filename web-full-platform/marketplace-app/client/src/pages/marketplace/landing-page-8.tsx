import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { useApiConfig, getImageUrl } from '@/lib/use-api-config';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// Fallback placeholder for phone screenshots (gray gradient placeholder)
const PHONE_PLACEHOLDER = 'data:image/svg+xml,' + encodeURIComponent(`
  <svg width="300" height="600" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#374151;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#1f2937;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#grad)" rx="20"/>
    <text x="50%" y="50%" fill="#9ca3af" font-family="system-ui" font-size="16" text-anchor="middle" dy=".3em">App Screenshot</text>
  </svg>
`);

// Use placeholder for all fallback images
const loginScreenImg = PHONE_PLACEHOLDER;
const accountScreenImg = PHONE_PLACEHOLDER;
const sellerHubScreenImg = PHONE_PLACEHOLDER;
const splashScreenImg = PHONE_PLACEHOLDER;

// Default content matching admin editor defaults
const DEFAULT_CONTENT = {
  hero: {
    title: 'Your Live Commerce Destination',
    subtitle: 'Discover, trade, and engage with communities you care about.',
    primaryButtonText: 'Get Started',
    primaryButtonLink: '/signup',
    secondaryButtonText: 'Browse Shows',
    secondaryButtonLink: '/marketplace',
    downloadText: 'Download',
    phoneImage1: '',
    phoneImage2: '',
    qrCodeImage: ''
  },
  joinFun: {
    title: 'Experience the Thrill',
    subtitle: 'Dive into exciting bidding wars, exclusive drops, special promotions, and countless other surprises.',
    downloadText: 'Download',
    phoneImage: '',
    qrCodeImage: ''
  },
  gotItAll: {
    title: "Everything You Need",
    subtitle: 'Browse our collection to discover precisely what you have been searching for',
    downloadText: 'Download',
    phoneImage: '',
    qrCodeImage: ''
  },
  deals: {
    title: 'Score Amazing Prices on Top Brands',
    subtitle: "From popular favorites to rare collector items. Great savings await on anything you desire.",
    buttonText: 'Start Shopping',
    buttonLink: '/signup',
    downloadText: 'Download',
    trustBadgeText: 'SHOP CONFIDENTLY',
    phoneImage: '',
    qrCodeImage: ''
  },
  footer: {
    copyrightText: '2025'
  }
};

export default function LandingPage8() {
  const { isAuthenticated, user } = useAuth();
  const { externalApiUrl } = useApiConfig();
  const [, setLocation] = useLocation();
  const [currentSection, setCurrentSection] = useState(0);
  const sectionsRef = useRef<(HTMLElement | null)[]>([]);

  // Fetch theme directly - no settings API call needed
  const { data: themeData } = useQuery<any>({
    queryKey: ['/api/public/themes'],
  });
  const theme = themeData?.data || {};
  
  // Fetch landing page content from API
  const { data: landingData } = useQuery<any>({
    queryKey: ['/api/content/landing'],
  });
  
  // Use theme for app name
  const appName = theme.seo_title || theme.app_name || 'App';

  // Merge API content with defaults - API always takes precedence
  const content = {
    hero: { ...DEFAULT_CONTENT.hero, ...(landingData?.data?.hero || {}) },
    joinFun: { ...DEFAULT_CONTENT.joinFun, ...(landingData?.data?.joinFun || {}) },
    gotItAll: { ...DEFAULT_CONTENT.gotItAll, ...(landingData?.data?.gotItAll || {}) },
    deals: { ...DEFAULT_CONTENT.deals, ...(landingData?.data?.deals || {}) },
    footer: { ...DEFAULT_CONTENT.footer, ...(landingData?.data?.footer || {}) },
  };

  // Use uploaded images (with API base URL) or fallbacks
  const heroPhoneImage1 = content.hero.phoneImage1 ? getImageUrl(content.hero.phoneImage1, externalApiUrl) : loginScreenImg;
  const heroPhoneImage2 = content.hero.phoneImage2 ? getImageUrl(content.hero.phoneImage2, externalApiUrl) : splashScreenImg;
  const heroQrCode = content.hero.qrCodeImage ? getImageUrl(content.hero.qrCodeImage, externalApiUrl) : '';
  const joinFunPhoneImage = content.joinFun.phoneImage ? getImageUrl(content.joinFun.phoneImage, externalApiUrl) : sellerHubScreenImg;
  const joinFunQrCode = content.joinFun.qrCodeImage ? getImageUrl(content.joinFun.qrCodeImage, externalApiUrl) : '';
  const gotItAllPhoneImage = content.gotItAll.phoneImage ? getImageUrl(content.gotItAll.phoneImage, externalApiUrl) : accountScreenImg;
  const gotItAllQrCode = content.gotItAll.qrCodeImage ? getImageUrl(content.gotItAll.qrCodeImage, externalApiUrl) : '';
  const dealsPhoneImage = content.deals.phoneImage ? getImageUrl(content.deals.phoneImage, externalApiUrl) : loginScreenImg;
  const dealsQrCode = content.deals.qrCodeImage ? getImageUrl(content.deals.qrCodeImage, externalApiUrl) : '';

  // Convert theme colors from AARRGGBB to #RRGGBB format
  const primaryColor = theme.primary_color ? `#${theme.primary_color.slice(2)}` : '#F43F5E';
  const secondaryColor = theme.secondary_color ? `#${theme.secondary_color.slice(2)}` : '#0D9488';
  // Use header_logo for landing page header if available, fall back to app_logo
  const headerLogo = theme.header_logo ? getImageUrl(theme.header_logo, externalApiUrl) : getImageUrl(theme.app_logo, externalApiUrl);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.admin) {
        setLocation('/admin');
      } else {
        setLocation('/marketplace');
      }
    }
  }, [isAuthenticated, user, setLocation]);

  const scrollToSection = (index: number) => {
    if (sectionsRef.current[index]) {
      sectionsRef.current[index].scrollIntoView({ behavior: 'smooth' });
      setCurrentSection(index);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentSection(0);
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight / 2;
      sectionsRef.current.forEach((section, index) => {
        if (section) {
          const sectionTop = section.offsetTop;
          const sectionBottom = sectionTop + section.offsetHeight;
          if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
            setCurrentSection(index);
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Split hero title for line breaks
  const heroTitleParts = content.hero.title.split('\n');

  // QR Code component
  const QRCodeDisplay = ({ imageUrl, gradientStyle }: { imageUrl?: string; gradientStyle?: React.CSSProperties }) => (
    <div 
      className="w-28 h-28 rounded-xl p-2 shadow-lg"
      style={gradientStyle || { backgroundColor: 'white' }}
    >
      {imageUrl ? (
        <img src={imageUrl} alt="QR Code" className="w-full h-full object-contain rounded-lg" />
      ) : (
        <div className="w-full h-full bg-white/90 rounded-lg flex items-center justify-center">
          <span className="text-xs text-black/50 text-center">QR Code</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <Link href="/">
            <div className="flex items-center cursor-pointer" data-testid="link-logo">
              {headerLogo ? (
                <img src={headerLogo} alt={appName} className="h-20 sm:h-24 object-contain" />
              ) : (
                <div 
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` }}
                >
                  <Check className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
                </div>
              )}
            </div>
          </Link>
          
          <nav className="flex items-center gap-3 sm:gap-4">
            <Link href="/signup">
              <span className="text-sm font-medium text-black dark:text-white hover:opacity-70 transition-opacity cursor-pointer hidden sm:inline" data-testid="link-become-seller">
                Become a Seller
              </span>
            </Link>
            <Link href="/login">
              <Button 
                variant="default" 
                className="bg-black text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80 rounded-full px-5"
                data-testid="button-login"
              >
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button 
                variant="outline" 
                className="border-black text-black hover:bg-black/10 dark:border-white dark:text-white dark:hover:bg-white/10 rounded-full px-5"
                data-testid="button-signup"
              >
                Sign up
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Section 1: Hero - Theme Gradient Background */}
      <section 
        ref={(el) => { if (el) sectionsRef.current[0] = el; }}
        className="min-h-screen flex items-center relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` }}
        data-testid="section-hero"
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Decorative product imagery on the right */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/3 h-full opacity-90 hidden lg:block">
            <div className="absolute right-10 top-20 w-64 h-80 bg-gradient-to-br from-white/20 to-white/5 rounded-3xl transform rotate-6"></div>
            <div className="absolute right-32 top-40 w-48 h-64 bg-gradient-to-br from-white/15 to-white/5 rounded-2xl transform -rotate-3"></div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Phone Mockups */}
            <div className="relative flex justify-center lg:justify-start order-2 lg:order-1">
              <div className="relative">
                {/* Main Phone */}
                <div className="w-56 sm:w-64 h-[450px] sm:h-[520px] bg-black rounded-[40px] p-2 shadow-2xl transform -rotate-3 z-10">
                  <div className="w-full h-full rounded-[32px] overflow-hidden relative">
                    <img 
                      src={heroPhoneImage1} 
                      alt="App Screenshot" 
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                </div>
                
                {/* Secondary Phone (behind) */}
                <div className="absolute -left-16 top-8 w-44 sm:w-52 h-[380px] sm:h-[440px] bg-gray-200 rounded-[36px] p-2 shadow-xl transform rotate-6 -z-10 hidden sm:block">
                  <div className="w-full h-full rounded-[28px] overflow-hidden">
                    <img 
                      src={heroPhoneImage2} 
                      alt="App Screenshot" 
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right - Content */}
            <div className="text-left order-1 lg:order-2">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight mb-6" data-testid="text-hero-title">
                {heroTitleParts.map((part: string, i: number) => (
                  <span key={i}>
                    {part}
                    {i < heroTitleParts.length - 1 && <br />}
                  </span>
                ))}
              </h1>
              <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-lg" data-testid="text-hero-subtitle">
                {content.hero.subtitle}
              </p>
              
              <div className="mb-8">
                <p className="text-sm font-semibold text-white mb-3">{content.hero.downloadText} {appName}</p>
                <QRCodeDisplay imageUrl={heroQrCode} gradientStyle={{ backgroundColor: 'white' }} />
              </div>

              <div className="flex gap-4">
                <Link href={content.hero.primaryButtonLink}>
                  <Button 
                    size="lg" 
                    className="bg-white hover:bg-white/90 rounded-full px-8 font-semibold"
                    style={{ color: primaryColor }}
                    data-testid="button-get-started"
                  >
                    {content.hero.primaryButtonText}
                  </Button>
                </Link>
                <Link href={content.hero.secondaryButtonLink}>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-black/50 bg-black/20 text-white hover:bg-black/30 rounded-full px-8 backdrop-blur-sm"
                    data-testid="button-browse"
                  >
                    {content.hero.secondaryButtonText}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* How it works button */}
        <button 
          onClick={() => scrollToSection(1)}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white hover:opacity-70 transition-opacity"
          data-testid="button-how-it-works"
        >
          <ChevronDown className="h-5 w-5" />
          <span className="text-sm font-medium">How it works</span>
        </button>
      </section>

      {/* Section 2: Join In the Fun - Dark Background */}
      <section 
        ref={(el) => { if (el) sectionsRef.current[1] = el; }}
        className="min-h-screen flex items-center relative bg-black"
        data-testid="section-join-fun"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Content */}
            <div className="text-left">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6 italic" data-testid="text-join-title">
                {content.joinFun.title}
              </h2>
              <p className="text-lg sm:text-xl text-white/70 mb-8 max-w-lg" data-testid="text-join-subtitle">
                {content.joinFun.subtitle}
              </p>
              
              <div className="mb-8">
                <p className="text-sm font-semibold text-white mb-3">{content.joinFun.downloadText} {appName}</p>
                <QRCodeDisplay 
                  imageUrl={joinFunQrCode} 
                  gradientStyle={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` }} 
                />
              </div>
            </div>

            {/* Right - Phone Mockup */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="w-64 sm:w-72 h-[520px] sm:h-[580px] bg-gray-800 rounded-[48px] p-3 shadow-2xl border-4 border-gray-700">
                <div className="w-full h-full rounded-[36px] overflow-hidden relative">
                  <img 
                    src={joinFunPhoneImage} 
                    alt="App Screenshot" 
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3">
          <button 
            onClick={() => scrollToSection(0)}
            className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
            data-testid="button-nav-up-1"
          >
            <ChevronUp className="h-5 w-5" />
          </button>
          <button 
            onClick={() => scrollToSection(2)}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-full px-4 py-2 text-white transition-colors"
            data-testid="button-nav-more-1"
          >
            <ChevronDown className="h-4 w-4" />
            <span className="text-sm font-medium">More</span>
          </button>
        </div>
      </section>

      {/* Section 3: We've Got It All - Dark Background */}
      <section 
        ref={(el) => { if (el) sectionsRef.current[2] = el; }}
        className="min-h-screen flex items-center relative bg-black"
        data-testid="section-got-it-all"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Phone Mockup */}
            <div className="relative flex justify-center">
              <div className="w-64 sm:w-72 h-[520px] sm:h-[580px] bg-gray-800 rounded-[48px] p-3 shadow-2xl border-4 border-gray-700">
                <div className="w-full h-full rounded-[36px] overflow-hidden relative">
                  <img 
                    src={gotItAllPhoneImage} 
                    alt="App Screenshot" 
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              </div>
            </div>

            {/* Right - Content */}
            <div className="text-left">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6" data-testid="text-got-all-title">
                {content.gotItAll.title}
              </h2>
              <p className="text-lg sm:text-xl text-white/70 mb-8 max-w-lg" data-testid="text-got-all-subtitle">
                {content.gotItAll.subtitle}
              </p>
              
              <div className="mb-8">
                <p className="text-sm font-semibold text-white mb-3">{content.gotItAll.downloadText} {appName}</p>
                <QRCodeDisplay 
                  imageUrl={gotItAllQrCode} 
                  gradientStyle={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` }} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3">
          <button 
            onClick={() => scrollToSection(1)}
            className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
            data-testid="button-nav-up-2"
          >
            <ChevronUp className="h-5 w-5" />
          </button>
          <button 
            onClick={() => scrollToSection(3)}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-full px-4 py-2 text-white transition-colors"
            data-testid="button-nav-more-2"
          >
            <ChevronDown className="h-4 w-4" />
            <span className="text-sm font-medium">More</span>
          </button>
        </div>
      </section>

      {/* Section 4: Find Incredible Deals - Theme Gradient Background (Reversed) */}
      <section 
        ref={(el) => { if (el) sectionsRef.current[3] = el; }}
        className="min-h-screen flex items-center relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${secondaryColor} 0%, ${primaryColor} 100%)` }}
        data-testid="section-deals"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Content */}
            <div className="text-left">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6" data-testid="text-deals-title">
                {content.deals.title.split(' on ').map((part: string, i: number, arr: string[]) => (
                  <span key={i}>
                    {part}
                    {i < arr.length - 1 && <><br />on </>}
                  </span>
                ))}
              </h2>
              <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-lg" data-testid="text-deals-subtitle">
                {content.deals.subtitle}
              </p>
              
              <div className="mb-8">
                <p className="text-sm font-semibold text-white mb-3">{content.deals.downloadText} {appName}</p>
                <QRCodeDisplay imageUrl={dealsQrCode} gradientStyle={{ backgroundColor: 'white' }} />
              </div>

              <div className="flex gap-4">
                <Link href={content.deals.buttonLink}>
                  <Button 
                    size="lg" 
                    className="bg-white hover:bg-white/90 rounded-full px-8 font-semibold"
                    style={{ color: secondaryColor }}
                    data-testid="button-start-shopping"
                  >
                    {content.deals.buttonText}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right - Phone Mockup with Trust Badge */}
            <div className="relative flex justify-center lg:justify-end">
              {/* Trust Badge */}
              <div className="absolute top-0 left-1/2 lg:left-auto lg:right-20 -translate-x-1/2 lg:translate-x-0 z-20">
                <div className="relative">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white rounded-full flex items-center justify-center">
                    <div 
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Check className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                    </div>
                  </div>
                  {/* Circular text simulation */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span 
                      className="text-[8px] font-bold absolute" 
                      style={{ 
                        transform: 'rotate(-90deg) translateY(-44px)',
                        color: secondaryColor
                      }}
                    >{content.deals.trustBadgeText}</span>
                  </div>
                </div>
              </div>

              {/* Phone Mockup */}
              <div className="relative mt-20 lg:mt-0">
                <div className="w-56 sm:w-64 h-[450px] sm:h-[520px] bg-white rounded-[40px] p-2 shadow-2xl transform rotate-6">
                  <div className="w-full h-full rounded-[32px] overflow-hidden relative">
                    <img 
                      src={dealsPhoneImage} 
                      alt="App Screenshot" 
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                </div>
                {/* Shadow */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-8 bg-black/20 rounded-full blur-xl"></div>
              </div>
            </div>
          </div>
        </div>

        {/* To the Top button */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3">
          <button 
            onClick={() => scrollToSection(2)}
            className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
            data-testid="button-nav-up-3"
          >
            <ChevronUp className="h-5 w-5" />
          </button>
          <button 
            onClick={scrollToTop}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 rounded-full px-4 py-2 text-white transition-colors"
            data-testid="button-to-top"
          >
            <ChevronUp className="h-4 w-4" />
            <span className="text-sm font-medium">To the Top</span>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h4 className="font-semibold mb-4">Shop</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><Link href="/marketplace"><span className="hover:text-white cursor-pointer">Browse</span></Link></li>
                <li><Link href="/deals"><span className="hover:text-white cursor-pointer">Deals</span></Link></li>
                <li><Link href="/trending"><span className="hover:text-white cursor-pointer">Trending</span></Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Sell</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><Link href="/seller-login"><span className="hover:text-white cursor-pointer">Become a Seller</span></Link></li>
                <li><Link href="/seller/hub"><span className="hover:text-white cursor-pointer">Seller Hub</span></Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><Link href="/about"><span className="hover:text-white cursor-pointer">About Us</span></Link></li>
                <li><Link href="/contact"><span className="hover:text-white cursor-pointer">Contact</span></Link></li>
                <li><Link href="/help-center"><span className="hover:text-white cursor-pointer">Help Center</span></Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li>
                  {theme.privacy_url ? (
                    <a href={theme.privacy_url} target="_blank" rel="noopener noreferrer" className="hover:text-white cursor-pointer">Privacy Policy</a>
                  ) : (
                    <Link href="/privacy"><span className="hover:text-white cursor-pointer">Privacy Policy</span></Link>
                  )}
                </li>
                <li>
                  {theme.terms_url ? (
                    <a href={theme.terms_url} target="_blank" rel="noopener noreferrer" className="hover:text-white cursor-pointer">Terms of Service</a>
                  ) : (
                    <Link href="/terms"><span className="hover:text-white cursor-pointer">Terms of Service</span></Link>
                  )}
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center">
              {getImageUrl(theme.app_logo, externalApiUrl) ? (
                <img src={getImageUrl(theme.app_logo, externalApiUrl)} alt={appName} className="h-8 w-auto object-contain" />
              ) : (
                <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
                  <Check className="h-4 w-4 text-[#FFE600]" />
                </div>
              )}
            </div>
            <p className="text-sm text-white/60">
              {content.footer.copyrightText || `© ${new Date().getFullYear()} ${appName}. All rights reserved.`}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
