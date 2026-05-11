import { useEffect } from 'react';
import { useSettings } from '@/lib/settings-context';

export function usePageTitle(pageTitle?: string) {
  const { theme } = useSettings();
  
  useEffect(() => {
    const baseTitle = theme.seo_title || theme.app_name || 'App';
    
    if (pageTitle) {
      document.title = `${pageTitle} | ${baseTitle}`;
    } else {
      document.title = baseTitle;
    }
  }, [pageTitle, theme.app_name, theme.seo_title]);
}
