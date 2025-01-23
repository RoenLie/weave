import { getAuth, GoogleAuthProvider, signInWithPopup, setPersistence, browserLocalPersistence, initializeAuth } from 'firebase/auth';
import { app } from './firebase.ts';

//import { getFirestore } from 'firebase/firestore';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
const auth = getAuth(app);

let currentUser = auth.currentUser;
auth.onAuthStateChanged(user => {
	if (user) {
		console.log('signed in', user);
		currentUser = user;
	}
	else {
		// User is signed out
		// ...
	}
});

if (!currentUser) {
	const button = document.createElement('button');
	button.textContent = 'Sign in with Google';
	button.addEventListener('click', async () => {
		await setPersistence(auth, browserLocalPersistence);

		const provider = new GoogleAuthProvider();
		const result = await signInWithPopup(auth, provider);
		currentUser = result.user;
	});


	const logoutButton = document.createElement('button');
	logoutButton.textContent = 'Sign out';
	logoutButton.addEventListener('click', async () => {
		await auth.signOut();
	});

	document.body.appendChild(button);
	document.body.appendChild(logoutButton);
}
else {
	console.log('welcome to the app', app);
}
