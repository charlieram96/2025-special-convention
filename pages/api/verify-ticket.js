import { google } from "googleapis";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Content-Type", "text/html");
    return res.status(405).send("<h1>Method not allowed</h1>");
  }

  const { ticketId } = req.query;

  try {
    // Initialize Google Sheets API
    const client = new google.auth.JWT(
      process.env.GOOGLE_CLIENT_EMAIL,
      null,
      process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      ["https://www.googleapis.com/auth/spreadsheets"]
    );

    await client.authorize();
    const gsapi = google.sheets({ version: "v4", auth: client });
    const opt = {
      spreadsheetId: "1DUaqTthSg76kqfaY0nQ1d7sOSXF9iTMK2WfYoJwz_a4",
      range: "Master List!A:C", // Assuming Ticket IDs are in Column C
    };

    const sheetData = await gsapi.spreadsheets.values.get(opt);
    const rows = sheetData.data.values;

    // Find row with matching ticketId
    const match = rows.find(row => row[2] === ticketId); // Assuming Ticket ID is in Column C

    // Set the content type to HTML
    res.setHeader("Content-Type", "text/html");

    if (match) {
      const name = match[0]; // Assuming Name is in Column A
      return res.status(200).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Ticket Verification</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
            .container { max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
            h1 { color: #4CAF50; }
            .invalid { color: #FF0000; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Ticket Verified!</h1>
            <p>Name: <strong>${name}</strong></p>
          </div>
        </body>
        </html>
      `);
    } else {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Ticket Verification</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
            .container { max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
            h1 { color: #FF0000; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Invalid Ticket</h1>
            <p class="invalid">The ticket ID provided is not valid. Please check and try again.</p>
          </div>
        </body>
        </html>
      `);
    }
  } catch (error) {
    console.error("Error verifying ticket:", error);
    res.setHeader("Content-Type", "text/html");
    return res.status(500).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ticket Verification</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
          .container { max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
          h1 { color: #FF0000; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Error</h1>
          <p>There was an error verifying your ticket. Please try again later.</p>
        </div>
      </body>
      </html>
    `);
  }
}
