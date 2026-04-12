const http = require('http');

// Step 1: Login
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
        console.log('Login status:', res.statusCode);
        if (res.statusCode === 200) {
          resolve(JSON.parse(body).token);
        } else {
          reject(new Error('Login failed: ' + body));
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Step 2: Upload test image
function upload(token) {
  return new Promise((resolve, reject) => {
    const boundary = 'FormBoundary' + Date.now();
    // 1x1 red PNG
    const pngData = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    const parts = [];
    parts.push(`--${boundary}\r\n`);
    parts.push(`Content-Disposition: form-data; name="caption"\r\n\r\n`);
    parts.push(`API Test Upload\r\n`);
    parts.push(`--${boundary}\r\n`);
    parts.push(`Content-Disposition: form-data; name="file"; filename="test.png"\r\n`);
    parts.push(`Content-Type: image/png\r\n\r\n`);

    const prefix = Buffer.from(parts.join(''));
    const suffix = Buffer.from(`\r\n--${boundary}--\r\n`);
    const bodyBuffer = Buffer.concat([prefix, pngData, suffix]);

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
      res.on('end', () => {
        console.log('Upload status:', res.statusCode);
        console.log('Upload response:', body);
        resolve(body);
      });
    });
    req.on('error', reject);
    req.write(bodyBuffer);
    req.end();
  });
}

async function main() {
  try {
    console.log('=== Testing Upload API ===');
    const token = await login();
    console.log('Got token:', token.substring(0, 30) + '...');
    await upload(token);
    console.log('=== Done ===');
  } catch (err) {
    console.error('ERROR:', err);
  }
}

main();
