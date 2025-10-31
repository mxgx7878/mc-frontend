// src/store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'client' | 'supplier';
  profile_image?: string;
  company_id?: number;
  contact_name?: string;
  contact_number?: string;
  location?: string;
  lat?: number;
  long?: number;
  delivery_radius?: number;
  shipping_address?: string;
  billing_address?: string;
  company?: {
    id: number;
    name: string;
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  checkAuth: () => Promise<boolean>;
  setToken: (token: string) => void; // ✅ NEW: Update token only
  isAdmin: () => boolean;
  isClient: () => boolean;
  isSupplier: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      // Actions
      login: (user, token) => {
        set({ user, token, isAuthenticated: true });
      },
      
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        localStorage.clear();
      },
      checkAuth: async () => {
        const { token, logout } = get();
        if (!token) {
          logout();
          return false;
        }

        try {
          const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/user  `, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error('Token invalid');

          const data = await res.json();
          if (data.user) set({ user: data.user, isAuthenticated: true });
          else set({ isAuthenticated: true });

          return true;
        } catch {
          logout();
          return false;
        }
      },
      
      updateUser: (userData) => {
        set((state) => {
          if (!state.user) return state;
          
          console.log('Current user:', state.user);
          console.log('Updating with:', userData);
          
          const updatedUser = {
            ...state.user,
            ...userData,
            // Ensure nested objects like company are properly merged
            ...(userData.company && {
              company: {
                ...state.user.company,
                ...userData.company,
              },
            }),
          };
          
          console.log('Updated user:', updatedUser);
          
          return { user: updatedUser };
        });
      },
      
      // ✅ NEW: Set token only (for password change)
      setToken: (token) => {
        set({ token });
      },
      
      // Role checks
      isAdmin: () => get().user?.role === 'admin',
      isClient: () => get().user?.role === 'client',
      isSupplier: () => get().user?.role === 'supplier',
    }),
    {
      name: 'auth-storage',
    }
  )
);