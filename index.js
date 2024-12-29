const express = require('express');
const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const app = express();

// Initialize WhatsApp client
const client = new Client({
    puppeteer: { headless: true }
});

// This route will handle the pairing process
app.get('/pairing', (req, res) => {
    const number = req.query.number;
    if (!number) {
        return res.status(400).json({ error: 'Phone number is required' });
    }

    // Connect to WhatsApp
    client.initialize();

    client.on('qr', (qr) => {
        // Generate and display the QR code for scanning
        qrcode.generate(qr, { small: true });
        res.send(`<h2>Scan the QR Code to connect your WhatsApp</h2><pre>${qr}</pre>`);
    });

    client.on('ready', () => {
        console.log('Client is ready!');
        const sessionData = client.base64EncodedSession;
        
        // Save session to creds.json
        fs.writeFileSync('creds.json', JSON.stringify(sessionData, null, 2), 'utf-8');
        
        res.json({ message: 'Connected successfully!', creds: 'creds.json' });
    });

    client.on('authenticated', (session) => {
        // Save the session (credentials) to a file after authentication
        fs.writeFileSync('creds.json', JSON.stringify(session, null, 2), 'utf-8');
    });

    client.on('auth_failure', (msg) => {
        res.status(500).json({ error: 'Authentication failed', message: msg });
    });

    client.on('disconnected', (reason) => {
        console.log('Client disconnected:', reason);
        res.status(500).json({ error: 'Client disconnected', message: reason });
    });
});

// Start the server
const port = 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
