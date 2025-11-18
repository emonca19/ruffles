import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './NavBar.jsx';

export default function PublicLayout() {
  return (
    <>
      <Navbar />
      <main className="app-content">
        <Outlet />
      </main>
    </>
  );
}