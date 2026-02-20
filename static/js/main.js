// ── Navbar smart navigation ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', e => {
            const target = link.getAttribute('href');

            if (target === '#hs-lookup') {
                e.preventDefault();
                document.getElementById('analysis')?.scrollIntoView({ behavior: 'smooth' });
                setTimeout(() => {
                    const input = document.getElementById('hsCode');
                    if (input) {
                        input.focus();
                        input.style.outline = '2px solid #FF8C42';
                        input.style.transition = 'outline 0.3s';
                        setTimeout(() => { input.style.outline = ''; }, 1800);
                    }
                }, 500);
            }

            if (target === '#compliance') {
                e.preventDefault();
                document.getElementById('analysis')?.scrollIntoView({ behavior: 'smooth' });
                setTimeout(() => {
                    const btn = document.getElementById('compliance');
                    if (btn) {
                        btn.style.transform = 'scale(1.04)';
                        btn.style.boxShadow = '0 0 0 4px rgba(255,140,66,0.4)';
                        setTimeout(() => {
                            btn.style.transform = '';
                            btn.style.boxShadow = '';
                        }, 1200);
                    }
                }, 500);
            }

            if (target === '#routes') {
                e.preventDefault();
                const map = document.getElementById('mapContainer');
                if (map && map.style.display !== 'none') {
                    map.scrollIntoView({ behavior: 'smooth' });
                } else {
                    // Map is hidden — scroll to analysis form to prompt user
                    document.getElementById('analysis')?.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });
});

// ── End navbar handler ───────────────────────────────────────────

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
    console.log("Raw API Response:", data);

    try {
        // 1. Standard Nested Langflow Structure
        if (data.outputs && data.outputs[0].outputs && data.outputs[0].outputs[0].results) {
            const result = data.outputs[0].outputs[0].results;
            if (result.message && result.message.text) return result.message.text.replace(/\n/g, '<br>');
            if (result.message && result.message.data && result.message.data.text) return result.message.data.text.replace(/\n/g, '<br>');
        }

        // 2. Fallbacks
        if (data.result) return data.result.replace(/\n/g, '<br>');
        if (data.message) return data.message.replace(/\n/g, '<br>');

        return "I didn't understand that. (Check console for details)";
    } catch (error) {
        console.error("Error parsing response:", error);
        return "Error parsing response.";
    }
}

// --- Main Hero Search Logic ---
// --- Main Hero Search Logic ---
function processInput() {
    // 1. Gather Structured Data
    const hsCode = document.getElementById('hsCode').value;
    const actionType = document.getElementById('actionType').value;
    const quantity = document.getElementById('quantity').value;
    const price = document.getElementById('price').value;
    const originCountry = document.getElementById('originCountry').value;
    const destCountry = document.getElementById('destCountry').value;

    const isImport = actionType.trim().toLowerCase() === 'import';

    if (!hsCode || !actionType || !quantity || !originCountry || !destCountry) {
        alert("Please fill in all fields.");
        return;
    }

    if (!isImport && !price) {
        alert("Please enter a Price Per Unit for exports.");
        return;
    }

    // 2. Construct Natural Language Prompt
    const priceText = isImport ? '' : ` at ${price} USD per unit`;
    const input = `I want to ${actionType} ${quantity} units of product with ${document.querySelector('.code-tab.active')?.textContent?.trim() || 'HS Code'} ${hsCode}${priceText} from ${originCountry} to ${destCountry}. Please calculate the landed cost, tariffs, and compliance requirements.`;

    console.log("Constructed Prompt:", input);

    // 2.1 Trigger Map Animation
    drawRoute(originCountry, destCountry);

    // 3. Show Loading in Main Result Area
    const mainResults = document.getElementById('mainResults');
    const resultCard = document.getElementById('resultCard');
    mainResults.style.display = 'block';
    resultCard.innerHTML = '<div class="loader"></div><p style="text-align:center; margin-top:10px;">Analyzing Global Trade Data...</p>';

    // 4. Call Backend for Main Answer
    fetch('/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: input }),
    })
        .then(response => response.json())
        .then(data => {
            // 5. Display Result in Main Area
            let resultText = parseResponse(data);
            resultCard.innerHTML = `
            <h3 style="margin-bottom: 15px; color: var(--accent-black);">Analysis Result</h3>
            <div style="font-size: 1.1rem; line-height: 1.6;">${resultText}</div>
        `;

            // 6. Trigger AI Advisor "Suggestion" (Simulated per Architecture)
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

// --- Map Visualization Logic ---
// Coordinates calibrated to the actual SVG path bounding boxes (viewBox 0 0 1010 660)
const countryCoords = {
    "China": { x: 790, y: 360, code: 'cn' },
    "USA": { x: 225, y: 275, code: 'us' },
    "India": { x: 710, y: 405, code: 'in' },
    "Vietnam": { x: 770, y: 420, code: 'vn' },
    "Germany": { x: 510, y: 300, code: 'de' },
    "UAE": { x: 627, y: 390, code: 'ae' },
    "UK": { x: 465, y: 285, code: 'gb' },
    "Canada": { x: 220, y: 195, code: 'ca' },
    "Australia": { x: 855, y: 510, code: 'au' },
    "Japan": { x: 858, y: 347, code: 'jp' },
    "South Korea": { x: 836, y: 354, code: 'kr' },
    "France": { x: 490, y: 318, code: 'fr' },
    "Italy": { x: 520, y: 330, code: 'it' },
    "Brazil": { x: 315, y: 475, code: 'br' },
    "Mexico": { x: 205, y: 375, code: 'mx' }
};

function drawRoute(origin, destination) {
    const svg = document.getElementById('routeSvg');
    const mapContainer = document.getElementById('mapContainer');

    // Remove only route-specific elements (pins, path, plane) — preserve #mapLandmasses
    const toRemove = svg.querySelectorAll('.route-pin, .route-line, .route-plane');
    toRemove.forEach(el => el.remove());
    // Also clear any lingering groups that aren't the landmass layer
    Array.from(svg.children).forEach(child => {
        if (child.id !== 'mapLandmasses') child.remove();
    });

    // Normalize inputs for lookup
    const originKey = Object.keys(countryCoords).find(k => k.toLowerCase() === origin.trim().toLowerCase());
    const destKey = Object.keys(countryCoords).find(k => k.toLowerCase() === destination.trim().toLowerCase());

    console.log(`Mapping Route: ${origin} (${originKey}) -> ${destination} (${destKey})`);

    if (!originKey || !destKey) {
        console.warn("Coordinates not found for", origin, destination);
        mapContainer.style.display = 'none';
        return;
    }

    mapContainer.style.display = 'block';

    const start = countryCoords[originKey];
    const end = countryCoords[destKey];

    // Helper to create Pin with Flag (tagged with 'route-pin' class for cleanup)
    function createPin(x, y, countryCode) {
        const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        group.setAttribute("class", "route-pin");

        // Pin Drop (Red Marker) with White Stroke for Visibility
        const pinPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        pinPath.setAttribute("d", "M12 0c-4.4 0-8 3.6-8 8 0 5.4 8 16 8 16s8-10.6 8-16c0-4.4-3.6-8-8-8z");
        pinPath.setAttribute("fill", "#ff4757");
        pinPath.setAttribute("stroke", "#ffffff");
        pinPath.setAttribute("stroke-width", "2");
        pinPath.setAttribute("transform", `translate(${x - 12}, ${y - 24}) scale(1.2)`);
        pinPath.setAttribute("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.4))");

        // White circle inside pin
        const innerCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        innerCircle.setAttribute("cx", x);
        innerCircle.setAttribute("cy", y - 16);
        innerCircle.setAttribute("r", "4");
        innerCircle.setAttribute("fill", "white");

        // Flag Image
        const flag = document.createElementNS("http://www.w3.org/2000/svg", "image");
        flag.setAttribute("href", `https://flagcdn.com/w160/${countryCode}.png`);
        flag.setAttribute("x", x - 15);
        flag.setAttribute("y", y - 48);
        flag.setAttribute("width", "30");
        flag.setAttribute("height", "20");
        flag.setAttribute("class", "waving-flag");
        flag.setAttribute("filter", "drop-shadow(0 2px 3px rgba(0,0,0,0.3))");

        group.appendChild(pinPath);
        group.appendChild(innerCircle);
        group.appendChild(flag);
        return group;
    }

    // Add Start Pin
    svg.appendChild(createPin(start.x, start.y, start.code));

    // Add End Pin
    svg.appendChild(createPin(end.x, end.y, end.code));

    // Calculate Curve
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2 - 50;

    // Create Route Path (tagged for cleanup)
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const d = `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;
    path.setAttribute("d", d);
    path.setAttribute("class", "route-line route-plane");
    svg.appendChild(path);

    // Create Aeroplane Icon Group (tagged for cleanup)
    const iconGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    iconGroup.setAttribute("class", "route-plane");

    // Aeroplane Shape
    const plane = document.createElementNS("http://www.w3.org/2000/svg", "path");
    plane.setAttribute("d", "M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z");
    plane.setAttribute("fill", "#333");
    plane.setAttribute("transform", "translate(-12, -12) rotate(90 12 12)");

    iconGroup.appendChild(plane);

    // Animation along path
    const animateMotion = document.createElementNS("http://www.w3.org/2000/svg", "animateMotion");
    animateMotion.setAttribute("dur", "3s");
    animateMotion.setAttribute("repeatCount", "indefinite");
    animateMotion.setAttribute("path", d);
    animateMotion.setAttribute("rotate", "auto");

    iconGroup.appendChild(animateMotion);
    svg.appendChild(iconGroup);
}

// --- Custom Combobox Logic ---
function showOptions(input) {
    const list = input.nextElementSibling;
    if (list && list.classList.contains('custom-options')) {
        // Reset all options to visible when showing
        const options = list.querySelectorAll('li');
        options.forEach(opt => opt.style.display = 'block');

        list.classList.remove('hidden');
    }
}

function hideOptions(input) {
    // Delay hiding to handle clicks that aren't caught by mousedown (fallback)
    setTimeout(() => {
        const list = input.nextElementSibling;
        if (list && list.classList.contains('custom-options')) {
            list.classList.add('hidden');
        }
    }, 200);
}

function filterOptions(input) {
    const filter = input.value.toLowerCase();
    const list = input.nextElementSibling;
    const options = list.querySelectorAll('li');

    options.forEach(option => {
        const text = option.textContent.toLowerCase();
        if (text.includes(filter)) {
            option.style.display = 'block';
        } else {
            option.style.display = 'none';
        }
    });
}

// Global Event Delegation for Dropdown Selection
document.addEventListener('DOMContentLoaded', () => {
    const dropdowns = document.querySelectorAll('.custom-options');

    dropdowns.forEach(list => {
        list.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'LI') {
                e.preventDefault(); // Prevent input blur

                const input = list.previousElementSibling;
                input.value = e.target.textContent;

                list.classList.add('hidden');

                // If actionType was changed, update the price field state
                if (input.id === 'actionType') {
                    updatePriceField(input.value);
                }
            }
        });
    });
});

// Fallback for inline onclick handlers
function selectOption(inputId, value) {
    const input = document.getElementById(inputId);
    input.value = value;
    const list = input.nextElementSibling;
    if (list) list.classList.add('hidden');
    // Drive price field state when action type is picked
    if (inputId === 'actionType') updatePriceField(value);
}

// Disable/enable price field based on Import vs Export
function updatePriceField(action) {
    const priceInput = document.getElementById('price');
    const priceGroup = document.getElementById('priceGroup');
    if (!priceInput || !priceGroup) return;

    if (action.trim().toLowerCase() === 'import') {
        priceInput.disabled = true;
        priceInput.value = '';
        priceInput.placeholder = 'N/A for Import';
        priceGroup.classList.add('field-disabled');
    } else {
        priceInput.disabled = false;
        priceInput.placeholder = 'Price Per Unit (USD)';
        priceGroup.classList.remove('field-disabled');
    }
}

// Toggle HS Code ↔ HTS Code (segmented tab control)
function switchCodeType(type) {
    const input = document.getElementById('hsCode');
    document.querySelectorAll('.code-tab').forEach(tab => {
        tab.classList.toggle('active', tab.textContent.trim() === type + ' Code');
    });
    input.placeholder = type === 'HS'
        ? 'HS Code (e.g. 8517.12)'
        : 'HTS Code (e.g. 8517.12.00.00)';
    input.focus();
}

// Close dropdowns if clicked outside
document.addEventListener('click', function (e) {
    if (!e.target.closest('.relative-container')) {
        document.querySelectorAll('.custom-options').forEach(el => el.classList.add('hidden'));
    }
});
