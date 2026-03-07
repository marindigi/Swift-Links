import { toast } from 'react-hot-toast';
import { auth } from './firebase';
import { loadingManager } from './loading';

interface ApiOptions {
  method?: string;
  headers?: HeadersInit;
  body?: BodyInit | null;
  errorMessage?: string;
  successMessage?: string;
  showToast?: boolean;
}

export async function apiClient<T = any>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const {
    method = 'GET',
    headers = {},
    body = null,
    errorMessage = 'An error occurred',
    successMessage,
    showToast = true,
  } = options;

  loadingManager.setLoading(true);
  try {
    const user = auth.currentUser;
    const token = user ? await user.getIdToken() : null;

    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body,
      credentials: 'include',
    }).catch(err => {
      if (showToast) {
        console.error(`[API Network Error] ${method} ${endpoint}:`, err);
      }
      throw new Error(`Network error: ${err.message || 'Failed to fetch'}`);
    });

    let data;
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      if (showToast) {
        console.error(`[API Parse Error] ${method} ${endpoint}:`, e);
      }
      data = {};
    }

    if (!response.ok) {
      const msg = data.error || errorMessage;
      if (showToast) {
        console.error(`[API Error] ${method} ${endpoint} (${response.status}):`, msg);
      }
      
      let userMsg = msg;
      if (response.status === 401) {
        userMsg = 'Unauthorized. Please log in again.';
      } else if (response.status === 403) {
        userMsg = 'Forbidden. You do not have permission to perform this action.';
      } else if (response.status === 404) {
        userMsg = 'The requested resource was not found.';
      } else if (response.status === 429) {
        userMsg = 'Rate limit exceeded. Please try again later.';
      } else if (response.status >= 500) {
        userMsg = 'Server error. Please try again later.';
      }
      throw new Error(userMsg);
    }

    if (response.status === 204) {
      if (showToast && successMessage) {
        toast.success(successMessage);
      }
      return {} as T;
    }

    if (showToast && successMessage) {
      toast.success(successMessage);
    }

    return data;
  } catch (error: any) {
    console.error(`[API Request Error] ${method} ${endpoint}:`, error);
    const finalError = error instanceof Error ? error : new Error(String(error || errorMessage));
    if (showToast && finalError.message !== 'Unauthorized') {
      toast.error(finalError.message);
    }
    throw finalError;
  } finally {
    loadingManager.setLoading(false);
  }
}
