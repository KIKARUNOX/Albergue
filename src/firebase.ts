import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyB9hw6QlYegSaWWw0rtUKV1SLr0A7nV_ps",
  authDomain: "codigo316-837bd.firebaseapp.com",
  projectId: "codigo316-837bd",
  storageBucket: "codigo316-837bd.firebasestorage.app",
  messagingSenderId: "658193781917",
  appId: "1:658193781917:web:3bfe45c714e9707c7bf074",
  measurementId: "G-JLZDTLFM2Y"
};

const app = initializeApp(firebaseConfig);

try {
  if (typeof window !== "undefined") {
    getAnalytics(app);
  }
} catch (error) {
  console.error("Error en Analytics:", error);
  if (error instanceof Error) {
    console.error("Mensaje:", error.message);
    console.error("Stack:", error.stack);
  }
}

export const db = getFirestore(app);
export const auth = getAuth(app);
