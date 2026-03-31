import useSWR, { SWRConfiguration } from 'swr';

const fetcher = (url: string) =>
  fetch(url, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    },
  }).then((res) => res.json());

const defaultConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 60000, // 1 minute
  focusThrottleInterval: 300000, // 5 minutes
  errorRetryCount: 2,
  errorRetryInterval: 5000,
  keepPreviousData: true,
};

export function useOptimizedData<T>(
  key: string | null,
  config?: SWRConfiguration
) {
  return useSWR<T>(key, fetcher, {
    ...defaultConfig,
    ...config,
  });
}

export function useUser() {
  return useOptimizedData('/api/user', {
    revalidateInterval: 5 * 60 * 1000, // 5 minutes
  });
}

export function useDistributions(userId?: string) {
  return useOptimizedData(
    userId ? `/api/distributions?userId=${userId}` : null,
    {
      revalidateInterval: 10 * 60 * 1000, // 10 minutes
    }
  );
}

export function useKYCStatus(userId?: string) {
  return useOptimizedData(
    userId ? `/api/kyc/status?userId=${userId}` : null,
    {
      revalidateInterval: 60 * 60 * 1000, // 1 hour
    }
  );
}

export function useBeneficiaries(philanthropistId?: string) {
  return useOptimizedData(
    philanthropistId ? `/api/beneficiaries?philanthropistId=${philanthropistId}` : null,
    {
      revalidateInterval: 15 * 60 * 1000, // 15 minutes
    }
  );
}
