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


function generateTicketId() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let ticketId = '';
  for (let i = 0; i < 8; i++) {
    ticketId += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return ticketId;
}

// Function to upload QR code to S3
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

export default async function handler(req, res) {
  try {
    const client = new google.auth.JWT(
      process.env.GOOGLE_CLIENT_EMAIL,
      null,
      process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'), 
      ["https://www.googleapis.com/auth/spreadsheets"]
    );

    // Authorize and get data from Google Sheets
    await client.authorize();
    const gsapi = google.sheets({ version: "v4", auth: client });
    const opt = {
      spreadsheetId: "1DUaqTthSg76kqfaY0nQ1d7sOSXF9iTMK2WfYoJwz_a4",
      range: "Master List!A:Z",
    };

    // Fetch sheet data
    const sheetData = await gsapi.spreadsheets.values.get(opt);
    const rows = sheetData.data.values;

    if (!rows || rows.length === 0) {
      return res.status(200).json({ message: "No data found in sheet" });
    }

    // Iterate over rows and send an email if email is present
    for (let i = 1; i < rows.length; i++) {
      const [name, email, existingTicketId] = rows[i]; // Assuming Ticket ID is in Column C
      
      if (!existingTicketId && email) {    
        
        const ticketId = generateTicketId();

        // Update Google Sheets with the generated ticket ID only if it's new
        await gsapi.spreadsheets.values.update({
          spreadsheetId: "1DUaqTthSg76kqfaY0nQ1d7sOSXF9iTMK2WfYoJwz_a4",
          range: `Master List!C${i + 1}`, // Assuming Column C is for Ticket IDs
          valueInputOption: "RAW",
          resource: { values: [[ticketId]] },
        });

        // Generate URL that points to the API endpoint with ticketId
        const verificationUrl = `https://2025-special-convention.vercel.app/api/verify-ticket?ticketId=${ticketId}`;

        // Generate QR code for the URL
        const qrCodeDataURL = await QRCode.toDataURL(verificationUrl);
        const qrCodeBuffer = Buffer.from(qrCodeDataURL.split(",")[1], "base64");

        // Upload QR code to S3 and get the public URL
        const qrCodeUrl = await uploadQRCodeToS3(ticketId, qrCodeBuffer);

        try {
          await sendgrid.send({
            to: email,
            from: "charlie@lessthan7.studio",
            subject: "Audition Invitation",
            text: `Hello ${name}, this is your invitation to the audition!`,
            html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
            <html data-editor-version="2" class="sg-campaigns" xmlns="http://www.w3.org/1999/xhtml">
                <head>
                  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1">
                  <meta http-equiv="X-UA-Compatible" content="IE=Edge">
            
                  <style type="text/css">
                body, p, div {
                  font-family: arial,helvetica,sans-serif;
                  font-size: 14px;
                }
                body {
                  color: #000000;
                }
                body a {
                  color: #000000;
                  text-decoration: none;
                }
                p { margin: 0; padding: 0; }
                table.wrapper {
                  width:100% !important;
                  table-layout: fixed;
                  -webkit-font-smoothing: antialiased;
                  -webkit-text-size-adjust: 100%;
                  -moz-text-size-adjust: 100%;
                  -ms-text-size-adjust: 100%;
                }
                img.max-width {
                  max-width: 100% !important;
                }
                .column.of-2 {
                  width: 50%;
                }
                .column.of-3 {
                  width: 33.333%;
                }
                .column.of-4 {
                  width: 25%;
                }
                ul ul ul ul  {
                  list-style-type: disc !important;
                }
                ol ol {
                  list-style-type: lower-roman !important;
                }
                ol ol ol {
                  list-style-type: lower-latin !important;
                }
                ol ol ol ol {
                  list-style-type: decimal !important;
                }
                @media screen and (max-width:480px) {
                  .preheader .rightColumnContent,
                  .footer .rightColumnContent {
                    text-align: left !important;
                  }
                  .preheader .rightColumnContent div,
                  .preheader .rightColumnContent span,
                  .footer .rightColumnContent div,
                  .footer .rightColumnContent span {
                    text-align: left !important;
                  }
                  .preheader .rightColumnContent,
                  .preheader .leftColumnContent {
                    font-size: 80% !important;
                    padding: 5px 0;
                  }
                  table.wrapper-mobile {
                    width: 100% !important;
                    table-layout: fixed;
                  }
                  img.max-width {
                    height: auto !important;
                    max-width: 100% !important;
                  }
                  a.bulletproof-button {
                    display: block !important;
                    width: auto !important;
                    font-size: 80%;
                    padding-left: 0 !important;
                    padding-right: 0 !important;
                  }
                  .columns {
                    width: 100% !important;
                  }
                  .column {
                    display: block !important;
                    width: 100% !important;
                    padding-left: 0 !important;
                    padding-right: 0 !important;
                    margin-left: 0 !important;
                    margin-right: 0 !important;
                  }
                  .social-icon-column {
                    display: inline-block !important;
                  }
                }
              </style>
                </head>
                <body>
                  <center class="wrapper" data-link-color="#000000" data-body-style="font-size:14px; font-family:arial,helvetica,sans-serif; color:#000000; background-color:#e8fcff;">
                    <div class="webkit">
                      <table cellpadding="0" cellspacing="0" border="0" width="100%" class="wrapper" bgcolor="#e8fcff">
                        <tr>
                          <td valign="top" bgcolor="#e8fcff" width="100%">
                            <table width="100%" role="content-container" class="outer" align="center" cellpadding="0" cellspacing="0" border="0">
                              <tr>
                                <td width="100%">
                                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                    <tr>
                                      <td>
            
                                                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:600px;" align="center">
                                                  <tr>
                                                    <td role="modules-container" style="padding:0px 0px 0px 0px; color:#000000; text-align:left;" bgcolor="#ffffff" width="100%" align="left"><table class="module preheader preheader-hide" role="module" data-type="preheader" border="0" cellpadding="0" cellspacing="0" width="100%" style="display: none !important; mso-hide: all; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0;">
                <tr>
                  <td role="module-content">
                    <p></p>
                  </td>
                </tr>
              </table><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="7657ff89-b997-4619-aff2-72eeece02494" data-mc-module-version="2019-10-22">
                
              </table><table border="0" cellpadding="0" cellspacing="0" align="center" width="100%" role="module" data-type="columns" style="padding:20px 0px 20px 0px;" bgcolor="#ffffff" data-distribution="1">
                <tbody>
                  <tr role="module-content">
                    <td height="100%" valign="top"><table width="600" style="width:600px; border-spacing:0; border-collapse:collapse; margin:0px 0px 0px 0px;" cellpadding="0" cellspacing="0" align="left" border="0" bgcolor="" class="column column-0">
                  <tbody>
                    <tr>
                      <td style="padding:0px;margin:0px;border-spacing:0;"><table class="wrapper" role="module" data-type="image" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="9f29c991-6500-41ef-9f0e-d56cb5dc1238">
                <tbody>
                  <tr>
                    
                  </tr>
                </tbody>
              </table></td>
                    </tr>
                  </tbody>
                </table></td>
                  </tr>
                </tbody>
              </table><table class="wrapper" role="module" data-type="image" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="7bf3c8d1-3ee5-43af-91f2-1ef67b1f878c">
                <tbody>
                  <tr>
                    <td style="font-size:6px; line-height:10px; padding:0px 0px 0px 0px;" valign="top" align="center">
                      <img border="0" style="display:block; width: min(90%, 250px); color:#000000; text-decoration:none; font-family:Helvetica, arial, sans-serif; font-size:16px; max-width:50% !important; height:auto !important;" width="250" alt="" data-proportionally-constrained="true" data-responsive="true" src="https://lessthan7.studio/media/fort-lauderdale-2025-logo-final.png">
                    </td>
                  </tr>
                </tbody>
              </table><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="b35b8ff4-8b3c-4b35-9ed3-f9f25170affc" data-mc-module-version="2019-10-22">
                <tbody>
                  <tr>
                    <td style="padding:40px 20px 18px 20px; line-height:28px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: center"><span style="color: #0088ad; font-size: 28px; font-family: &quot;lucida sans unicode&quot;, &quot;lucida grande&quot;, sans-serif"><strong>¡Bienvenido!</strong></span></div>
            <div style="font-family: inherit; text-align: center"><span style="color: #0088ad; font-size: 14px; font-family: &quot;lucida sans unicode&quot;, &quot;lucida grande&quot;, sans-serif">Fort Lauderdale 2025</span></div><div></div></div></td>
                  </tr>
                </tbody>
              </table><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="f758d404-9b02-4e87-937f-cccaa46787a6" data-mc-module-version="2019-10-22">
                <tbody>
                  <tr>
                    <td style="padding:38px 60px 18px 60px; line-height:26px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: left"><span style="color: #273159; font-size: 16px; font-family: &quot;lucida sans unicode&quot;, &quot;lucida grande&quot;, sans-serif">Hola ${name},
                        <br><br>
                        Nos complace informarte que has sido invitado a asistir a nuestra tarde de esparcimiento para la Asamblea Especial de Fort Lauderdale 2025! A continuación tendrás tu código QR único que servirá como tu tiquete de entrada.</span></div><div></div></div></td>
                  </tr>
                </tbody>
              </table><table border="0" cellpadding="0" cellspacing="0" class="module" data-role="module-button" data-type="button" role="module" style="table-layout:fixed;" width="100%" data-muid="3757586a-ce69-48ba-bd9a-0c0b7937a616">
                  <tbody>
                    <tr>
                      <td align="center" bgcolor="" class="outer-td" style="padding:0px 0px 40px 0px;">
                        <table border="0" cellpadding="0" cellspacing="0" class="wrapper-mobile" style="text-align:center;">
                          <tbody>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                  <tbody>
                    <tr>
                    <td style="padding:18px 60px 18px 60px; line-height:26px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: left"><span style="color: #273159; font-size: 16px; font-family: &quot;lucida sans unicode&quot;, &quot;lucida grande&quot;, sans-serif">
                    Date: Martes, Agosto 12, 2025
                    <br>
                    Ubicación: West Palm Beach Christian Convention Center of Jehovah's Witnesses
                    <br>
                    Dirección: 1610 Palm Beach Lakes Blvd, West Palm Beach, FL 33401
                    <br>
                    Hora: 9am - 2pm
                    </td>
                  </tr>
                  <tr>
                    <td style="font-size:6px; line-height:10px; padding:0px 0px 100px 0px;" valign="top" align="center">
                      <img border="0" style="display:block; width: min(90%, 200px); color:#000000; text-decoration:none; font-family:Helvetica, arial, sans-serif; font-size:16px; max-width:50% !important; height:auto !important;" width="200" height="200" alt="" data-proportionally-constrained="true" data-responsive="true" src="${qrCodeUrl}">
                    </td>
                  </tr>
                  
                </tr>
                </tbody>
                </table><table border="0" cellpadding="0" cellspacing="0" align="center" width="100%" role="module" data-type="columns" style="padding:30px 20px 0px 20px;" bgcolor="#ffffff" data-distribution="1">
                <tbody>
                  <tr role="module-content">
                    <td height="100%" valign="top"><table width="560" style="width:560px; border-spacing:0; border-collapse:collapse; margin:0px 0px 0px 0px;" cellpadding="0" cellspacing="0" align="left" border="0" bgcolor="" class="column column-0">
                  <tbody>
                    <tr>
                      <td style="padding:0px;margin:0px;border-spacing:0;"><table class="wrapper" role="module" data-type="image" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="e763c2de-823c-4c4a-addc-a1f84fc2c8a0">
                
              </table></td>
                    </tr>
                  </tbody>
                </table></td>
                  </tr>
                </tbody>
              </table><table border="0" cellpadding="0" cellspacing="0" align="center" width="100%" role="module" data-type="columns" style="padding:0px 20px 20px 20px;" bgcolor="#FFFFFF" data-distribution="1">
                <tbody>
                  <tr role="module-content">
                    <td height="100%" valign="top"><table width="560" style="width:560px; border-spacing:0; border-collapse:collapse; margin:0px 0px 0px 0px;" cellpadding="0" cellspacing="0" align="left" border="0" bgcolor="" class="column column-0">
                  <tbody>
                    <tr>
                      <td style="padding:0px;margin:0px;border-spacing:0;"><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="3cfcd060-6f0a-47e2-9865-855bcde54de7" data-mc-module-version="2019-10-22">
                
              </table></td>
                    </tr>
                  </tbody>
                </table></td>
                  </tr>
                </tbody>
              </table><table border="0" cellpadding="0" cellspacing="0" align="center" width="100%" role="module" data-type="columns" style="padding:0px 20px 0px 20px;" bgcolor="#ffffff" data-distribution="1">
                <tbody>
                  <tr role="module-content">
                    <td height="100%" valign="top"><table width="560" style="width:560px; border-spacing:0; border-collapse:collapse; margin:0px 0px 0px 0px;" cellpadding="0" cellspacing="0" align="left" border="0" bgcolor="" class="column column-0">
                  <tbody>
                    <tr>
                      <td style="padding:0px;margin:0px;border-spacing:0;"><table class="wrapper" role="module" data-type="image" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="e763c2de-823c-4c4a-addc-a1f84fc2c8a0.1">
                
              </table></td>
                    </tr>
                  </tbody>
                </table></td>
                  </tr>
                </tbody>
              </table><table border="0" cellpadding="0" cellspacing="0" align="center" width="100%" role="module" data-type="columns" style="padding:0px 20px 0px 20px;" bgcolor="#FFFFFF" data-distribution="1">
                <tbody>
                  <tr role="module-content">
                    <td height="100%" valign="top"><table width="560" style="width:560px; border-spacing:0; border-collapse:collapse; margin:0px 0px 0px 0px;" cellpadding="0" cellspacing="0" align="left" border="0" bgcolor="" class="column column-0">
                  <tbody>
                    <tr>
                      <td style="padding:0px;margin:0px;border-spacing:0;"><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="3cfcd060-6f0a-47e2-9865-855bcde54de7.1" data-mc-module-version="2019-10-22">
                
              </table></td>
                    </tr>
                  </tbody>
                </table></td>
                  </tr>
                </tbody>
              </table><table border="0" cellpadding="0" cellspacing="0" align="center" width="100%" role="module" data-type="columns" style="padding:0px 20px 0px 20px;" bgcolor="#FFFFFF" data-distribution="1">
                <tbody>
                  <tr role="module-content">
                    <td height="100%" valign="top"><table width="560" style="width:560px; border-spacing:0; border-collapse:collapse; margin:0px 0px 0px 0px;" cellpadding="0" cellspacing="0" align="left" border="0" bgcolor="" class="column column-0">
                  <tbody>
                    <tr>
                      <td style="padding:0px;margin:0px;border-spacing:0;"><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="a49405df-a253-4a28-8d3d-be95449c7d30" data-mc-module-version="2019-10-22">
                
              </table></td>
                    </tr>
                  </tbody>
                </table></td>
                  </tr>
                </tbody>
              </table>
              
              
             <table border="0" cellpadding="0" cellspacing="0" class="module" data-role="module-button" data-type="button" role="module" style="table-layout:fixed;" width="100%" data-muid="ac83dab5-fb19-4d55-9b6e-79fd3596622f">
                  <tbody>
                    <tr>
                      <td align="center" bgcolor="" class="outer-td" style="padding:0px 0px 20px 0px;">
                        <table border="0" cellpadding="0" cellspacing="0" class="wrapper-mobile" style="text-align:center;">
                          <tbody>
            
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table></td>
                                                  </tr>
                                                </table>
                                                <!--[if mso]>
                                              </td>
                                            </tr>
                                          </table>
                                        </center>
                                        <![endif]-->
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </div>
                  </center>
                </body>
              </html>`,
          });

        } catch (error) {
          console.error(`Failed to send email to ${email}: ${error}`);
        }
      }
    }

    return res.status(200).json({ message: "Emails sent successfully" });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: true, message: error.message });
  }
}
