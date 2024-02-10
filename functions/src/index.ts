import { firestore } from 'firebase-functions';
import { eventCounter } from './count';

// todo counter

const collection = 'todos';

export const addTodo = firestore
    .document(`${collection}/{docId}`)
    .onCreate(eventCounter);

export const deleteTodo = firestore
    .document(`${collection}/{docId}`)
    .onDelete(eventCounter);

