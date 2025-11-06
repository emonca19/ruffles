import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import GaleriaSorteos from './GaleriaSorteos.jsx'
import Navbar from '../NavBar.jsx'


function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className='App'>
        <Navbar />

        <main className='app-content'>
          <GaleriaSorteos />
        </main>
        
      </div>
    </>
  )
}

export default App
