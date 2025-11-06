import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import GaleriaSorteos from './GaleriaSorteos.jsx'
import Navbar from './NavBar.jsx'
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import inicio from './inicio.jsx'; 

function App() {
  const [count, setCount] = useState(0)

  return (
    
    <>
    <BrowserRouter>
      <div className='App'>
        {/* El Navbar debe estar DENTRO del BrowserRouter */}
        <Navbar /> 

        <main className='app-content'>
          <Routes>
            {/* 2. **Ruta Raíz (/)** para el componente Inicio (o la landing page) */}
            <Route path="/" element={<inicio />} /> 
            
            {/* 3. **Ruta /rifas** cargará el componente GaleriaSorteos */}
            <Route path="/rifas" element={<GaleriaSorteos />} /> 
            
            {/* 4. **Ruta /contacto** cargará el componente Contacto */}
            {/* Nota: Asegúrate de importar Contacto y que el nombre del componente coincida */}
            <Route path="/contacto" element={<GaleriaSorteos />} />
            
            {/* Si quieres que /inicio funcione, debe apuntar al mismo componente que / */}
            <Route path="/inicio" element={<inicio />} /> 

          </Routes>
        </main>
      </div>
    </BrowserRouter>
    </>
  )
}

export default App
