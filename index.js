// Importation des bibliothèques nécessaires
const TelegramBot = require('node-telegram-bot-api'); // Pour interagir avec Telegram
const axios = require('axios'); // Pour gérer les requêtes HTTP

// Clés API (remplacez-les par vos clés)
const TELEGRAM_API_KEY = '7658006004:AAHh4WmVvWYkr2BoFGLhaEr-d4e-lNQWoH8'; // Clé API de votre bot Telegram
const GEMINI_API_KEY = 'AIzaSyAEEDyhUrUcpWvBisc_RwqGhuIzmgURQ_c'; // Clé API pour Gemini
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent"; // URL de l'API Gemini

// Initialisation du bot Telegram
const bot = new TelegramBot(TELEGRAM_API_KEY, { polling: true });

/**
 * Fonction : Appeler l'API Gemini pour obtenir une réponse GPT
 * @param {string} prompt - Le texte ou la question de l'utilisateur
 * @returns {Promise<string>} - La réponse générée par Gemini
 */
const getGeminiResponse = async (prompt) => {
    try {
        // Envoyer une requête POST à l'API Gemini
        const response = await axios.post(
            `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
            {
                contents: [
                    {
                        parts: [
                            { text: prompt } // Texte de l'utilisateur
                        ]
                    }
                ]
            },
            {
                headers: {
                    "Content-Type": "application/json" // Indique le format JSON
                }
            }
        );

        // Extraire la réponse de l'API
        if (response.data && response.data.contents && response.data.contents[0] && response.data.contents[0].parts) {
            return response.data.contents[0].parts.map(part => part.text).join(" ");
        } else {
            throw new Error("La réponse de Gemini est vide ou mal formée.");
        }
    } catch (error) {
        console.error("Erreur avec Gemini :", error.response?.data || error.message);
        throw new Error("Impossible d'obtenir une réponse de Gemini. Réessayez plus tard.");
    }
};

/**
 * Commande : /start
 * Message de bienvenue lorsque l'utilisateur démarre le bot
 */
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const welcomeMessage = `
Bonjour, ${msg.chat.first_name} !

Je suis un bot alimenté par GPT via Gemini. Posez-moi une question ou utilisez la commande /menu pour voir les options disponibles.

Amusez-vous bien !
    `;
    bot.sendMessage(chatId, welcomeMessage);
});

/**
 * Commande : /menu
 * Affiche un menu des fonctionnalités disponibles
 */
bot.onText(/\/menu/, (msg) => {
    const chatId = msg.chat.id;
    const menuMessage = `
Voici les options disponibles :
- Posez une question ou tapez un message pour obtenir une réponse.
- Utilisez /start pour recommencer.
- Tapez /menu pour afficher ce menu.
    `;
    bot.sendMessage(chatId, menuMessage);
});

/**
 * Gestion des messages texte
 * Tout message autre que les commandes est traité comme une question pour Gemini
 */
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // Ignorer les commandes
    if (text.startsWith('/')) return;

    // Informer l'utilisateur que la réponse est en cours
    bot.sendMessage(chatId, "Je réfléchis à votre question...");

    try {
        // Obtenir une réponse de Gemini
        const gptResponse = await getGeminiResponse(text);
        bot.sendMessage(chatId, gptResponse);
    } catch (error) {
        // Gérer les erreurs et informer l'utilisateur
        bot.sendMessage(chatId, error.message);
    }
});

/**
 * Gestion des erreurs liées au polling
 */
bot.on('polling_error', (error) => {
    console.error("Erreur de polling Telegram :", error.message);
});

/**
 * Fonctionnalité supplémentaire : Logging
 * Enregistre les détails des messages reçus pour faciliter le débogage
 */
bot.on('message', (msg) => {
    console.log(`
    === Nouveau message reçu ===
    De : ${msg.chat.first_name} ${msg.chat.last_name || ""}
    Message : ${msg.text}
    ID de la conversation : ${msg.chat.id}
    `);
});
