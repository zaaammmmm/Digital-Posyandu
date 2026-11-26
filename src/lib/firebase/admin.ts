import * as admin from "firebase-admin";

function getAdminApp() {
  if (admin.apps.length) return admin.app();
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  if (!projectId || !privateKey || !clientEmail) {
    throw new Error("Firebase Admin belum dikonfigurasi. Isi FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, dan FIREBASE_ADMIN_PRIVATE_KEY.");
  }
  return admin.initializeApp({ credential: admin.credential.cert({ projectId, clientEmail, privateKey }) });
}

// Lazy initialization keeps static builds possible while every runtime data access
// still fails closed when production credentials are absent.
const firestore = () => admin.firestore(getAdminApp());
const auth = () => admin.auth(getAdminApp());
export const adminDb = new Proxy({} as ReturnType<typeof admin.firestore>, {
  get(_target, property) {
    const instance = firestore();
    const value = Reflect.get(instance, property, instance);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
export const adminAuth = new Proxy({} as ReturnType<typeof admin.auth>, {
  get(_target, property) {
    const instance = auth();
    const value = Reflect.get(instance, property, instance);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
