const fs = require('fs');
const express = require('express');
const fileUpload = require('express-fileupload');
const request = require('request');
const cors = require('cors');

const app = express();
const newimageurl = 'https://drive.google.com/uc?id=';

//  google api
const readline = require('readline');
const { google } = require('googleapis');

const SCOPES = [
    'https://www.googleapis.com/auth/drive'
];
const TOKEN_PATH = 'token.json';
var oauth

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Google Drive API.
    authorize(JSON.parse(content), () => {
        console.log("Passed Authorization")
    });
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
    const { client_secret, client_id, redirect_uris } = credentials.web;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getAccessToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
        oauth = oAuth2Client;
    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error retrieving access token', err);
            oAuth2Client.setCredentials(token);
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) return console.error(err);
                console.log('Token stored to', TOKEN_PATH);
            });
            callback(oAuth2Client);
        });
    });
}
//google api end

// default options
app.use(fileUpload());
app.use(express.static('public'))
app.use(cors());


app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html', (err) => {});
});

app.get('/photochallenge', (req, res) => {
    res.sendFile(__dirname + '/photochallenge.html', (err) => {});
});

app.post('/upload', function(req, res) {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    let sampleFile = req.files.sampleFile;
    var jsontemplate = {
        "title": req.body.title,
        "author": req.body.author,
        "imageurl": "",
        "id": "",
        "coord": {
            "latitude": req.body.mlat,
            "longtitude": req.body.mlng
        }
    };
    console.log(jsontemplate);
    // Use the mv() method to place the file somewhere on your server
    sampleFile.mv(__dirname + '/images/' + sampleFile.name, function(err) {
        if (err) {
            return res.status(500).send(err);
        }

        //upload to drive
        const drive = google.drive({ version: 'v3', auth: oauth });

        var fileMetadata = {
            'name': sampleFile.name,
            parents: ['1bLFVj3ofrDHGjtPzMcRn3lK29m3Vcqw_']
        };
        var media = {
            mimeType: 'image/jpeg',
            //PATH OF THE FILE FROM YOUR COMPUTER
            body: fs.createReadStream(__dirname + '/images/' + sampleFile.name)
        };
        drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id'
        }, function(err, file) {
            if (err) {
                // Handle error
                console.error(err);
            } else {
                console.log('File Id: ', file.data.id);
                jsontemplate.id = file.data.id;
                jsontemplate.imageurl = newimageurl + file.data.id;
                request('https://drive.google.com/uc?id=1AYch2-Yf0OxRrL0SfCXhKLs9AXp7XZoR', function(error, response, body_) {
                    console.error('error:', error);
                    var oldjson = JSON.parse(body_)
                    console.log('body:', oldjson);
                    oldjson[file.data.id] = jsontemplate;
                    //  updates index file
                    var fileMetadata_ = {
                        'name': 'Index.json'
                    };
                    var media_ = {
                        mimeType: 'application/json',
                        body: JSON.stringify(oldjson)
                    };
                    drive.files.update({
                        fileId: '1AYch2-Yf0OxRrL0SfCXhKLs9AXp7XZoR',
                        resource: fileMetadata_,
                        media: media_
                    }, (err, file) => {
                        if (err) {
                            // Handle error
                            console.error(err);
                        } else {
                            console.log('File Updated with ID: ' + file.id);
                        }
                    });
                });
                res.redirect('/');
            }
        });
    });
});

app.post('/uploadphotochallenge', (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    let sampleFile = req.files.sampleFile;
    var jsontemplate = {
        "imageid": "",
        "cellid": ""
    };
    // Use the mv() method to place the file somewhere on your server
    sampleFile.mv(__dirname + '/photochallenge/' + sampleFile.name, function(err) {
        if (err) {
            return res.status(500).send(err);
        }

        //upload to drive
        const drive = google.drive({ version: 'v3', auth: oauth });

        var fileMetadata = {
            'name': sampleFile.name,
            parents: ['17UlCgKBZ-QO20xHGG-UkjXOn9X8EH50j']
        };
        var media = {
            mimeType: 'image/jpeg',
            //PATH OF THE FILE FROM YOUR COMPUTER
            body: fs.createReadStream(__dirname + '/photochallenge/' + sampleFile.name)
        };
        drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id'
        }, function(err, file) {
            if (err) {
                // Handle error
                console.error(err);
            } else {
                console.log('File Id: ', file.data.id);
                //  Update index file
                jsontemplate.imageid = file.data.id;
                jsontemplate.cellid = req.body.cellid;
                request('https://drive.google.com/uc?id=10QwCdryEn7QOdTzUmyizHIKB3iacP4g7', function(error, response, body_) {
                    console.error('error:', error);
                    console.log(error);
                    var oldjson = JSON.parse(body_)
                    console.log('body:', oldjson);
                    oldjson[file.data.id] = jsontemplate;
                    //  updates index file
                    var fileMetadata_ = {
                        'name': 'photochallengeindex.json'
                    };
                    var media_ = {
                        mimeType: 'application/json',
                        body: JSON.stringify(oldjson)
                    };
                    drive.files.update({
                        fileId: '10QwCdryEn7QOdTzUmyizHIKB3iacP4g7',
                        resource: fileMetadata_,
                        media: media_
                    }, (err, file) => {
                        if (err) {
                            // Handle error
                            console.error(err);
                        } else {
                            console.log('File Updated with ID: ' + file.id);
                        }
                    });
                });
                res.redirect('back');
            }
        });
    });
});

app.listen(process.env.PORT || 3000, () => console.log('server listening on port 3000!'));