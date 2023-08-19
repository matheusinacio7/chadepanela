import 'dotenv/config';
import { customAlphabet } from 'nanoid';
import { google } from 'googleapis';

let jwtClient;
let sheets;

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz', 10);

export async function connect() {
  jwtClient = new google.auth.JWT(
    process.env.CLIENT_EMAIL,
    null,
    process.env.PRIVATE_KEY,
    ['https://www.googleapis.com/auth/spreadsheets'],
  );
  
  await jwtClient.authorize();
  sheets = google.sheets('v4');
}

export async function getAllGifts() {
  const response = await sheets.spreadsheets.values.get({
    auth: jwtClient,
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: ['A2:E'],
  });

  return response.data.values.map(toGiftObject);
}

export async function chooseGift(giftId) {
  const gifts = await getAllGifts();

  const chosenGiftIndex = gifts.findIndex(({ id }) => id === giftId);
  const chosenGift = gifts[chosenGiftIndex];
  if (chosenGift.current >= chosenGift.maximum) {
    throw new Error("Cannot choose this gift, it has already reached maximum");
  }

  chosenGift.current += 1;
  const rowNumber = chosenGiftIndex + 2;

  await sheets.spreadsheets.values.update({
    auth: jwtClient,
    spreadsheetId: process.env.SPREADSHEET_ID,
    valueInputOption: 'RAW',
    range: [`D${rowNumber}`],
    requestBody: { values: [[chosenGift.current]] }
  });

  return { newCurrent: chosenGift.current };
}

function toGiftObject(row) {
  const [id, description, photo_url, current, maximum] = row;
  return ({
    id,
    description,
    photo_url,
    current: parseIntWithDefault(current),
    maximum: parseIntWithDefault(maximum),
  });
}

function parseIntWithDefault(intAsString) {
  const parsed = Number.parseInt(intAsString);

  return !Number.isNaN(parsed) ? parsed : 0;
} 

// Populate IDs
// const response = await sheets.spreadsheets.values.get({
//   auth: jwtClient,
//   spreadsheetId: process.env.SPREADSHEET_ID,
//   range: ['A2:E'],
// });

// console.log(response.data.values.map(() => [nanoid()]));

// await sheets.spreadsheets.values.update({
//   auth: jwtClient,
//   spreadsheetId: process.env.SPREADSHEET_ID,
//   valueInputOption: 'RAW',
//   range: ['A2:A'],
//   requestBody: { values: response.data.values.map(() => [nanoid()]) }
// });