const { Client } = require('whatsapp-web.js');
const express = require('express');
const qr = require('qrcode');
const app = express();

app.use(express.json());

let qrCode = '';
let isConnected = false;

const client = new Client({
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', async (qrData) => {
    try {
        qrCode = await qr.toDataURL(qrData);
        console.log('Nuevo QR generado');
    } catch (err) {
        console.error('Error al generar QR:', err);
    }
});

client.on('ready', () => {
    isConnected = true;
    console.log('Cliente WhatsApp conectado ✅');
});

app.get('/', (req, res) => {
    if (isConnected) {
        res.send('WhatsApp conectado ✅');
    } else {
        res.send(`
            <html>
                <head>
                    <title>WhatsApp QR</title>
                    <meta http-equiv="refresh" content="5">
                    <style>
                        body { 
                            display: flex; 
                            flex-direction: column;
                            align-items: center; 
                            justify-content: center; 
                            height: 100vh; 
                            margin: 0;
                            font-family: Arial, sans-serif;
                        }
                        #qr-code {
                            margin: 20px;
                            padding: 20px;
                            border: 1px solid #ccc;
                        }
                        img {
                            width: 256px;
                            height: 256px;
                        }
                    </style>
                </head>
                <body>
                    <h1>Escanea el código QR</h1>
                    <div id="qr-code">
                        ${qrCode ? `<img src="${qrCode}" alt="QR Code">` : 'Generando QR...'}
                    </div>
                </body>
            </html>
        `);
    }
});

app.post('/form-submission', async (req, res) => {
    try {
        if (!isConnected) {
            throw new Error('WhatsApp no conectado');
        }

        const { telefono, nombre, legajo, corte } = req.body;
        
        let numeroWhatsApp = telefono.replace(/\D/g, '');
        if (!numeroWhatsApp.startsWith('543482')) {
            if (numeroWhatsApp.startsWith('3482')) {
                numeroWhatsApp = '54' + numeroWhatsApp;
            } else {
                numeroWhatsApp = '543482' + numeroWhatsApp;
            }
        }
        
        numeroWhatsApp = `${numeroWhatsApp}@c.us`;

        const mensaje = `¡Hola ${nombre}! Tu pedido ha sido registrado:\n\n` +
                       `📝 Legajo: ${legajo}\n` +
                       `🥩 Corte: ${corte}\n\n` +
                       `¡Gracias! 😊`;

        await client.sendMessage(numeroWhatsApp, mensaje);
        res.json({ success: true });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: error.toString() });
    }
});

client.initialize();

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Servidor iniciado en puerto ${port}`);
});
