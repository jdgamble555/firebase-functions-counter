import { FieldValue, type QueryDocumentSnapshot } from 'firebase-admin/firestore';
import type { EventContext } from 'firebase-functions';

export const transactionCounter = (snap: QueryDocumentSnapshot) => {

    const db = snap.ref.firestore;

    // get the collection name
    const collection = snap.ref.path.split('/')[0];

    return db.runTransaction(async (transaction) => {

        // get doc uid
        const docData = snap.data();
        const uid = docData.uid;

        // get current doc collection count
        const docCountQuery = db.collection(collection).count();
        const docCountDoc = await transaction.get(docCountQuery);

        // get current user doc count
        const userCountQuery = db
            .collection(collection)
            .where('uid', '==', uid)
            .count();
        const userCountDoc = await transaction.get(userCountQuery);

        // update doc count
        const countRef = db.doc(`_counters/${collection}`);
        transaction.set(countRef, {
            count: docCountDoc.data().count
        }, { merge: true });

        // update user doc count
        const userRef = db.doc('users/' + uid);
        transaction.set(userRef, {
            [collection + 'Count']: userCountDoc.data().count
        }, { merge: true });

    });
}

export const eventCounter = async (
    snap: QueryDocumentSnapshot,
    context: EventContext
) => {

    const db = snap.ref.firestore;
    const eventId = context.eventId;

    // get the collection name
    const collection = snap.ref.path.split('/')[0];

    // get all expired events
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const oldEventDocs = await db.collection('_events')
        .where('createdAt', '<=', tenMinutesAgo)
        .get();

    return db.runTransaction(async (transaction) => {

        // check for event id
        const eventRef = db.doc(`_events/${eventId}`);
        const eventDoc = await transaction.get(eventRef);

        // remove old events
        if (!oldEventDocs.empty) {
            oldEventDocs.forEach(doc => {
                transaction.delete(doc.ref);
            });
        }

        // do nothing, increment already ran
        if (eventDoc.exists) {
            return null;
        }

        const countRef = db.doc(`_counters/${collection}`);

        // setup increment or decrement
        const create = 'google.firestore.document.create';
        const i = context.eventType === create ? 1 : -1;

        transaction.set(countRef, {
            count: FieldValue.increment(i)
        }, { merge: true });

        // user counter
        const docData = snap.data();
        const uid = docData.uid;
        const userRef = db.doc('users/' + uid);

        transaction.set(userRef, {
            [collection + 'Count']: FieldValue.increment(i)
        }, { merge: true });

        // add event
        return transaction.set(eventRef, {
            'type': context.eventType,
            'createdAt': FieldValue.serverTimestamp(),
            'documentRef': snap.ref
        });
        
    });
}
