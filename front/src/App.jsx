import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import GaleriaSorteos from './GaleriaSorteos.jsx'


function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <GaleriaSorteos />
      </div>
    </>
  )
}

export default App
