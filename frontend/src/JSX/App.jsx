import React from 'react';
import { Routes, Route } from 'react-router-dom';
import GaleriaSorteos from './GaleriaSorteos.jsx';
import RegistroSorteo from './RegistroSorteo.jsx';
import Inicio from './Inicio.jsx';
import Login from './LoginAdmin.jsx';
import PublicLayout from './PublicLayout.jsx';
import '../CSS/Global.css';


function App() {
  return (
    <div className='App'>
      <Routes>
        <Route element={<PublicLayout />}>
        <Route path="/" element={<Inicio />} />
        <Route path="/inicio" element={<Inicio />} />
        <Route path="/rifas" element={<GaleriaSorteos />} />
        <Route path="/registro" element={<RegistroSorteo />} />
        <Route path="/contacto" element={<GaleriaSorteos />} />
        </Route>

        <Route path="/login" element={<Login />} />
      </Routes>
    </div>
  );
}

export default App;
