import { DocumentReference, FieldValue, type QueryDocumentSnapshot } from 'firebase-admin/firestore';
import type { EventContext } from 'firebase-functions';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

type DocEvent = Parameters<typeof onDocumentCreated>[1];

// V1
export const transactionCounter = (snap: QueryDocumentSnapshot) => {

    const db = snap.ref.firestore;
    const collection = snap.ref.path.split('/')[0];
    const docData = snap.data();

    return sharedTransaction(db, collection, docData);
}

// V2
export const transactionCounterV2: DocEvent = (event) => {

    const data = event.data;

    if (!data) {
        return;
    }

    const db = data.ref.firestore;
    const collection = event.document.split('/')[0];
    const docData = data.data();

    return sharedTransaction(db, collection, docData);
};

// shared transaction
const sharedTransaction = (
    db: FirebaseFirestore.Firestore,
    collection: string,
    docData: FirebaseFirestore.DocumentData
) => {
    return db.runTransaction(async (transaction) => {

        // get doc uid
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

// V1
export const eventCounter = async (
    snap: QueryDocumentSnapshot,
    context: EventContext
) => {

    const db = snap.ref.firestore;
    const eventId = context.eventId;
    const eventType = context.eventType;
    const ref = snap.ref;
    const collection = snap.ref.path.split('/')[0];
    const docData = snap.data();

    return sharedEvent(db, eventId, eventType, collection, docData, ref);
}

// V2
export const eventCounterV2: DocEvent = async (event) => {

    const data = event.data;

    if (!data) {
        return;
    }

    const db = data.ref.firestore;
    const eventId = event.id;
    const eventType = event.type;
    const docData = data.data();
    const collection = data.ref.path.split('/')[0];
    const ref = data.ref;

    return sharedEvent(db, eventId, eventType, collection, docData, ref);
}

const sharedEvent = async (
    db: FirebaseFirestore.Firestore,
    eventId: string,
    eventType: string,
    collection: string,
    docData: FirebaseFirestore.DocumentData,
    ref: DocumentReference
) => {
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
        const i = eventType === create ? 1 : -1;

        transaction.set(countRef, {
            count: FieldValue.increment(i)
        }, { merge: true });

        // user counter
        const uid = docData.uid;
        const userRef = db.doc('users/' + uid);

        transaction.set(userRef, {
            [collection + 'Count']: FieldValue.increment(i)
        }, { merge: true });

        // add event
        return transaction.set(eventRef, {
            'type': eventType,
            'createdAt': FieldValue.serverTimestamp(),
            'documentRef': ref
        });

    });
}
