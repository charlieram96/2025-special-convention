import { google } from "googleapis";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { ticketId } = req.query;

  if (!ticketId) {
    return res.status(400).json({ message: "Ticket ID is required" });
  }

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
      range: "Master List!A:D", // Assuming Ticket IDs are in Column C and Confirmation in Column D
    };

    const sheetData = await gsapi.spreadsheets.values.get(opt);
    const rows = sheetData.data.values;

    // Find the row with the matching ticketId
    const rowIndex = rows.findIndex(row => row[2] === ticketId); // Assuming Ticket ID is in Column C
    if (rowIndex === -1) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Confirmation</title>
        </head>
        <body>
          <h1>Ticket Not Found</h1>
          <p>We couldn't find your ticket. Please check your link and try again.</p>
        </body>
        </html>
      `);
    }

    // Update the "Confirmed" column (Column D) to "yes"
    await gsapi.spreadsheets.values.update({
      spreadsheetId: "1DUaqTthSg76kqfaY0nQ1d7sOSXF9iTMK2WfYoJwz_a4",
      range: `Master List!D${rowIndex + 1}`, // Column D for Confirmed
      valueInputOption: "RAW",
      resource: { values: [["yes"]] },
    });

    // Respond with an HTML confirmation message
    res.setHeader("Content-Type", "text/html");
    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
          .container { max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
          h1 { color: #4CAF50; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Thank you for Confirming!</h1>
          <p>Your attendance has been successfully confirmed. We look forward to seeing you at the event!</p>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error("Error confirming attendance:", error);
    res.setHeader("Content-Type", "text/html");
    return res.status(500).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Confirmation Error</title>
      </head>
      <body>
        <h1>Something Went Wrong</h1>
        <p>There was an error confirming your attendance. Please try again later.</p>
      </body>
      </html>
    `);
  }
}
