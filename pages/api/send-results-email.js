// File: pages/api/send-results-email.js
import { google } from "googleapis";
import sendgrid from "@sendgrid/mail";
import QRCode from "qrcode";
import AWS from "aws-sdk";

sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

// Function to generate ticket ID
function generateTicketId() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 8 }, () => characters.charAt(Math.floor(Math.random() * characters.length))).join('');
}

// Function to upload QR code to S3
async function uploadQRCodeToS3(ticketId, qrCodeBuffer) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `tickets/${ticketId}.png`,
    Body: qrCodeBuffer,
    ContentEncoding: 'base64',
    ContentType: 'image/png',
    ACL: 'public-read',
  };
  const uploadResult = await s3.upload(params).promise();
  return uploadResult.Location;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const client = new google.auth.JWT(
      process.env.GOOGLE_CLIENT_EMAIL,
      null,
      process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      ["https://www.googleapis.com/auth/spreadsheets"]
    );

    await client.authorize();
    const gsapi = google.sheets({ version: "v4", auth: client });

    // Fetch Audition List
    const auditionListOpt = {
      spreadsheetId: "1DUaqTthSg76kqfaY0nQ1d7sOSXF9iTMK2WfYoJwz_a4",
      range: "Audition List!A:G", // Assuming result is in Column G
    };
    const auditionData = await gsapi.spreadsheets.values.get(auditionListOpt);
    const rows = auditionData.data.values;

    if (!rows || rows.length === 0) {
      return res.status(200).json({ message: "No data found in sheet" });
    }

    const selectedListUpdates = [];
    for (const row of rows.slice(1)) {
      const [name, email, , ticketId, , , result] = row;

      if (result === "Accept") {
        const newTicketId = generateTicketId();
        const qrCodeDataURL = await QRCode.toDataURL(`https://2025-special-convention.vercel.app/api/verify-ticket?ticketId=${newTicketId}`);
        const qrCodeBuffer = Buffer.from(qrCodeDataURL.split(",")[1], "base64");
        const qrCodeUrl = await uploadQRCodeToS3(newTicketId, qrCodeBuffer);

        // Send Accepted email
        await sendgrid.send({
          to: email,
          from: "charlie@lessthan7.studio",
          subject: "Congratulations! You have been selected",
          text: `Hello ${name}, congratulations on being selected for the 2025 Fort Lauderdale Special Convention!`,
          html: `
            <p>Hello ${name},</p>
            <p>Congratulations! You have been selected to participate in the 2025 Fort Lauderdale Special Convention.</p>
            <p>Your QR code for entry:</p>
            <img src="${qrCodeUrl}" alt="QR Code" width="200" height="200" />
          `,
        });

        // Prepare update for Selected List sheet
        selectedListUpdates.push([name, email, newTicketId]);
      } else if (result === "Decline") {
        // Send Decline email
        await sendgrid.send({
          to: email,
          from: "charlie@lessthan7.studio",
          subject: "Thank you for your audition",
          text: `Hello ${name}, thank you for auditioning.`,
          html: `
            <p>Hello ${name},</p>
            <p>Unfortunately, you were not selected to participate this time. We appreciate your efforts and hope to see you in the future.</p>
          `,
        });
      } else if (result === "Backup") {
        // Send Backup email
        await sendgrid.send({
          to: email,
          from: "charlie@lessthan7.studio",
          subject: "You have been selected as a backup",
          text: `Hello ${name}, you have been selected as a backup for the 2025 Fort Lauderdale Special Convention.`,
          html: `
            <p>Hello ${name},</p>
            <p>You have been selected as a backup. We will reach out if we need your help.</p>
          `,
        });
      }
    }

    // Add accepted participants to Selected List sheet
    if (selectedListUpdates.length > 0) {
      await gsapi.spreadsheets.values.append({
        spreadsheetId: "1DUaqTthSg76kqfaY0nQ1d7sOSXF9iTMK2WfYoJwz_a4",
        range: "Selected List!A:C",
        valueInputOption: "RAW",
        resource: { values: selectedListUpdates },
      });
    }

    res.status(200).json({ message: "Emails sent successfully!" });
  } catch (error) {
    console.error("Error sending emails:", error);
    res.status(500).json({ message: "Failed to send emails" });
  }
}
