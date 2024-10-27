import { google } from "googleapis";
import sendgrid from "@sendgrid/mail";
import QRCode from "qrcode";

sendgrid.setApiKey(process.env.SENDGRID_API_KEY);

async function uploadQRCodeToS3(ticketId, qrCodeBuffer) {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME, // Your S3 bucket name
      Key: `tickets/${ticketId}.png`, // File path in the bucket
      Body: qrCodeBuffer,
      ContentEncoding: 'base64', // Required for base64-encoded content
      ContentType: 'image/png',
      ACL: 'public-read', // Make the file publicly readable
    };
  
    const uploadResult = await s3.upload(params).promise();
    return uploadResult.Location; // Return the URL of the uploaded QR code
  }

async function generateQrCode(ticketId) {
  const qrCodeDataURL = await QRCode.toDataURL(`https://2025-special-convention.vercel.app/api/verify-ticket?ticketId=${ticketId}`);
  return Buffer.from(qrCodeDataURL.split(",")[1], "base64");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { ticketId: reqTicketId, name, email, phoneNumber, guestName, guestEmail } = req.body;

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
      range: "Master List!A:H", // Includes all necessary columns
    };

    const sheetData = await gsapi.spreadsheets.values.get(opt);
    const rows = sheetData.data.values;
    const rowIndex = rows.findIndex(row => row[2] === reqTicketId); // Find row based on ticket ID

    if (rowIndex === -1) {
      return res.status(404).json({ message: "Ticket ID not found" });
    }

    const [existingName, existingEmail, ticketId, existingPhone, confirmed, canInviteGuest, guestEmailColumn, hasInvitedGuest] = rows[rowIndex];
    console.log('data', rows[rowIndex]);

    if (confirmed === "yes") {
      return res.status(200).json({ message: "You have already confirmed your attendance. We hope to see you soon!" });
    }

    // Prepare updates array for columns D, E, F, G, H
    const updates = [phoneNumber, "yes", canInviteGuest, "", ""];

    if (canInviteGuest === "yes" && guestName && guestEmail) {
      if (guestEmailColumn) {
        return res.status(400).json({ message: "You have already invited a guest." });
      }

      updates[3] = guestEmail; // Column G for Guest Email
      updates[4] = "yes"; // Column H for Has Invited Guest

      // Send guest invitation email
      const guestTicketId = `GUEST-${reqTicketId}`;
      const guestQrCode = await generateQrCode(guestTicketId);
      const qrCodeUrl = await uploadQRCodeToS3(guestTicketId, guestQrCode);

      console.log('updates', updates);

      await sendgrid.send({
        to: guestEmail,
        from: "charlie@lessthan7.studio",
        subject: "Event Invitation",
        text: `Hello ${guestName}, you have been invited to the event!`,
        html: `<p>Welcome ${guestName},</p>
               <p>You have been invited as a guest. Please present this QR code for entry:</p>
               <img src="${qrCodeUrl}" alt="QR Code" width="200" height="200" />
               <p><a href="https://2025-special-convention.vercel.app/api/confirm-attendance?ticketId=${guestTicketId}">Click here to confirm</a></p>`,
      });
    }

    // Update the Google Sheet with RSVP and guest info
    await gsapi.spreadsheets.values.update({
      spreadsheetId: "1DUaqTthSg76kqfaY0nQ1d7sOSXF9iTMK2WfYoJwz_a4",
      range: `Master List!D${rowIndex + 1}:H${rowIndex + 1}`, // Ensure range aligns with columns D through H
      valueInputOption: "RAW",
      resource: { values: [updates] },
    });

    res.status(200).json({ message: "RSVP confirmed successfully!" });
  } catch (error) {
    console.error("Error confirming RSVP:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
