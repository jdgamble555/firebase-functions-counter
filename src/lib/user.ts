import { GoogleAuthProvider, onIdTokenChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { readable, type Subscriber } from "svelte/store";
import { auth } from "./firebase";

export async function loginWithGoogle() {
    return await signInWithPopup(auth, new GoogleAuthProvider());
}

export async function logout() {
    return await signOut(auth);
}

export const user = readable<UserType | null>(
    null,
    (set: Subscriber<UserType | null>) =>
        onIdTokenChanged(auth, (_user: User | null) => {
            if (!_user) {
                set(null);
                return;
            }
            const { displayName, photoURL, uid, email } = _user;
            set({ displayName, photoURL, uid, email });
        })
);