import { google } from "googleapis";

export default async function handler(req, res) {
  try {
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
      range: "Audition List!A:G", // Adjust as necessary
    };

    const sheetData = await gsapi.spreadsheets.values.get(opt);
    const rows = sheetData.data.values;

    // Convert sheet rows to JSON format
    const auditionList = rows.slice(1).map((row) => ({
      name: row[0],
      email: row[1],
      auditioneeNumber: row[2],
      ticketId: row[3],
      auditionType: row[4],
      score: row[5],
      result: row[6],
    }));

    res.status(200).json({ auditionList });
  } catch (error) {
    console.error("Error fetching audition list:", error);
    res.status(500).json({ error: "Failed to fetch audition list" });
  }
}