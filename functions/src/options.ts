import {HttpsOptions} from "firebase-functions/v2/https";

export const tokyoopt: HttpsOptions = {region: "asia-northeast1", cors: true};
export const tokyolongopt: HttpsOptions = {
  region: "asia-northeast1",
  timeoutSeconds: 540,
  memory: "512MiB",
  cors: true,
};
