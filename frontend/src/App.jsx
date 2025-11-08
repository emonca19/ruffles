import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import GaleriaSorteos from './GaleriaSorteos.jsx';
import RegistroSorteo from './RegistroSorteo.jsx';
import Inicio from './Inicio.jsx';

function App() {
  return (
    <div className='App'>
      <Navbar />

      <main className='app-content'>
        <Routes>
          <Route path="/Inicio" element={<Inicio />} />
          <Route path="/rifas" element={<GaleriaSorteos />} />
          <Route path="/registro" element={<RegistroSorteo />} />
          <Route path="/contacto" element={<GaleriaSorteos />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
