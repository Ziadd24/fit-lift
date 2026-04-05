const http = require('http');
const fs = require('fs');
const path = require('path');

function login() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ username: 'admin', password: '123' });
    const options = {
      hostname: 'localhost', port: 3000, path: '/api/admin/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    };
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) resolve(JSON.parse(body).token);
        else reject(new Error('Login failed: ' + body));
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function upload(token) {
  return new Promise((resolve, reject) => {
    const boundary = 'FormBoundary' + Date.now();
    const imagePath = path.join(__dirname, 'public', 'images', 'gym-hero.png');
    const imgData = fs.readFileSync(imagePath);

    const parts = [];
    parts.push(`--${boundary}\r\n`);
    parts.push(`Content-Disposition: form-data; name="caption"\r\n\r\n`);
    parts.push(`Welcome to Fit & Lift Gym!\r\n`);
    parts.push(`--${boundary}\r\n`);
    parts.push(`Content-Disposition: form-data; name="file"; filename="gym-hero.png"\r\n`);
    parts.push(`Content-Type: image/png\r\n\r\n`);

    const prefix = Buffer.from(parts.join(''));
    const suffix = Buffer.from(`\r\n--${boundary}--\r\n`);
    const bodyBuffer = Buffer.concat([prefix, imgData, suffix]);

    const options = {
      hostname: 'localhost', port: 3000, path: '/api/upload',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'multipart/form-data; boundary=' + boundary,
        'Content-Length': bodyBuffer.length
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve(body));
    });
    req.on('error', reject);
    req.write(bodyBuffer);
    req.end();
  });
}

async function main() {
  try {
    const token = await login();
    await upload(token);
    console.log('Successfully uploaded test photo.');
  } catch (err) {
    console.error('ERROR:', err);
  }
}

main();
