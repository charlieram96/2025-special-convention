// pages/api/update-auditionee.js
import { google } from "googleapis";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const auditionee = req.body;

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

    // Fetch the sheet data to find the row index
    const opt = {
      spreadsheetId: "1DUaqTthSg76kqfaY0nQ1d7sOSXF9iTMK2WfYoJwz_a4",
      range: "Audition List!A:V", // Adjust the range to include all columns
    };

    const sheetData = await gsapi.spreadsheets.values.get(opt);
    const rows = sheetData.data.values;
    const headers = rows[0];

    // Find the row index where Auditionee Number matches
    const rowIndex = rows.findIndex(
      (row) => row[2] === auditionee.auditioneeNumber
    );

    if (rowIndex === -1) {
      return res.status(404).json({ message: "Auditionee not found" });
    }

    // Prepare the updated row data
    const updatedRow = [
      auditionee.name || "",
      auditionee.email || "",
      auditionee.auditioneeNumber || "",
      auditionee.ticketId || "",
      auditionee.auditionType || "",
      auditionee.congregation || "",
      auditionee.imageLink || "",
      auditionee.pitch || "",
      auditionee.rhythm || "",
      auditionee.rangeOfVoice || "",
      auditionee.harmony || "",
      auditionee.instrument || "",
      auditionee.reading || "",
      auditionee.level || "",
      auditionee.result || "",
      auditionee.observations || "",
      auditionee.auditionLink || "",
      auditionee.judge1Score || "",
      auditionee.judge2Score || "",
      auditionee.judge3Score || "",
      auditionee.danceLevel || "",
      auditionee.harmonyLink || "",
    ];

    // Update the row in the sheet
    const updateOptions = {
      spreadsheetId: "1DUaqTthSg76kqfaY0nQ1d7sOSXF9iTMK2WfYoJwz_a4",
      range: `Audition List!A${rowIndex + 1}:V${rowIndex + 1}`,
      valueInputOption: "RAW",
      resource: {
        values: [updatedRow],
      },
    };

    await gsapi.spreadsheets.values.update(updateOptions);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error updating auditionee:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
