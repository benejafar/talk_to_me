// all the db related functions

import { addDoc, collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { db } from "./firebase";
import { generateSearchableTerms } from "./helpers";


const userCollection = collection(db,'user');
const userIdSearchTerms = collection(db,'userSearchTerms');
const conversationIdTerms = collection(db,'conversationIdTerms');
const messageRoomCollection = collection(db, 'messageRoom');

//userDoc reference
const userDocRef = (userId) => {
    return doc(userCollection,userId);
}

const searchDocRef = (userId) => {
    return doc(userIdSearchTerms, userId);
}

const conversationDocRef = (conversationId) => {
    return doc(messageRoomCollection,conversationId);
}

// this will also create searchable terms {userId: ['ab','cd']}
const createUserDoc = async (userId, userData) =>  {
    //add or create new user row
    try {
        await setDoc(userDocRef(userId), userData);
        await setDoc(searchDocRef(userId), {terms : generateSearchableTerms(userData.userName)})  //userId is docRef
    }catch(err) {
        console.log("createUserDoc", err.message);
        throw new Error("there is an error in creating user user_id : ", userId);
    }
}

const getUserDoc = async (userId) => {
    try {
        const userSnap = await getDoc(userDocRef(userId));
        return userSnap.data();
    } catch (err) {
        console.log("error while getting sign in data", err);
        console.log(err.message);
        console.log(err.code);
    }
}

//search for subname in firebase
const searchUserSubStringDB = async (userSubName) => {
    try {
        const q = query(userIdSearchTerms, where('terms', 'array-contains', userSubName));
        const userIdsSnap = await getDocs(q);
        const usersMatched = []
        for (const doc of userIdsSnap.docs) {
            const user = await getUserDoc(doc.id);
            usersMatched.push({...user, userId: doc.id});
        }
        return usersMatched;            
    } catch (err) {
        throw new Error("fireBaseDB", err)
    }
}

export const sendMessage = async (userAId, userBId, message) => {
   //userA = sender, //userB = receiver
    try {
        let conversationId = await getConversationId(userAId, userBId);
        const messageData = {
            sender: userAId,
            receiver: userBId,
            message: message,
            time: serverTimestamp()
        }
        let messageRef = collection(conversationDocRef(conversationId), 'messages');

        const response = await addDoc(messageRef, messageData);
        console.log("message send success", response);
    } catch (err) {
        throw new Error("error in sending message", err);
    }
   /* room collection
            conversation id  = document
                    messages = sub collection
                      {userAid, userBId, message, timestamp}*/
}

export const getConversationId = async (from, to) => {
    try {
        const q = query(conversationIdTerms, where('terms','array-contains', from));
        const conversationIdRef = await getDocs(q);
        let conversationId = -1;
        conversationIdRef.docs.forEach((doc) => {
            if (doc.data().terms[0] === to || doc.data().terms[1] === to){
                conversationId = doc.id;
            }
        })
        if (conversationId === -1) {
            const documentId = await addDoc(collection(db, "conversationIdTerms"), {terms: [from,to]}); 
            conversationId = documentId.id;
        }
        return conversationId;
    } catch (err) {
        console.log("sendMessage" + err);
    }
}

export const getMessgeRef = async (userAId, userBId) => {
    try {
        const conversationId = await getConversationId(userAId,userBId);

        const conversationRef = doc(db, 'messageRoom', conversationId);
        const messageRef = collection(conversationRef, 'messages');

        return messageRef;
    } catch (err) {
        throw new Error("Exception at getting message Ref", err.message)
    }
    

}

//a messageref will be created when a new user selected. 
// can call the snapshot with 'messageref'

// export const getAllMessages = async (messageRef) => {
//     //userA = sender, //userB = receiver
//     try {
        
//         const q = query(messageRef, orderBy('time','desc'));

//         const querySnapshot = await getDocs(q);
//         const messages = [];
//         querySnapshot.forEach((doc) => {
//             const data = doc.data();
//             const time = convertFireBaseTimeToJsTime(data.time);
//             data.time = time.toISOString();
//             messages.push(data);
//         });
//         return messages;
//     } catch (err) {
//         throw new Error("error in getting all message ", err);
//     }
    
// }

export const convertFireBaseTimeToJsTime = (data) => {
    if (data == null) return new Date(); // realtime don't providing me time. when I send message
    const seconds = data.seconds;
    const nanoSec = data.nanoseconds;
    const nanoToMilliSec = (nanoSec/Math.pow(10,6));
    const secToMilliSec = seconds*1000;
    const date = new Date(nanoToMilliSec+secToMilliSec);
    return date;
}

export {createUserDoc, getUserDoc, searchUserSubStringDB};
