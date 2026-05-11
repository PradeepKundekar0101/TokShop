import { useQuery } from '@tanstack/react-query';

interface ApiConfigResponse {
  success: boolean;
  data: {
    externalApiUrl: string;
  };
}

export function useApiConfig() {
  const { data, isLoading, error } = useQuery<ApiConfigResponse>({
    queryKey: ['/api/config'],
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 3,
  });

  return {
    externalApiUrl: data?.data?.externalApiUrl || '',
    isLoading,
    error,
  };
}

export function getImageUrl(imagePath: string | undefined | null, externalApiUrl: string): string {
  if (!imagePath) return '';
  
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // No fallback - all URLs must come from backend BASE_URL
  if (!externalApiUrl) return '';
  
  const cleanPath = imagePath.replace(/^\//, '');
  return `${externalApiUrl}/${cleanPath}`;
}
