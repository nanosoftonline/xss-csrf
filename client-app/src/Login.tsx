import { useState } from "react"
import { POST } from "./services/http"

export default function Login() {
    const [email, setEmail] = useState('demo@nanosoft.co.za')
    const [password, setPassword] = useState('password')

    async function login() {
        const data = await POST('/api/auth/login', { email, password })
        if (data && data.access_token) {
            localStorage.setItem('token', data.access_token)
            window.location.href = '/'
        }
    }

    return (
        <div>
            <div className='flex-1 items-center justify-center'>
                <div className='mb-4'>Login</div>
                <input type="email" placeholder='Email' className='border rounded-sm p-2 mb-4' value={email} onChange={(e) => setEmail(e.target.value)} />
                <br />
                <input type="password" placeholder='Password' className='border rounded-sm p-2 mb-4' value={password} onChange={(e) => setPassword(e.target.value)} />
                <br />
                <button
                    className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'
                    onClick={login}
                >
                    Login
                </button>
            </div>
        </div>
    )
}