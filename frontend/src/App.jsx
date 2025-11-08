import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import GaleriaSorteos from './GaleriaSorteos.jsx';
import RegistroSorteo from './RegistroSorteo.jsx';

function App() {
  return (
    <div className='App'>
      <Navbar />

      <main className='app-content'>
        <Routes>
          <Route path="/" element={<GaleriaSorteos />} />


          <Route path="/rifas" element={<GaleriaSorteos />} />
          <Route path="/inicio" element={<RegistroSorteo />} />
          <Route path="/contacto" element={<GaleriaSorteos />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
