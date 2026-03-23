import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "./firebase";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import './App.css'

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div>Cargando...</div>;
  }

  return user ? <Dashboard /> : <Login />;
}

export default App;
