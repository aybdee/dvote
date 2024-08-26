import { stringToHex } from "viem";

export async function sendErrorNotice(app: any, message: string) {
  await app.createNotice({
    payload: stringToHex(JSON.stringify({ error: message })),
  });
}

export async function sendSuccessNotice(app: any, message: string) {
  await app.createNotice({
    payload: stringToHex(JSON.stringify({ message: message })),
  });
}

export async function sendDataNotice(app: any, data: any) {
  await app.createNotice({
    payload: stringToHex(JSON.stringify({ data: data })),
  });
}
