const API_BASE = "http://localhost:9000"
import { useAuth } from '../hooks/useAuth'; // Import the store utility
export async function GET(url: string) {
    const token = localStorage.getItem('token')
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
        localStorage.removeItem('token')


        let refreshResponse = await fetch(`${API_BASE}/api/auth/refresh`, {
            credentials: "include"
        })

        if (refreshResponse.ok) {
            let data = await refreshResponse.json()
            localStorage.setItem("token", data.access_token)
            return GET(url)
        }

        //TODO: need to set the zustand state

        // useAuth.getState().logout();
        useAuth.getState().logout();





    }

}


export async function POST(url: string, body: any) {
    const token = localStorage.getItem('token')
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
        localStorage.removeItem('token')


        let refreshResponse = await fetch(`${API_BASE}/api/auth/refresh`, {
            credentials: "include"
        })

        if (refreshResponse.ok) {
            let data = await refreshResponse.json()
            localStorage.setItem("token", data.access_token)
            return POST(url, body)
        }


        useAuth.getState().logout();





    }

}




