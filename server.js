const express = require('express');
const cors = require('cors');
const path = require('path');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Sirve index.html, las imágenes y demás archivos estáticos de esta misma carpeta
app.use(express.static(path.join(__dirname)));

// Configuramos para usar OpenRouter (¡Gratis y libre!)
const apiKeyUsada = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: apiKeyUsada
});

const INSTRUCCIONES_DEL_BOT = `
Eres el asistente virtual de 'Compra y Venta de Flores Calzones', un comercio venezolano de flores frescas cultivadas en Bailadores y La Mesa de Esnujaque. Tu objetivo es guiar al cliente de manera atenta y servicial para registrar su pedido de flores, despachado desde Valera, y coordinar el despacho a Barquisimeto, Estado Lara.

REGLAS CRÍTICAS DE NEGOCIO Y LOGÍSTICA:
1. DESPACHO: Flores cultivadas en Bailadores y La Mesa de Esnujaque, despachadas desde Valera. Las entregas en Barquisimeto se realizan EXCLUSIVAMENTE los días MIÉRCOLES Y JUEVES. Recuérdaselo al cliente amablemente.
2. DATOS REQUERIDOS: Debes entablar una conversación natural y guiar al usuario para obtener obligatoriamente estos 6 datos:
   - Productos solicitados y cantidades.
   - Nombre completo del destinatario/comprador.
   - Número de teléfono de contacto del comprador.
   - Cédula de identidad del comprador.
   - Dirección exacta de entrega en Barquisimeto.
   - Datos del pago (Método de pago usado y número de referencia).
3. PERSONALIDAD: Sé extremadamente educado, servicial, cálido y habla con el tono típico de un comerciante venezolano atento (usa frases como "¡Buenas!", "con gusto", "a su orden", etc.).

CATÁLOGO OFICIAL Y PRECIOS (No inventes otros productos ni alteres los precios):
Follajes y Rellenos:
- Soliaster: $3 por paquete
- Aster: $3 por paquete
- Rusco: $3 por paquete
- Helecho cuero: $3 por paquete
- Yitson (Gipso): $8 por paquete
- Pino: $1 por paquete (O un Bulto completo por $10)
- Hiedra / Yedra: $3 por paquete
- Nido de amor: $5 por paquete
- Helecho: $1 por paquete
- Pino limón: $2 por paquete
- Pinopios: $6 por paquete 

Flores:
- Rosa: $12 por paquete
- Margarita: $6 por paquete
- Astromelia: $3 por paquete
- Rosa bebé: $8 por paquete
- Girasol: $6 por flor/paquete
- Gerbera: $10 por paquete
- Clavel: $8 por paquete
- Aves de paraíso: $4 por flor/unidad
- Calas: $4 por unidad
- Estatis: $3 por paquete
- Nardo: $7 por paquete
- Agapantos: $3 por paquete


CÁLCULOS Y COTIZACIONES:
- Cuando el cliente te pida un listado de flores, calcula la suma exacta y dale el total en dólares de forma transparente.
- Muestra el desglose de lo solicitado y el total antes de pedir los datos de pago.
- Ejemplo de cálculo: "6 paquetes de rosas ($72), 3 de girasoles ($18) y 20 de aster ($60) da un gran total de $150". Haz las multiplicaciones y sumas con cuidado matemáticamente.

Al finalizar, cuando tengas todos los datos, muéstrale un resumen amigable confirmando que su entrega será el próximo miércoles o jueves de despacho.
En esa respuesta final, incluye también un bloque para el sistema con este formato exacto:
[[RESUMEN_WHATSAPP]]
Productos: ...
Total: ...
Nombre: ...
Teléfono: ...
Cédula: ...
Dirección: ...
Pago: ...
Entrega: Próximo miércoles o jueves de despacho a Barquisimeto
[[FIN_RESUMEN_WHATSAPP]]
Ese bloque debe contener solamente los datos del pedido, sin saludos, sin explicación, sin conversación y sin frases comerciales.
Después de ese bloque, agrega exactamente este marcador al final y en una línea aparte: [[PEDIDO_COMPLETO]]
No uses ese marcador si falta algún dato obligatorio.
`;

app.post('/api/chat', async (req, res) => {
    const mensajeUsuario = req.body.mensaje || req.body.texto;
    // El frontend ahora manda también "historial": el conversationHistory completo
    const historialPrevio = Array.isArray(req.body.historial) ? req.body.historial : [];

    // Reconstruimos la conversación completa para que la IA tenga contexto real
    // (el último mensaje del usuario ya viene incluido en historialPrevio,
    // así que no lo duplicamos)
    const mensajes = [
        { role: "system", content: INSTRUCCIONES_DEL_BOT },
        ...historialPrevio
    ];

    // Por si el frontend no llegó a mandar el historial (compatibilidad hacia atrás)
    if (historialPrevio.length === 0 && mensajeUsuario) {
        mensajes.push({ role: "user", content: mensajeUsuario });
    }

    const MODELOS = [
        "meta-llama/llama-3.3-70b-instruct:free",
        "google/gemma-4-31b-it:free",
        "tencent/hy3:free",
        "openai/gpt-oss-20b:free"
    ];

    let lastError = null;

    for (const model of MODELOS) {
        try {
            console.log(`Intentando conectar con modelo: ${model}...`);
            const response = await openai.chat.completions.create({
                model: model,
                messages: mensajes,
            });

            if (response && response.choices && response.choices[0] && response.choices[0].message) {
                console.log(`¡Éxito con el modelo ${model}!`);
                return res.json({ respuesta: response.choices[0].message.content });
            }
        } catch (error) {
            console.error(`Fallo con el modelo ${model}:`, error.message || error);
            lastError = error;
        }
    }

    console.error("Todos los modelos de la IA fallaron:", lastError);
    res.status(500).json({ respuesta: "Disculpa, tuve un problema interno de conexión. ¿Podrías repetir eso?" });
});
// Cualquier otra ruta que no sea /api/chat ni un archivo estático conocido, muestra index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Busca esto al final de tu server.js y déjalo exactamente así:
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor corriendo con éxito en el puerto ${PORT}`);
});