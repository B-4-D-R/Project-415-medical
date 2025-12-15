// API client for backend communication
// Change this to your backend URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Helper to get auth token from localStorage
const getToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// Helper to set auth token
export const setToken = (token: string): void => {
  localStorage.setItem('auth_token', token);
};

// Helper to remove auth token
export const removeToken = (): void => {
  localStorage.removeItem('auth_token');
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!getToken();
};

// Generic fetch wrapper with auth
async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || error.detail || 'Request failed');
  }

  return response.json();
}

// Auth endpoints
export const authApi = {
  register: async (data: { name: string; email: string; password: string }) => {
    return fetchWithAuth<{ message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  login: async (data: { email: string; password: string }) => {
    return fetchWithAuth<{ token: string; user: { id: string; name: string; email: string } }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },
};

// Chat types
export interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  raw_model_response: string;
  created_at: string;
}

export interface Chat {
  id: string;
  title: string;
  updated_at: string;
  messages?: Message[];
}

// Chat endpoints
export const chatsApi = {
  getAll: async () => {
    return fetchWithAuth<Chat[]>('/chats');
  },

  getById: async (chatId: string) => {
    return fetchWithAuth<Chat>(`/chats/${chatId}`);
  },

  create: async (title: string) => {
    return fetchWithAuth<Chat>('/chats', {
      method: 'POST',
      body: JSON.stringify({"title": title})
    });
  },

  sendMessage: async (chatId: string, content: string) => {
    // console.log({ "message": content })
    return fetchWithAuth<Message>(`/chats/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ "message": content }),
    });
  },

  delete: async (chatId: string) => {
    return fetchWithAuth<{ message: string }>(`/chats/${chatId}`, {
      method: 'DELETE',
    });
  },
};

// Upload endpoints
export const uploadsApi = {
  uploadPrescription: async (file: File) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/uploads/prescription`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || 'Upload failed');
    }

    return response.json();
  },

  uploadTestResult: async (file: File) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/uploads/test-result`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || 'Upload failed');
    }

    return response.json();
  },
};
