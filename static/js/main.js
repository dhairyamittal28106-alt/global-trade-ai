let isChatOpen = false;

function toggleChat() {
    const chatWindow = document.getElementById('chatWindow');
    isChatOpen = !isChatOpen;
    chatWindow.style.display = isChatOpen ? 'flex' : 'none';
    if (isChatOpen) {
        document.getElementById('chatInput').focus();
    }
}

function handleChatEnter(event) {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
}

function sendChatMessage() {
    const inputField = document.getElementById('chatInput');
    const message = inputField.value.trim();
    if (!message) return;

    // Append User Message
    appendMessage(message, 'user-message');
    inputField.value = '';

    // Show Loading in Chat
    const loadingId = 'chat-loading-' + Date.now();
    appendLoader(loadingId);

    // Call Backend
    fetch('/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: message }),
    })
        .then(response => response.json())
        .then(data => {
            removeLoader(loadingId);
            let resultText = parseResponse(data);
            appendMessage(resultText, 'bot-message');
        })
        .catch((error) => {
            console.error('Error:', error);
            removeLoader(loadingId);
            appendMessage("Sorry, I'm having trouble connecting right now.", 'bot-message');
        });
}

function appendMessage(text, className) {
    const chatMessages = document.getElementById('chatMessages');
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${className}`;
    msgDiv.innerHTML = text;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function appendLoader(id) {
    const chatMessages = document.getElementById('chatMessages');
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message bot-message';
    loadingDiv.id = id;
    loadingDiv.innerHTML = '<i class="fas fa-ellipsis-h fa-fade"></i>';
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeLoader(id) {
    const loader = document.getElementById(id);
    if (loader) loader.remove();
}

function parseResponse(data) {
    if (data.outputs && data.outputs[0].outputs && data.outputs[0].outputs[0].results.message.text) {
        return data.outputs[0].outputs[0].results.message.text.replace(/\n/g, '<br>');
    } else if (data.result) {
        return data.result.replace(/\n/g, '<br>');
    }
    return "I didn't understand that.";
}

// --- Main Hero Search Logic ---
function processInput() {
    const input = document.getElementById('userInput').value;
    if (!input) return;

    // 1. Show Loading in Main Result Area
    const mainResults = document.getElementById('mainResults');
    const resultCard = document.getElementById('resultCard');
    mainResults.style.display = 'block';
    resultCard.innerHTML = '<div class="loader"></div><p style="text-align:center; margin-top:10px;">Analyzing Global Trade Data...</p>';

    // 2. Call Backend for Main Answer
    fetch('/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: input }),
    })
        .then(response => response.json())
        .then(data => {
            // 3. Display Result in Main Area
            let resultText = parseResponse(data);
            resultCard.innerHTML = `
            <h3 style="margin-bottom: 15px; color: var(--accent-black);">Analysis Result</h3>
            <div style="font-size: 1.1rem; line-height: 1.6;">${resultText}</div>
        `;

            // 4. Trigger AI Advisor "Suggestion" (Simulated per Architecture)
            setTimeout(() => {
                triggerAdvisorSuggestion(input);
            }, 1500);
        })
        .catch((error) => {
            console.error('Error:', error);
            resultCard.innerHTML = '<p style="color:red; text-align:center;">Error processing request. Please try again.</p>';
        });
}

function triggerAdvisorSuggestion(query) {
    // Open Chat if closed
    if (!isChatOpen) toggleChat();

    // 5. Generate a context-aware suggestion (Simulated Logic based on PDF)
    // Ideally, this would call a second flow "AI Advisor". 
    // For now, we simulate the "Optimization Engine" response.
    let suggestion = "";

    if (query.toLowerCase().includes("cost")) {
        suggestion = "💡 **Optimization Tip:** I checked alternative routes. sourcing from **Vietnam** could reduce tariffs by **15%** due to the new trade agreement. Would you like to see the comparison?";
    } else if (query.toLowerCase().includes("hs code")) {
        suggestion = "🔍 **Compliance Check:** Verify if this HS Code requires a **COO (Certificate of Origin)** to avoid delays at customs. I can generate a template if needed.";
    } else {
        suggestion = "✨ **Insight:** I can also calculate the **Carbon Border Adjustment Mechanism (CBAM)** liability for this shipment. Just ask!";
    }

    appendMessage(suggestion, 'bot-message');
}
