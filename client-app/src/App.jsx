import './App.css'
import Login from './Login'
import Home from './Home'
import { useEffect } from 'react'
import { GET } from './services/http'
import { useState } from 'react'
import { useAuth } from './hooks/useAuth'

function App() {
  const { isLoggedIn, setIsLoggedIn } = useAuth()
  const [isLoading, setIsLoading] = useState(true)



  async function makeLightWeightProtectedCall() {
    setIsLoggedIn(false)
    const data = await GET('/api/me')
    if (data && data.user) {
      setIsLoggedIn(true)
    }
    setIsLoading(false)
  }


  useEffect(() => {
    makeLightWeightProtectedCall();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>
  }


  if (isLoggedIn) {
    return <Home />

  }

  return (
    <Login />
  )
}

export default App
