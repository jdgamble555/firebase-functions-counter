import { FieldValue, type QueryDocumentSnapshot } from 'firebase-admin/firestore';
import type { EventContext } from 'firebase-functions';

export const transactionCounter = (snap: QueryDocumentSnapshot) => {

    const db = snap.ref.firestore;

    const collection = 'todos';

    return db.runTransaction(async (transaction) => {

        // get todo uid
        const todoData = snap.data();
        const uid = todoData.uid;

        // get current todo collection count
        const todoCountQuery = db.collection(collection).count();
        const todoCountDoc = await transaction.get(todoCountQuery);

        // get current user todo count
        const userCountQuery = db
            .collection(collection)
            .where('uid', '==', uid)
            .count();
        const userCountDoc = await transaction.get(userCountQuery);

        // update todo count
        const countRef = db.doc(`_counters/${collection}`);
        transaction.set(countRef, {
            count: todoCountDoc.data().count
        }, { merge: true });

        // update user todo count
        const userRef = db.doc('users/' + uid);
        transaction.set(userRef, {
            todoCount: userCountDoc.data().count
        }, { merge: true });

    });
}

export const eventCounter = async (
    snap: QueryDocumentSnapshot,
    context: EventContext
) => {

    const db = snap.ref.firestore;
    const eventId = context.eventId;

    const collection = 'todos';

    // check for event id
    const eventRef = db.doc(`_events/${eventId}`);
    const eventDoc = await eventRef.get();

    // do nothing, increment already ran
    if (eventDoc.exists) {
        return null;
    }

    const countRef = db.doc(`_counters/${collection}`);
    const batch = db.batch();

    // setup increment or decrement
    const create = 'google.firestore.document.create';
    const i = context.eventType === create ? 1 : -1;

    // collection counter
    batch.set(countRef, {
        count: FieldValue.increment(i)
    }, { merge: true });

    // user counter
    const todoData = snap.data();
    const uid = todoData.uid;
    const userRef = db.doc('users/' + uid);

    batch.set(userRef, {
        todoCount: FieldValue.increment(i)
    }, { merge: true });

    // add event
    batch.set(eventRef, {
        'type': context.eventType,
        'createdAt': FieldValue.serverTimestamp(),
        'documentRef': snap.ref
    });

    // remove all old events
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const oldEventDocs = await db.collection('_events')
        .where('createdAt', '<=', tenMinutesAgo)
        .get();

    if (!oldEventDocs.empty) {
        oldEventDocs.forEach(doc => {
            batch.delete(doc.ref);
        });
    }

    return batch.commit();
}
