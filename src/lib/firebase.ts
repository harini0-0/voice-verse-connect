
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCRwTm0CgNgxearEbGK7jUulJnfXEjQBOU",
  authDomain: "lingobridge-a61e3.firebaseapp.com",
  projectId: "lingobridge-a61e3",
  storageBucket: "lingobridge-a61e3.firebasestorage.app",
  messagingSenderId: "589291718919",
  appId: "1:589291718919:web:d8cb379d0736be94addda2"
};

// const firebaseConfig = {

//   apiKey: "AIzaSyCCd8MZC1ltlrvQF0UTIBBjJcyX-kasbZg",

//   authDomain: "flash-chat-4395a.firebaseapp.com",

//   projectId: "flash-chat-4395a",

//   storageBucket: "flash-chat-4395a.appspot.com",

//   messagingSenderId: "419465650016",

//   appId: "1:419465650016:web:7089840aa8905668958805",

//   measurementId: "G-P3779QFGTJ"

// };



// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app);

export default app;
