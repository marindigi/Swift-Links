import { toast } from 'react-hot-toast';
import { supabase } from '../supabaseClient';

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

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

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
      throw new Error(`Network error: ${err.message || 'Failed to fetch'}`);
    });

    let data;
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      data = {};
    }

    if (!response.ok) {
      let msg = data.error || errorMessage;
      if (response.status === 401) {
        msg = 'Unauthorized. Please log in again.';
      } else if (response.status === 403) {
        msg = 'Forbidden. You do not have permission to perform this action.';
      } else if (response.status === 404) {
        msg = 'The requested resource was not found.';
      } else if (response.status === 429) {
        msg = 'Rate limit exceeded. Please try again later.';
      } else if (response.status >= 500) {
        msg = 'Server error. Please try again later.';
      }
      throw new Error(msg);
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
    const finalError = error instanceof Error ? error : new Error(String(error || errorMessage));
    if (showToast && finalError.message !== 'Unauthorized') {
      toast.error(finalError.message);
    }
    throw finalError;
  }
}
