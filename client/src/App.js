import React from 'react';
import { Route } from "react-router-dom"
import './App.css';

// Imported Components
import Login from './components/auth/Login';
import Dashboard from './components/dashboard/Dashboard';
import { Nav } from './components/nav/Nav';

function App() {
  return (
    <div className="App">
      <div className='app-container'>
        <Route exact path="/" component={Login} />
        <Route path="/showdashboard" component={Dashboard} />
      </div>
    </div>
  );
}

export default App;
