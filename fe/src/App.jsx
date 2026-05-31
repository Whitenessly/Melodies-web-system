import './App.css'
import React from 'react';
import { Navigate, Route, Routes } from 'react-router';
import Home from './routes/Home';

function App() {
  return (
    <div>
      <Routes>
        <Route path='' element={<Navigate to={'/home'} />} />
        <Route path='/home' element={<Home />} />
      </Routes>
    </div>
  )
}

export default App
