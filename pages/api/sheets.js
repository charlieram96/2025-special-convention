// import { google } from "googleapis";
// import keys from "../../public/service-account-key.json"; 

// export default function handler(req, res) {
//     try {
//         const client = new google.auth.JWT(
//             keys.client_email, null, keys.private_key, ['https://www.googleapis.com/auth/spreadsheets']
//         );

//         client.authorize(async function(err, tokens) {
//             if (err) {
//                 return res.status(400).send(JSON.stringify({error: true}));
//             }

//             const gsapi = google.sheets({version:'v4', auth: client});

//             const opt = {
//                 spreadsheetId: '1DUaqTthSg76kqfaY0nQ1d7sOSXF9iTMK2WfYoJwz_a4',
//                 range: 'Master List!A:Z'
//             };

//             let data = await gsapi.spreadsheets.values.get(opt);
//             return res.status(400).send(JSON.stringify({error: false, data: data.data.values}));
//         });
//     } catch (e) {
//         return res.status(400).send(JSON.stringify({error: true, message: e.message}));
//     }
// }

