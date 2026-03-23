import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "./firebase";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Dashboard from "./components/Dashboard";
import ImportarJovenes from "./components/ImportarJovenes";
import './App.css'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSignup, setIsSignup] = useState(false);

  useEffect(() => {
    onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (user) {
    return <Dashboard />;
  }

  return isSignup ? (
    <div>
      <Signup />
      <p style={{ textAlign: "center" }}>
        ¿Ya tienes cuenta? <button onClick={() => setIsSignup(false)}>Inicia sesión</button>
      </p>
    </div>
  ) : (
    <div>
      <Login />
      <p style={{ textAlign: "center" }}>
        ¿No tienes cuenta? <button onClick={() => setIsSignup(true)}>Regístrate</button>
      </p>
    </div>
  );
}

export default App;

export function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/importar-jovenes" element={<ImportarJovenes />} />
      </Routes>
    </Router>
  );
}
