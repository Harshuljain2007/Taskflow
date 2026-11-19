import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/src/lib/apiClient';

export interface HealthApiResponse {
  service: string;
  version: string;
  status: 'healthy' | 'degraded';
  environment: string;
  uptimeSeconds: number;
  timestamp: string;
  database: {
    provider: 'firebase-firestore' | 'mongodb';
    state:
      | 'configured'
      | 'connected'
      | 'disconnected'
      | 'connecting'
      | 'disconnecting'
      | 'unconfigured';
    ready: boolean;
    configured: boolean;
    projectId: string | null;
    databaseId: string | null;
    lastError: string | null;
  };
}

export function useHealthQuery() {
  return useQuery<HealthApiResponse>({
    queryKey: ['system', 'health'],
    queryFn: () => apiRequest<HealthApiResponse>('/api/v1/health'),
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
