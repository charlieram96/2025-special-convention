// pages/api/add-new-auditionee.js
import { google } from "googleapis";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { name, email, category } = req.body;

  // Validate input
  if (!name || !category) {
    return res.status(400).json({ message: "Name and category are required" });
  }

  if (!["Vocals", "Dance", "Instrument"].includes(category)) {
    return res.status(400).json({ message: "Invalid category" });
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

    // Fetch the sheet data to determine the next ID
    const opt = {
      spreadsheetId: "1DUaqTthSg76kqfaY0nQ1d7sOSXF9iTMK2WfYoJwz_a4",
      range: "Audition List!A:V",
    };

    const sheetData = await gsapi.spreadsheets.values.get(opt);
    const rows = sheetData.data.values;

    // Determine prefix based on category
    let prefix = "";
    if (category === "Vocals") prefix = "V-";
    else if (category === "Dance") prefix = "D-";
    else if (category === "Instrument") prefix = "I-";

    // Find the highest number for this category
    let maxNumber = 0;
    rows.slice(1).forEach((row) => {
      const auditioneeNumber = row[2] || "";
      if (auditioneeNumber.startsWith(prefix)) {
        const numPart = auditioneeNumber.substring(prefix.length);
        const num = parseInt(numPart, 10);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    });

    // Generate new ID
    const newNumber = maxNumber + 1;
    const newAuditioneeNumber = `${prefix}${newNumber}`;

    // Prepare the new row data with empty values for other fields
    const newRow = [
      name,                    // Name
      email || "",             // Email
      newAuditioneeNumber,     // Auditionee Number
      "",                      // Ticket ID
      category,                // Audition Type
      "",                      // Congregation
      "",                      // Image Link
      "",                      // Pitch
      "",                      // Rhythm
      "",                      // Range of Voice
      "",                      // Harmony
      "",                      // Instrument
      "",                      // Reading
      "",                      // Level
      "",                      // Result
      "",                      // Observations
      "",                      // Audition Link
      "",                      // Judge 1 Score
      "",                      // Judge 2 Score
      "",                      // Judge 3 Score
      "",                      // Dance Level
      "",                      // Harmony Link
    ];

    // Append the new row to the sheet
    const appendOptions = {
      spreadsheetId: "1DUaqTthSg76kqfaY0nQ1d7sOSXF9iTMK2WfYoJwz_a4",
      range: "Audition List!A:V",
      valueInputOption: "RAW",
      resource: {
        values: [newRow],
      },
    };

    await gsapi.spreadsheets.values.append(appendOptions);

    res.status(200).json({ 
      success: true, 
      auditioneeNumber: newAuditioneeNumber,
      message: `New auditionee added with ID: ${newAuditioneeNumber}`
    });
  } catch (error) {
    console.error("Error adding new auditionee:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
