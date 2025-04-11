// src/firebaseConfig.js
import {initializeApp} from "firebase/app";
import {getAuth} from "firebase/auth";
// If you plan to use Firestore directly from the client later:
// import { getFirestore } from "firebase/firestore";
// Import the functions you need from the SDKs you need
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAZjIMXIYoT4TpXwzSaDxDBai2rqHM5Lko",
  authDomain: "task-managment-481c5.firebaseapp.com",
  projectId: "task-managment-481c5",
  storageBucket: "task-managment-481c5.firebasestorage.app",
  messagingSenderId: "281276958363",
  appId: "1:281276958363:web:36eb1a50f49126ed0e683e",
  measurementId: "G-RTHZ9CC3Z2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Export Firestore instance if needed later
// export const db = getFirestore(app);

// Make auth available globally if needed (e.g., for the api.js helper)
// Be cautious with global variables, but can be convenient for this pattern.
// window.firebase = { auth }; // Optional, see api.js update

export default app; // Export the initialized app if needed elsewhere