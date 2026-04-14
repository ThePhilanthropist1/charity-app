import useSWR from 'swr';
import { useCallback } from 'react';

// ── TOKEN HELPER — always reads fresh from localStorage ───────────────────────
function getToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('auth_token') || '';
}

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
  const user  = typeof window !== 'undefined' ? localStorage.getItem('auth_user')  : null;

  return {
    token,
    user:            user ? JSON.parse(user) : null,
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

  return { user: data?.data, isLoading, error, mutate };
}

// Hook to get KYC submission
export function useKYCSubmission() {
  const { token } = useAuth();
  const { data, error, isLoading, mutate } = useSWR(
    token ? '/api/kyc?action=get' : null,
    (url) => fetcher(url, token),
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  );

  return { submission: data?.data, isLoading, error, mutate };
}

// ── SUBMIT KYC — token read at call time, not hook init ───────────────────────
export function useSubmitKYC() {
  const { mutate } = useKYCSubmission();

  const submit = useCallback(
    async (governmentIdType: string, governmentIdUrl: string, faceCaptureUrl: string) => {
      // Read fresh token at call time — avoids stale null from hook init
      const token = getToken();
      if (!token) {
        return { success: false, error: 'Not authenticated. Please log in again.' };
      }

      try {
        const response = await fetch('/api/kyc', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            action:              'submit',
            government_id_type:  governmentIdType,
            government_id_url:   governmentIdUrl,
            face_capture_url:    faceCaptureUrl,
          }),
        });

        const result = await response.json();
        if (result.success) mutate();
        // Always return the real API response — never swallow the error
        return result;
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Submission failed. Please try again.';
        console.error('[kyc] submission error:', msg);
        return { success: false, error: msg };
      }
    },
    [mutate] // token removed from deps — read fresh each call
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

  return { distributions: data?.data || [], isLoading, error, mutate };
}

// Hook to get admin users
export function useAdminUsers(role: string) {
  const { token } = useAuth();
  const { data, error, isLoading, mutate } = useSWR(
    token ? `/api/admin?action=users_by_role&role=${role}` : null,
    (url) => fetcher(url, token),
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  return { users: data?.data || [], isLoading, error, mutate };
}

// Hook to get admin audit logs
export function useAdminAuditLogs() {
  const { token } = useAuth();
  const { data, error, isLoading, mutate } = useSWR(
    token ? '/api/admin?action=audit_logs' : null,
    (url) => fetcher(url, token),
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  );

  return { logs: data?.data || [], isLoading, error, mutate };
}

// ── FILE UPLOAD — token read at call time, not hook init ──────────────────────
export function useFileUpload() {
  const upload = useCallback(
    async (file: File, type: 'government_id' | 'face_capture') => {
      // Read fresh token at call time
      const token = getToken();
      if (!token) {
        return { success: false, error: 'Not authenticated. Please log in again.' };
      }

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
        // Return real API response including real error messages
        return result;
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Upload failed. Please try again.';
        console.error('[upload] error:', msg);
        return { success: false, error: msg };
      }
    },
    [] // no deps — token read fresh each call
  );

  return { upload };
}