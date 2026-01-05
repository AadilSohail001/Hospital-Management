import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import './App.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ToastContainer />
    <App />
  </BrowserRouter>
);
