import React, { useState } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';

function App() {
  // Ek state banayi hai taake pata chale kaunsa form dikhana hai
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="App" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      backgroundColor: '#f4f4f4',
      fontFamily: 'Arial, sans-serif'
    }}>
      
      <div style={{ 
        backgroundColor: '#fff', 
        padding: '30px', 
        borderRadius: '10px', 
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        width: '350px'
      }}>
        <h1 style={{ textAlign: 'center', color: '#333' }}>
          {isLogin ? "Welcome Back!" : "Join Us!"}
        </h1>

        {/* Buttons to switch between Login and Register */}
        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '20px' }}>
          <button 
            onClick={() => setIsLogin(true)}
            style={{ 
              border: 'none', 
              background: 'none', 
              fontWeight: isLogin ? 'bold' : 'normal',
              borderBottom: isLogin ? '2px solid blue' : 'none',
              cursor: 'pointer',
              padding: '10px'
            }}>
            Login
          </button>
          <button 
            onClick={() => setIsLogin(false)}
            style={{ 
              border: 'none', 
              background: 'none', 
              fontWeight: !isLogin ? 'bold' : 'normal',
              borderBottom: !isLogin ? '2px solid blue' : 'none',
              cursor: 'pointer',
              padding: '10px'
            }}>
            Register
          </button>
        </div>

        {/* Conditional Rendering: Jo state true hogi wahi dikhega */}
        {isLogin ? <Login /> : <Register />}
        
      </div>
    </div>
  );
}

export default App;