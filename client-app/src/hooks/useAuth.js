import { create } from 'zustand'
import { GET } from '../services/http'


export const useAuth = create((set) => ({
    isLoggedIn: false,
    user: null,
    isLoading: true,
    error: null,
    setIsLoggedIn: (val) => set({ isLoggedIn: val }),
    getAccountInfo: async () => {
        const data = await GET('/api/user')
        if (data && data.user) {
            set({ user: data.user, isLoading: false, isLoggedIn: true })
        } else {
            set({ user: null, isLoading: false, isLoggedIn: false })
        }

    },
    login: async (email, password) => {
        const response = await fetch('http://localhost:8000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: "include",
            body: JSON.stringify({
                email,
                password,
            }),
        })

        const data = await response.json()
        if (data.access_token) {
            localStorage.setItem('token', data.access_token)
            set({ isLoggedIn: true })

        } else {
            localStorage.removeItem('token')
        }
    },
    logout: async () => {
        set({ isLoggedIn: false, user: null })
        localStorage.removeItem('token')

    }


}))

