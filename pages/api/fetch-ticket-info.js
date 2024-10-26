import { google } from "googleapis";

export default async function handler(req, res) {
  const { ticketId } = req.query;

  if (!ticketId) {
    return res.status(400).json({ success: false, message: "Ticket ID is required" });
  }

  try {
    // Initialize Google Sheets API
    const client = new google.auth.JWT(
      process.env.GOOGLE_CLIENT_EMAIL,
      null,
      process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      ["https://www.googleapis.com/auth/spreadsheets"]
    );

    await client.authorize();
    const gsapi = google.sheets({ version: "v4", auth: client });
    const opt = {
      spreadsheetId: "1DUaqTthSg76kqfaY0nQ1d7sOSXF9iTMK2WfYoJwz_a4",
      range: "Master List!A:Z", // Include columns with Name, Email, Phone, etc.
    };

    const sheetData = await gsapi.spreadsheets.values.get(opt);
    const rows = sheetData.data.values;
    const match = rows.find(row => row[2] === ticketId); // Assuming Ticket ID is in Column C

    if (!match) {
      return res.status(404).json({ success: false, message: "Ticket ID not found" });
    }

    const name = match[0]; // Assuming Name is in Column A
    const email = match[1]; // Assuming Email is in Column B
    const phoneNumber = match[3] || ""; // Assuming Phone Number is in Column D

    return res.status(200).json({
      success: true,
      name,
      email,
      phoneNumber,
    });
  } catch (error) {
    console.error("Error fetching ticket info:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}
