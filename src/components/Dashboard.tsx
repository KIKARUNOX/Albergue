import React from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import CalendarView from "./CalendarView";
import Leaderboard from "./Leaderboard";
import SearchBar from "./SearchBar";

export default function Dashboard() {
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <div>
      <h1>Dashboard</h1>
      <button onClick={handleLogout}>Cerrar Sesión</button>
      <SearchBar />
      <CalendarView />
      <Leaderboard />
    </div>
  );
}
