import { getEnvironment } from "./environment";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const config = getEnvironment();

const app = initializeApp(config);
const auth = getAuth(app);

export { auth };
