import { initializeApp } from 'firebase/app';
import { getFirestore, QueryDocumentSnapshot, type DocumentData, type FirestoreDataConverter } from 'firebase/firestore';


const firebaseConfig = {
	apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
	authDomain:        'poe2-passive-editor.firebaseapp.com',
	databaseURL:       'https://poe2-passive-editor-default-rtdb.europe-west1.firebasedatabase.app',
	projectId:         'poe2-passive-editor',
	storageBucket:     'poe2-passive-editor.firebasestorage.app',
	messagingSenderId: '61106472714',
	appId:             '1:61106472714:web:0c39b40f5d5b0ef745dcf3',
	measurementId:     'G-SH7T1VC5YF',
};
export const app = initializeApp(firebaseConfig);


// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);


export function asType<T extends DocumentData>(): FirestoreDataConverter<T> {
	return {
		toFirestore(doc: T): DocumentData {
			return doc as DocumentData;
		},
		fromFirestore(snapshot: QueryDocumentSnapshot): T {
			return snapshot.data()! as T;
		},
	};
}
