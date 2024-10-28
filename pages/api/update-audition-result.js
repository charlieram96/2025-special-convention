import { google } from "googleapis";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { auditioneeNumber, result } = req.body;

  if (!auditioneeNumber || !result) {
    return res.status(400).json({ message: "Auditionee number and result are required" });
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
      range: "Audition List!A:G", // Adjusted to cover all columns including "Result"
    };

    const sheetData = await gsapi.spreadsheets.values.get(opt);
    const rows = sheetData.data.values;
    const rowIndex = rows.findIndex((row) => row[2] === auditioneeNumber);

    if (rowIndex === -1) {
      return res.status(404).json({ message: "Auditionee not found" });
    }

    // Update the Result column (Column G) for the specific row
    await gsapi.spreadsheets.values.update({
      spreadsheetId: "1DUaqTthSg76kqfaY0nQ1d7sOSXF9iTMK2WfYoJwz_a4",
      range: `Audition List!G${rowIndex + 1}`,
      valueInputOption: "RAW",
      resource: { values: [[result]] },
    });

    res.status(200).json({ message: "Result updated successfully!" });
  } catch (error) {
    console.error("Error updating result:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
