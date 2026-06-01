import React from 'react';
import ReactDOM from 'react-dom/client';
import './theme.css'; // Centralized design tokens — imported first
import './App.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);