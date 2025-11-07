// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA6jcaweVdCL37UVBgenx9sPDVygrjzve4",
  authDomain: "petstyle-7c1b6.firebaseapp.com",
  projectId: "petstyle-7c1b6",
  storageBucket: "petstyle-7c1b6.appspot.com",
  messagingSenderId: "912793667091",
  appId: "1:912793667091:android:b2cd55a8ece2be6cf861e6"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
