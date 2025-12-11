import React from 'react';
import { Routes, Route } from 'react-router-dom';
import GaleriaSorteos from './GaleriaSorteos.jsx';
import RegistroSorteo from './RegistroSorteo.jsx';
import Inicio from './Inicio.jsx';
import Login from './LoginAdmin.jsx';
import PublicLayout from './PublicLayout.jsx';
import RegistroUsuario from './RegistroAdmin.jsx';
import RuffleDetail from './RuffleDetail.jsx';
import ParticipacionSorteos from './ParticipacionSorteos.jsx';
import ParticipacionDetalle from './ParticipacionDetalle.jsx';  
import GaleriaEvidencia from './GaleriaEvidencia.jsx';
import '../CSS/Global.css';
import DetalleComprobante from './DetalleComprobante.jsx';


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
        <Route path="/detalle/:id" element={<RuffleDetail />} />
        <Route path="/registroUsuario" element={<RegistroUsuario />} />
        <Route path="/participacion" element={<ParticipacionSorteos />} />
        <Route path="/galeria" element={<GaleriaSorteos />} />
        <Route path="/participacion/detalle/:id" element={<ParticipacionDetalle />} /> {/* Envio Conmprobante usuario */}
        <Route path="/galeriaEvidencia" element={<GaleriaEvidencia />} />
        <Route path="/verificacion/detalle/:id" element={<DetalleComprobante />} /> {/* ACPETAR/RECHAZAR rganizador */}
        </Route>

        
        <Route path="/login" element={<Login />} />
      </Routes>
    </div>
  );
}

export default App;
