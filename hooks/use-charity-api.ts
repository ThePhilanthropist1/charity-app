import useSWR from 'swr';
import { useCallback } from 'react';

// Fetcher function
const fetcher = (url: string, token?: string) =>
  fetch(url, {
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
    },
  }).then(res => res.json());

// Hook to get current user
export function useAuth() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const user = typeof window !== 'undefined' ? localStorage.getItem('auth_user') : null;

  return {
    token,
    user: user ? JSON.parse(user) : null,
    isAuthenticated: !!token,
  };
}

// Hook to get user profile
export function useUserProfile(userId?: string) {
  const { token } = useAuth();
  const { data, error, isLoading, mutate } = useSWR(
    userId && token ? `/api/auth?id=${userId}` : null,
    (url) => fetcher(url, token),
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  return {
    user: data?.data,
    isLoading,
    error,
    mutate,
  };
}

// Hook to get KYC submission
export function useKYCSubmission() {
  const { token } = useAuth();
  const { data, error, isLoading, mutate } = useSWR(
    token ? '/api/kyc?action=get' : null,
    (url) => fetcher(url, token),
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  );

  return {
    submission: data?.data,
    isLoading,
    error,
    mutate,
  };
}

// Hook to submit KYC
export function useSubmitKYC() {
  const { token } = useAuth();
  const { mutate } = useKYCSubmission();

  const submit = useCallback(
    async (governmentIdType: string, governmentIdUrl: string, faceCaptureUrl: string) => {
      try {
        const response = await fetch('/api/kyc', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: 'submit',
            government_id_type: governmentIdType,
            government_id_url: governmentIdUrl,
            face_capture_url: faceCaptureUrl,
          }),
        });

        const result = await response.json();
        if (result.success) {
          mutate();
        }
        return result;
      } catch (error) {
        console.error('[v0] KYC submission error:', error);
        return { success: false, error: 'Submission failed' };
      }
    },
    [token, mutate]
  );

  return { submit };
}

// Hook to get token distributions
export function useTokenDistributions(userId?: string) {
  const { token } = useAuth();
  const { data, error, isLoading, mutate } = useSWR(
    token ? '/api/distributions' : null,
    (url) => fetcher(url, token),
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  return {
    distributions: data?.data || [],
    isLoading,
    error,
    mutate,
  };
}

// Hook to get admin users
export function useAdminUsers(role: string) {
  const { token } = useAuth();
  const { data, error, isLoading, mutate } = useSWR(
    token ? `/api/admin?action=users_by_role&role=${role}` : null,
    (url) => fetcher(url, token),
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  return {
    users: data?.data || [],
    isLoading,
    error,
    mutate,
  };
}

// Hook to get admin audit logs
export function useAdminAuditLogs() {
  const { token } = useAuth();
  const { data, error, isLoading, mutate } = useSWR(
    token ? '/api/admin?action=audit_logs' : null,
    (url) => fetcher(url, token),
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  );

  return {
    logs: data?.data || [],
    isLoading,
    error,
    mutate,
  };
}

// Hook for file upload
export function useFileUpload() {
  const { token } = useAuth();

  const upload = useCallback(
    async (file: File, type: 'government_id' | 'face_capture') => {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);

        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        const result = await response.json();
        return result;
      } catch (error) {
        console.error('[v0] Upload error:', error);
        return { success: false, error: 'Upload failed' };
      }
    },
    [token]
  );

  return { upload };
}
