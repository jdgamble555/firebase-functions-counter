// Todos

import {
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where
} from "firebase/firestore";

import { writable, type Subscriber } from "svelte/store";
import { db } from "./firebase";

export const getTodos = (uid: string) => writable<Todo[] | null>(
    null,
    (set: Subscriber<Todo[] | null>) =>
        onSnapshot(
            query(
                collection(db, 'todos'),
                where('uid', '==', uid),
                orderBy('createdAt')
            ), (q) => {
                set(q.empty
                    ? []
                    : q.docs.map((doc) => ({ ...doc.data(), id: doc.id })) as Todo[]
                );
            })
);

export const getTotalTodos = () => writable<number>(0, (set: Subscriber<number>) =>
    onSnapshot(
        doc(db, '_counters/todos'),
        (q) => set(q.exists() ? q.data().count : 0)
    )
);

export const getTotalUserTodos = (uid: string) => writable<number>(0, (set: Subscriber<number>) =>
    onSnapshot(
        doc(db, `users/${uid}`),
        (q) => set(q.exists() ? q.data().todoCount : 0)
    )
);

export const addTodo = async (text: string, uid: string) => {

    const todoRef = doc(collection(db, 'todos'));

    setDoc(todoRef, {
        uid,
        text,
        complete: false,
        createdAt: serverTimestamp()
    });

}

export const updateTodo = (id: string, newStatus: boolean) => {
    updateDoc(doc(db, 'todos', id), { complete: newStatus });
}

export const deleteTodo = (id: string) => {

    const todoRef = doc(db, 'todos', id);

    deleteDoc(todoRef);
}

