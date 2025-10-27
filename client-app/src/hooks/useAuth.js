import { create } from 'zustand'


export const useAuth = create((set) => ({
    isLoggedIn: false,
    accessToken: "",
    setIsLoggedIn: (val) => set({ isLoggedIn: val }),
    setAccessToken: (val) => set({ accessToken: val })
}))

