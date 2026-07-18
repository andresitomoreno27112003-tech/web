const btnOpen = document.getElementById('btn-open-chat');
const btnClose = document.getElementById('btn-close-chat');
const chatWidget = document.getElementById('chat-widget');
const btnSend = document.getElementById('btn-send');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');

// Alternar visibilidad del chat
btnOpen.addEventListener('click', () => {
    chatWidget.classList.remove('hidden');
    btnOpen.style.display = 'none';
});

btnClose.addEventListener('click', () => {
    chatWidget.classList.add('hidden');
    btnOpen.style.display = 'block';
});

// Enviar mensaje al servidor
async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    // Mostrar mensaje del usuario en pantalla
    appendMessage(text, 'user');
    chatInput.value = '';

    try {
        // CAMBIO AQUÍ: Reemplaza la URL de abajo por la tuva de Vercel (manteniendo el /api/chat al final)
        const response = await fetch('https://TU_PROYECTO_AQUÍ.vercel.app/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mensaje: text })
        });
        
        const data = await response.json();
        appendMessage(data.respuesta, 'bot');
    } catch (error) {
        console.error('Error:', error);
        appendMessage('Lo siento, tuve un problema de conexión. Intenta de nuevo.', 'bot');
    }
}

function appendMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('msg', sender);
    msgDiv.innerText = text;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

btnSend.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });