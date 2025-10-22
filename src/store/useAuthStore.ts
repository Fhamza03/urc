import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  token: string | null
  username: string | null
  externalId: string | null
  id: number | null
  setAuth: (token: string, username: string, externalId: string, id: number) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      username: null,
      externalId: null,
      id: null,
      setAuth: (token, username, externalId, id) =>
        set({ token, username, externalId, id }),
      clearAuth: () =>
        set({ token: null, username: null, externalId: null, id: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
)
