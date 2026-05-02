import { initializeApp } from \"firebase/app\";
import { getAuth, GoogleAuthProvider } from \"firebase/auth\";
import { getFirestore } from \"firebase/firestore\";
import { getStorage } from \"firebase/storage\";

const firebaseConfig = {
  apiKey: \"AIzaSyD2bgwaNoJ9NphnoI33fgwxQhsFiCYd_zM\",
  authDomain: \"voltladies-5ebd7.firebaseapp.com\",
  projectId: \"voltladies-5ebd7\",
  storageBucket: \"voltladies-5ebd7.firebasestorage.app\",
  messagingSenderId: \"492346802512\",
  appId: \"1:492346802512:web:2ae967787584b6fb76ac55\",
  measurementId: \"G-2H25L7TY28\",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
