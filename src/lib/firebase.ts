
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC8JWE7sPPTk9XXXXXXXXXXXXXXXXXXXX", // Replace with your Firebase API key
  authDomain: "voice-verse-connect.firebaseapp.com",
  projectId: "voice-verse-connect",
  storageBucket: "voice-verse-connect.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdefghijklmnopqrstuv",
  databaseURL: "https://voice-verse-connect-default-rtdb.firebaseio.com" // Add the database URL
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app);

export default app;
