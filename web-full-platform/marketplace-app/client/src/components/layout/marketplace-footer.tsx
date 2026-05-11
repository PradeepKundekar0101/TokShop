import { Link } from 'wouter';
import { useSettings } from '@/lib/settings-context';
import { useApiConfig, getImageUrl } from '@/lib/use-api-config';

export function MarketplaceFooter() {
  const { theme } = useSettings();
  const { externalApiUrl } = useApiConfig();
  
  const appName = theme.seo_title || theme.app_name || 'App';
  const logoUrl = getImageUrl(theme.app_logo || theme.header_logo, externalApiUrl);

  return (
    <footer className="border-t border-border py-12 bg-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-8">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <Link href="/privacy-policy" className="hover:text-foreground transition-colors" data-testid="link-privacy">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="hover:text-foreground transition-colors" data-testid="link-terms">
              Terms of Service
            </Link>
            <Link href="/contact" className="hover:text-foreground transition-colors" data-testid="link-contact">
              Contact
            </Link>
            <Link href="/faq" className="hover:text-foreground transition-colors" data-testid="link-faq">
              FAQ
            </Link>
            <Link href="/help-center" className="hover:text-foreground transition-colors" data-testid="link-help-center">
              Help Center
            </Link>
          </div>
          <div className="flex items-center justify-center">
              {logoUrl ? (
                <img src={logoUrl} alt={appName} className="h-8 w-auto object-contain" data-testid="img-footer-logo" />
              ) : (
                <div className="h-6 w-6 bg-black rounded-full flex items-center justify-center p-1">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="text-primary">
                    <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                  </svg>
                </div>
              )}
          </div>
        </div>
      </div>
    </footer>
  );
}
