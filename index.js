const { Telegraf } = require('telegraf');
const { google } = require('googleapis');
const fs = require('fs');

// Load your service account credentials
const CREDENTIALS = JSON.parse(fs.readFileSync('./credentials.json'));

// Create a client to interact with the Google Sheets API
const client = new google.auth.JWT(
  CREDENTIALS.client_email,
  null,
  CREDENTIALS.private_key,
  ['https://www.googleapis.com/auth/spreadsheets']
);

// Google Sheets API setup
const sheets = google.sheets({ version: 'v4', auth: client });
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID

// Telegram bot setup
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Function to append data to Google Sheets
async function appendToSheet(values) {
  const request = {
    spreadsheetId: SPREADSHEET_ID,
    range: 'Sheet1!A:B',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    resource: {
      values: [values],
    },
  };

  try {
    const response = await sheets.spreadsheets.values.append(request);
    console.log('Data appended:', response.data.updates);
  } catch (err) {
    console.error('Error appending data:', err);
  }
}

// Bot command to handle incoming messages
bot.on('text', (ctx) => {
  const message = ctx.message.text;

  const date = new Date();
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Months are 0-based
  const day = String(date.getUTCDate()).padStart(2, '0');

  const formattedDate = `${day}-${month}-${year}`
  const [amount, category, description] = message.split(' ');

  if (!isNaN(amount) && category) {
    appendToSheet([formattedDate, amount, category, description])
      .then(() => ctx.reply('Transaction recorded successfully!'))
      .catch((err) => ctx.reply('Error recording transaction.'));
  } else {
    ctx.reply('Please use the format: "<amount> <category> <description>"');
  }
});

// Start the bot
bot.launch();

console.log('Bot is running...');
