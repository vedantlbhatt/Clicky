import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyCDq2O40KkvbGJTmwwRUuxJKaRz0y0YwaE',
  authDomain: 'clicky-cookie-ab56.firebaseapp.com',
  databaseURL: 'https://clicky-cookie-ab56-default-rtdb.firebaseio.com',
  projectId: 'clicky-cookie-ab56',
  storageBucket: 'clicky-cookie-ab56.firebasestorage.app',
  messagingSenderId: '920884120188',
  appId: '1:920884120188:web:efa3f7fcee0969e640d7f9',
};

export const db = getDatabase(initializeApp(firebaseConfig));
