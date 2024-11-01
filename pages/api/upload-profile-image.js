// pages/api/upload-auditionee-image.js
import { google } from 'googleapis';
import AWS from 'aws-sdk';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

// AWS S3 Configuration
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

// Disable default body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  
    const form = formidable({
      maxFileSize: 5 * 1024 * 1024, // 5 MB
      keepExtensions: true,
      multiples: false,
    });
  
    let auditioneeId = '';
    let file;
  
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Form parsing error:', err);
        return res.status(500).json({ success: false, message: 'Form parsing error' });
      }
  
      auditioneeId = fields.auditioneeId;
      file = files.file;
  
      if (!file || !auditioneeId) {
        return res.status(400).json({ success: false, message: 'Missing file or auditioneeId' });
      }
  
      try {
        const filePath = file.filepath || file.path;
        if (!filePath) {
          throw new Error('File path is undefined');
        }
  
        const fileStream = fs.createReadStream(filePath);
  
        const params = {
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: `auditionees/${auditioneeId}-${Date.now()}${path.extname(file.originalFilename)}`,
          Body: fileStream,
          ContentType: file.mimetype,
          ACL: 'public-read',
        };
  
        const uploadResult = await s3.upload(params).promise();
        const imageUrl = uploadResult.Location;
  
        await updateGoogleSheet(auditioneeId, imageUrl);
  
        // Clean up the temporary file
        fs.unlinkSync(filePath);
  
        res.status(200).json({ success: true, imageUrl });
      } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ success: false, message: 'Error uploading image' });
      }
    });
  }
  

async function updateGoogleSheet(auditioneeId, imageUrl) {
  const client = new google.auth.JWT(
    process.env.GOOGLE_CLIENT_EMAIL,
    null,
    process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/spreadsheets']
  );

  await client.authorize();
  const gsapi = google.sheets({ version: 'v4', auth: client });

  // Fetch the sheet data to find the row index
  const opt = {
    spreadsheetId: '1DUaqTthSg76kqfaY0nQ1d7sOSXF9iTMK2WfYoJwz_a4',
    range: 'Audition List!A:G',
  };

  const sheetData = await gsapi.spreadsheets.values.get(opt);
  const rows = sheetData.data.values;

  // Find the row index where Auditionee Number matches
  const rowIndex = rows.findIndex(row => row[2] === auditioneeId);

  if (rowIndex === -1) {
    throw new Error('Auditionee not found in the sheet');
  }

  // Update Column K (index 10, since columns are zero-indexed)
  const updateRange = `Audition List!G${rowIndex + 1}`;

  await gsapi.spreadsheets.values.update({
    spreadsheetId: '1DUaqTthSg76kqfaY0nQ1d7sOSXF9iTMK2WfYoJwz_a4',
    range: updateRange,
    valueInputOption: 'RAW',
    resource: {
      values: [[imageUrl]],
    },
  });
}
