// Importation des bibliothèques nécessaires
const TelegramBot = require('node-telegram-bot-api'); // Pour interagir avec l'API Telegram
const axios = require('axios'); // Pour envoyer des requêtes HTTP

/**
 * Configuration des clés API
 * Assurez-vous de remplacer par vos propres clés valides.
 */
const TELEGRAM_API_KEY = '7658006004:AAHh4WmVvWYkr2BoFGLhaEr-d4e-lNQWoH8'; // Clé API de votre bot Telegram
const GEMINI_API_KEY = 'AIzaSyAEEDyhUrUcpWvBisc_RwqGhuIzmgURQ_c'; // Clé API de Gemini
const GEMINI_API_URL = 'https://gemini.google.com/'; // URL de l'API Gemini

/**
 * Initialisation du bot Telegram
 * Le mode 'polling' est utilisé pour récupérer les messages en continu.
 */
const bot = new TelegramBot(TELEGRAM_API_KEY, { polling: true });

/**
 * Fonction : Appeler l'API Gemini pour obtenir une réponse GPT
 * @param {string} prompt - Le texte ou la question de l'utilisateur
 * @returns {Promise<string>} - La réponse générée par GPT
 */
const getGeminiResponse = async (prompt) => {
    try {
        // Préparer la requête HTTP pour l'API Gemini
        const response = await axios.post(
            GEMINI_API_URL,
            {
                prompt: prompt, // Texte de l'utilisateur
                model: "text-gen", // Modèle à utiliser (ajustez si nécessaire)
                max_tokens: 150, // Nombre maximum de mots générés
                temperature: 0.7, // Ajuste la créativité de la réponse
            },
            {
                headers: {
                    'Content-Type': 'application/json', // Type de contenu attendu
                    'Authorization': `Bearer ${GEMINI_API_KEY}`, // Authentification
                },
            }
        );

        // Extraire et renvoyer la réponse générée par Gemini
        return response.data.choices[0].text.trim();
    } catch (error) {
        console.error("Erreur lors de la requête à Gemini :", error.message);

        // Si une erreur survient, renvoyer un message approprié
        throw new Error("Désolé, une erreur est survenue avec Gemini. Veuillez réessayer plus tard.");
    }
};

/**
 * Commande : /start
 * Accueille l'utilisateur et fournit des instructions de base.
 */
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;

    const welcomeMessage = `
Bonjour, ${msg.chat.first_name} !

Je suis un bot propulsé par GPT via Gemini. Je peux répondre à vos questions et fournir des informations.

Voici ce que vous pouvez faire :
1. Posez-moi une question directement.
2. Tapez /menu pour voir les options disponibles.

Amusez-vous bien !
    `;

    bot.sendMessage(chatId, welcomeMessage);
});

/**
 * Commande : /menu
 * Fournit une liste des fonctionnalités disponibles pour l'utilisateur.
 */
bot.onText(/\/menu/, (msg) => {
    const chatId = msg.chat.id;

    const menuMessage = `
Voici les options disponibles :
- Posez une question ou tapez un message pour obtenir une réponse générée par GPT.
- Utilisez /start pour recommencer.
- Tapez /menu pour afficher ce menu.
    `;

    bot.sendMessage(chatId, menuMessage);
});

/**
 * Gestion des messages texte
 * Tout message autre que les commandes sera traité comme une question pour Gemini.
 */
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // Ignorer les commandes (commençant par "/")
    if (text.startsWith('/')) return;

    // Envoyer une réponse d'attente à l'utilisateur
    bot.sendMessage(chatId, "Je réfléchis à votre question...");

    // Appeler l'API Gemini pour générer une réponse
    try {
        const gptResponse = await getGeminiResponse(text);
        bot.sendMessage(chatId, gptResponse);
    } catch (error) {
        // Envoyer un message d'erreur à l'utilisateur en cas de problème
        bot.sendMessage(chatId, error.message);
    }
});

/**
 * Gestion des erreurs liées au polling
 * Permet de capturer et d'afficher toute erreur survenant pendant le fonctionnement du bot.
 */
bot.on('polling_error', (error) => {
    console.error("Erreur de polling avec Telegram :", error.message);
});

/**
 * Fonction supplémentaire : Logging
 * Enregistre les détails des messages reçus dans la console pour faciliter le débogage.
 */
const logMessage = (msg) => {
    console.log(`
    === Nouveau message reçu ===
    De : ${msg.chat.first_name} ${msg.chat.last_name || ""}
    Message : ${msg.text}
    ID de la conversation : ${msg.chat.id}
    `);
};

// Ajouter un hook pour capturer tous les messages et les enregistrer
bot.on('message', logMessage);

/**
 * Fonctionnalité supplémentaire : Redémarrage du bot
 * Ajoutez une commande /restart pour redémarrer dynamiquement le bot.
 */
bot.onText(/\/restart/, (msg) => {
    const chatId = msg.chat.id;

    bot.sendMessage(chatId, "Redémarrage du bot...").then(() => {
        process.exit(0); // Redémarre l'application (nécessite un gestionnaire comme PM2)
    });
});
