// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCgKTtjGEHyoqZ0cDa5QZMwQe8c0iSEo4w",
  authDomain: "loginparklotconsole.firebaseapp.com",
  projectId: "loginparklotconsole",
  storageBucket: "loginparklotconsole.firebasestorage.app",
  messagingSenderId: "891919276145",
  appId: "1:891919276145:web:f6aba59bcfdf21930ba3d0",
  databaseURL: "https://loginparklotconsole-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);