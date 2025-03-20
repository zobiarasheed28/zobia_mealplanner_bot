let chatCounter = 1;
const chatData = {};

document.addEventListener('DOMContentLoaded', () => {
    initializeChat();
    setupEventListeners();
    setupWelcomeButtons();
    setupThemeToggle();
});

function initializeChat() {
    const firstChatId = `chat-${Date.now()}`;
    const firstChat = createChatElement(firstChatId, "New Chat");
    document.querySelector('.chat-list').appendChild(firstChat);
    chatData[firstChatId] = [];
    selectChat(firstChat);
}

function setupEventListeners() {
    document.getElementById('user-input').addEventListener('keypress', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    document.getElementById('send-btn').addEventListener('click', sendMessage);
    document.querySelector('.new-chat-btn').addEventListener('click', startNewChat);
}

function setupWelcomeButtons() {
    document.querySelectorAll('.quick-action').forEach(button => {
        button.addEventListener('click', () => {
            const question = button.dataset.question;
            startNewChatWithQuestion(question);
        });
    });
}

function setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
    });
    
    // Apply saved theme preference
    if (localStorage.getItem('theme') === 'light') {
        document.body.classList.add('light-mode');
    }
}

function startNewChatWithQuestion(question) {
    const chatId = `chat-${Date.now()}`;
    const newChat = createChatElement(chatId, question.substring(0, 30));
    document.querySelector('.chat-list').appendChild(newChat);
    chatData[chatId] = [];
    selectChat(newChat);
    document.getElementById('user-input').value = question;
    setTimeout(() => sendMessage(), 100);
}

function startNewChat() {
    const chatId = `chat-${Date.now()}`;
    const newChat = createChatElement(chatId, "New Chat");
    document.querySelector('.chat-list').appendChild(newChat);
    chatData[chatId] = [];
    selectChat(newChat);
    document.getElementById('welcome-message').style.display = 'flex';
}

function createChatElement(id, text) {
    const element = document.createElement('div');
    element.className = 'chat-list-item';
    element.dataset.chatId = id;
    
    const icon = document.createElement('div');
    icon.innerHTML = '💬';
    
    const title = document.createElement('div');
    title.className = 'chat-title';
    title.textContent = text.length > 30 ? text.substring(0, 27) + '...' : text;
    
    element.appendChild(icon);
    element.appendChild(title);
    element.addEventListener('click', () => selectChat(element));
    
    return element;
}

function selectChat(chatElement) {
    document.querySelectorAll('.chat-list-item').forEach(c => c.classList.remove('active'));
    chatElement.classList.add('active');
    
    const chatId = chatElement.dataset.chatId;
    const messages = chatData[chatId] || [];
    
    const chatBox = document.getElementById('chat-box');
    chatBox.innerHTML = '';
    messages.forEach(msg => appendMessage(msg.sender, msg.text));
    
    document.getElementById('welcome-message').style.display = messages.length ? 'none' : 'flex';
}

function appendMessage(sender, text, isTyping = false) {
    const chatBox = document.getElementById('chat-box');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = sender === 'user' ? '👤' : '🤖';
    
    const content = document.createElement('div');
    content.className = 'message-content';
    content.innerHTML = isTyping 
        ? '<div class="typing-indicator"><div class="typing-dots"><span></span><span></span><span></span></div></div>'
        : text.replace(/\n/g, '<br>');

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    chatBox.appendChild(messageDiv);
    
    chatBox.scrollTop = chatBox.scrollHeight;
    return messageDiv;
}

async function sendMessage() {
    const input = document.getElementById('user-input');
    const userText = input.value.trim();
    if (!userText) return;

    const activeChat = document.querySelector('.chat-list-item.active');
    const chatId = activeChat.dataset.chatId;
    
    if (chatData[chatId].length === 0) {
        const title = userText.length > 30 ? userText.substring(0, 30) + '...' : userText;
        activeChat.querySelector('.chat-title').textContent = title;
    }

    appendMessage('user', userText);
    chatData[chatId].push({ sender: 'user', text: userText });
    input.value = '';

    const typingIndicator = appendMessage('bot', '', true);
    
    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_input: userText,
                chat_id: chatId
            })
        });

        const data = await response.json();
        typingIndicator.remove();
        
        const botMessage = appendMessage('bot', data.response);
        chatData[chatId].push({ sender: 'bot', text: data.response });
        
        if (document.getElementById('welcome-message').style.display !== 'none') {
            document.getElementById('welcome-message').style.display = 'none';
        }
        
    } catch (error) {
        typingIndicator.remove();
        appendMessage('bot', '⚠️ Error connecting to the server');
    }
}
