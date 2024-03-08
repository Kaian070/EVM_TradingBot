require('dotenv').config();
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const { TOKEN, SERVER_URL } = process.env;
const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;
const URI = `/webhook/${TOKEN}`;
const WEBHOOK_URL = SERVER_URL + URI;
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd';

const app = express();
app.use(bodyParser.json());

const init = async () => {
    try {
        const res = await axios.get(`${TELEGRAM_API}/setWebhook?url=${WEBHOOK_URL}`);
        console.log('Webhook setup:', res.data);
    } catch (error) {
        console.error('Error setting up webhook:', error.message);
    }
};

const startMenuKeyboard = {
    inline_keyboard: [
        [{ text: 'Client details', callback_data: 'ButtonA' }],
        [{ text: 'ETH price', callback_data: 'ButtonB' }],
        [{ text: 'Back to Start', callback_data: 'BackToStart' }]
    ]
};

app.post(URI, async (req, res) => {
    try {
        console.log('Request Body:', req.body);

        if (req.body.callback_query) {
            const chatId = req.body.callback_query.message.chat.id;
            const buttonLabel = req.body.callback_query.data;
            console.log('Button Label:', buttonLabel);

            // Logic to handle button clicks
            switch (buttonLabel) {
                case 'ButtonA':
                    // Retrieve communication details of the client
                    const clientDetails = req.body.callback_query.from;
                    console.log('Client Details:', clientDetails);

                    await axios.post(`${TELEGRAM_API}/sendMessage`, {
                        chat_id: chatId,
                        text: `Button A clicked! Client details: ${JSON.stringify(clientDetails)}`,
                        reply_markup: startMenuKeyboard
                    });
                    break;
                case 'ButtonB':
                    // Fetch Ethereum price from CoinGecko API
                    const { data } = await axios.get(COINGECKO_API_URL);
                    const ethereumPrice = data.ethereum.usd;

                    // Respond with Ethereum price
                    await axios.post(`${TELEGRAM_API}/sendMessage`, {
                        chat_id: chatId,
                        text: `Current Ethereum Price: $${ethereumPrice}`,
                        reply_markup: startMenuKeyboard
                    });
                    break;
                case 'BackToStart':
                    await axios.post(`${TELEGRAM_API}/sendMessage`, {
                        chat_id: chatId,
                        text: 'Back to start menu!',
                        reply_markup: startMenuKeyboard
                    });
                    break;
                default:
                    console.warn('Unexpected button label:', buttonLabel);
                    break;
            }
        } else {
            // Regular message handling with buttons
            const chatId = req.body.message.chat.id;
            const text = req.body.message.text;

            await axios.post(`${TELEGRAM_API}/sendMessage`, {
                chat_id: chatId,
                text: text,
                reply_markup: startMenuKeyboard
            });
        }

        res.send();
    } catch (error) {
        console.error('Error:', error.message);
        console.error('Stack Trace:', error.stack);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(process.env.PORT || 4000, async () => {
    console.log('🚀 App running on port', process.env.PORT || 4000);
    await init();
});
