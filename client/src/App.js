import React from 'react';
import { Route } from "react-router-dom"
import './App.css';

// Imported Components
import Login from './components/auth/Login';

function App() {
  return (
    <div className="App">
      <Route exact path="/" component={Login} />
    </div>
  );
}

export default App;
