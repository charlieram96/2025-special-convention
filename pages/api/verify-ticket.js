import { google } from "googleapis";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
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

    if (match) {
      const name = match[0]; // Assuming Name is in Column A
      return res.status(200).json({ valid: true, name });
    } else {
      return res.status(404).json({ valid: false, message: "Ticket ID not found" });
    }
  } catch (error) {
    console.error("Error verifying ticket:", error);
    return res.status(500).json({ error: true, message: error.message });
  }
}
