import FirebaseConfig from "./FirestoreConfig";
import firebase from "firebase";
import "firebase/firestore";

if (!firebase.apps.length) {
    firebase.initializeApp(FirebaseConfig);
} else {
    console.log("Firebase apps already running...");
}

export const db = firebase.firestore();

export default firebase;
