import { firestore } from 'firebase-functions';
import { eventCounter, transactionCounter } from './count';

// todo counter

const collection = 'todos';

export const addTodo = firestore
    .document(`${collection}/{docId}`)
    .onCreate(transactionCounter);

export const deleteTodo = firestore
    .document(`${collection}/{docId}`)
    .onDelete(eventCounter);
