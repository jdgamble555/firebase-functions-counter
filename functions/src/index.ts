import { firestore } from 'firebase-functions';
import { eventCounter, transactionCounter } from './count';

//import { onDocumentCreated, onDocumentDeleted } from 'firebase-functions/v2/firestore'
//import { eventCounterV2, transactionCounterV2 } from './count';

// todo counter

const collection = 'todos';

// V1
export const addTodo = firestore
    .document(`${collection}/{docId}`)
    .onCreate(transactionCounter);

export const deleteTodo = firestore
    .document(`${collection}/{docId}`)
    .onDelete(eventCounter);


// V2
//export const addTodo = onDocumentCreated(`${collection}/{docId}`, eventCounterV2);

//export const deleteTodo = onDocumentDeleted(`${collection}/{docId}`, transactionCounterV2);
