// backend/server.js
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
require('dotenv').config(); // Carga las variables secretas del archivo .env

const app = express();
app.use(cors()); // Permite que tu frontend se comunique con el backend
app.use(express.json());

// Configuramos la IA con la clave secreta que está protegida en el servidor
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY 
});

// El "Prompt de Sistema" con las reglas de tu negocio
const INSTRUCCIONES_DEL_BOT = `
Eres el asistente virtual de 'Flores de Valera'. Tu objetivo es tomar pedidos de clientes que quieren enviar flores desde Valera hasta Barquisimeto.
REGLA CRÍTICA DE LOGÍSTICA: Las entregas en Barquisimeto se realizan EXCLUSIVAMENTE los días MIÉRCOLES. Debes recordárselo amablemente al cliente.

Debes guiar la conversación para obtener obligatoriamente estos 5 datos:
1. Flores o arreglos que desea del catálogo.
2. Nombre completo.
3. Cédula de identidad.
4. Dirección exacta en Barquisimeto.
5. Método de pago y capture/referencia.

Sé muy amable, habla como un comerciante venezolano atento. Si el cliente te da varios datos juntos, procesalos y pídele educadamente los que falten.
`;

// Esta es la ruta (API) que escucha los mensajes del frontend
app.post('/api/chat', async (req, res) => {
    const mensajeUsuario = req.body.mensaje;

    try {
        // Llamamos a la Inteligencia Artificial
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Un modelo rápido y muy económico
            messages: [
                { role: "system", content: INSTRUCCIONES_DEL_BOT },
                { role: "user", content: mensajeUsuario }
            ],
        });

        const respuestaIA = response.choices[0].message.content;
        
        // Le devolvemos la respuesta de la IA al frontend
        res.json({ respuesta: respuestaIA });

    } catch (error) {
        console.error("Error con la IA:", error);
        res.status(500).json({ respuesta: "Error interno del servidor." });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo de forma segura en http://localhost:${PORT}`);
});