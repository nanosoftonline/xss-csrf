const API_BASE = "http://localhost:9000"
import { useAuth } from '../hooks/useAuth';
export async function GET(url: string) {
    const token = useAuth.getState().accessToken;
    let response = await fetch(`${API_BASE}${url}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    })

    if (response.ok) {
        return response.json()
    }

    if (response.status === 401) {
        useAuth.getState().setAccessToken("");



        let refreshResponse = await fetch(`${API_BASE}/api/auth/refresh`, {
            credentials: "include"
        })

        if (refreshResponse.ok) {
            let data = await refreshResponse.json()
            useAuth.getState().setAccessToken(data.access_token);
            return GET(url)
        }

        useAuth.getState().setIsLoggedIn(false);
    }

}


export async function POST(url: string, body: any) {
    const token = useAuth.getState().accessToken;
    let response = await fetch(`${API_BASE}${url}`, {
        method: 'POST',
        credentials: "include",
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
    })

    if (response.ok) {
        return response.json()
    }

    if (response.status === 401) {
        useAuth.getState().setAccessToken("");
        let refreshResponse = await fetch(`${API_BASE}/api/auth/refresh`, {
            credentials: "include"
        })

        if (refreshResponse.ok) {
            let data = await refreshResponse.json()
            useAuth.getState().setAccessToken(data.access_token);
            return POST(url, body)
        }
        useAuth.getState().setIsLoggedIn(false);
    }

}