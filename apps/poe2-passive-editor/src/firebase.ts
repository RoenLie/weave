import { initializeApp } from 'firebase/app';


const firebaseConfig = {
	apiKey:            '',
	authDomain:        'poe2-passive-editor.firebaseapp.com',
	projectId:         'poe2-passive-editor',
	storageBucket:     'poe2-passive-editor.firebasestorage.app',
	messagingSenderId: '61106472714',
	appId:             '1:61106472714:web:0c39b40f5d5b0ef745dcf3',
	measurementId:     'G-SH7T1VC5YF',
};
export const app = initializeApp(firebaseConfig);
