// pages/api/upload-auditionee-image.js
import AWS from 'aws-sdk';
import { google } from 'googleapis';
import formidable from 'formidable';
import fs from 'fs';

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

export const config = {
  api: {
    bodyParser: false,
  },
};

async function uploadImageToS3(file, auditioneeId) {
  const fileStream = fs.createReadStream(file.filepath);
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `auditionees/${auditioneeId}.jpg`, // Unique key based on auditioneeId
    Body: fileStream,
    ContentType: file.mimetype,
    ACL: 'public-read',
  };

  const uploadResult = await s3.upload(params).promise();
  return uploadResult.Location;
}

async function updateGoogleSheet(auditioneeId, imageUrl) {
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
    range: "Audition List!A:K",
  };

  const sheetData = await gsapi.spreadsheets.values.get(opt);
  const rows = sheetData.data.values;
  const rowIndex = rows.findIndex((row) => row[2] === auditioneeId); // Assuming Auditionee ID is in Column C

  if (rowIndex === -1) throw new Error("Auditionee not found in the sheet");

  const range = `Audition List!K${rowIndex + 1}`;
  await gsapi.spreadsheets.values.update({
    spreadsheetId: "1DUaqTthSg76kqfaY0nQ1d7sOSXF9iTMK2WfYoJwz_a4",
    range,
    valueInputOption: "RAW",
    resource: { values: [[imageUrl]] },
  });
}

export default async function handler(req, res) {
  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ success: false, message: 'Form parsing error' });

    const auditioneeId = fields.auditioneeId;
    const file = files.file;

    if (!file || !auditioneeId) {
      return res.status(400).json({ success: false, message: 'Missing file or auditioneeId' });
    }

    try {
      const imageUrl = await uploadImageToS3(file, auditioneeId);
      await updateGoogleSheet(auditioneeId, imageUrl);

      res.status(200).json({ success: true, imageUrl });
    } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({ success: false, message: 'Error uploading image' });
    }
  });
}
