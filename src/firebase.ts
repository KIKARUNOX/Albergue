import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB9hw6QlYegSaWWw0rtUKV1SLr0A7nV_ps",
  authDomain: "codigo316-837bd.firebaseapp.com",
  projectId: "codigo316-837bd",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
