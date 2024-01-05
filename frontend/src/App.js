import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import ImageUploader from './Pages/Main/ImageUploader'; // Asigurați-vă că calea este corectă către componenta ImageUploader
function App(){
  return (
    <Router>
      <Routes >
        <Route path="/" element={<ImageUploader />} />
      </Routes>
    </Router>
  );
};

export default App;