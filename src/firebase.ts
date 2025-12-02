// firebase.ts
import * as admin from "firebase-admin";
import serviceAccount from "../uaevisaapp-firebase-adminsdk-fbsvc-c08b4d1df0.json";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

export default admin;
