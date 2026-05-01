const menuItems = [
    { id: 1, name: "Beef Burger", price: 55000, img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500" },
    { id: 2, name: "Spicy Chicken", price: 48000, img: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=500" },
    { id: 5, name: "Chicken & Rice Bowl", price: 42000, img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500" },
    { id: 6, name: "Sundae", price: 18000, img: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500", hasOptions: true },
    { id: 3, name: "Fries (L)", price: 25000, img: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500" },
    { id: 4, name: "Cola", price: 15000, img: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500" }
];

let cart = [];
let ordersHistory = []; 
let pageHistory = [];
let pendingItem = null;
let discount = 0;
let isPromoApplied = false;
let currentOrderLocation = ""; 
let currentOrderMode = ""; 
let selectedPaymentMethod = ""; 

function showPage(pageId) {
    if (pageId === 'order-status-page') renderOrders();

    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
        p.style.display = 'none';
    });
    
    const target = document.getElementById(pageId);
    if (target) {
        target.classList.add('active');
        const isCentered = ['login-page', 'signup-page', 'order-status-page'].includes(pageId);
        target.style.display = isCentered ? 'flex' : 'block';
    }

    const header = document.getElementById('main-header');
    const bottomNav = document.getElementById('bottom-nav');
    const authPages = ['login-page', 'signup-page'];
    
    if (header) header.style.display = authPages.includes(pageId) ? 'none' : 'flex';
    if (bottomNav) bottomNav.style.display = authPages.includes(pageId) ? 'none' : 'flex';

    updateNavHighlight(pageId);
    const backBtn = document.getElementById('back-btn');
    if (backBtn) backBtn.style.visibility = ['home-page', 'menu-page', 'login-page', 'signup-page', 'order-status-page'].includes(pageId) ? 'hidden' : 'visible';

    if (pageHistory[pageHistory.length - 1] !== pageId) pageHistory.push(pageId);
    updateUI();
}

function updateNavHighlight(pageId) {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    if (pageId === 'home-page') document.getElementById('nav-home')?.classList.add('active');
    if (pageId === 'menu-page') document.getElementById('nav-menu')?.classList.add('active');
    if (pageId === 'order-status-page') document.getElementById('nav-status')?.classList.add('active');
}

function goBack() {
    if (pageHistory.length > 1) {
        pageHistory.pop(); 
        const prevPage = pageHistory.pop(); 
        showPage(prevPage);
    }
}

function renderMenu() {
    const grid = document.getElementById('menu-grid');
    if (!grid) return;
    grid.innerHTML = menuItems.map(item => `
        <div class="menu-card">
            <img src="${item.img}">
            <div class="card-body">
                <h3>${item.name}</h3>
                <p>Rp ${item.price.toLocaleString('id-ID')}</p>
                <button class="add-btn" onclick="handleOrder(${item.id}, event)">Add to Cart</button>
            </div>
        </div>
    `).join('');
}

function handleOrder(id, event) {
    const item = menuItems.find(i => i.id === id);
    if (item.hasOptions) {
        pendingItem = { ...item };
        document.getElementById('flavor-modal').style.display = 'flex';
    } else {
        addToCart(item, event.target);
    }
}

function selectFlavor(flavor) {
    pendingItem.name = `${pendingItem.name} (${flavor})`;
    addToCart(pendingItem);
    closeModal();
}

function closeModal() {
    document.getElementById('flavor-modal').style.display = 'none';
    pendingItem = null;
}

function addToCart(item, buttonElement = null) {
    cart.push(item);
    if (buttonElement) {
        const originalText = buttonElement.innerText;
        buttonElement.innerText = "Added! ✓";
        setTimeout(() => buttonElement.innerText = originalText, 700);
    }
    updateUI();
}

function setMode(mode) {
    currentOrderMode = mode; 
    if (mode === 'pickup') {
        confirmDetails("Quantom HQ: Jl. Jend. Sudirman No. 12, Jakarta"); 
    } else {
        showPage('delivery-page');
    }
}

function confirmDetails(detail = "") {
    currentOrderLocation = detail ? detail : document.getElementById('address-input').value;
    
    if (!detail && currentOrderLocation.length < 5) return alert("Please enter a valid address");

    const infoText = document.getElementById('order-info-text');
    if (infoText) {
        infoText.innerText = currentOrderMode === 'pickup' ? `Pick-up at: ${currentOrderLocation}` : `Delivery to: ${currentOrderLocation}`;
    }
    
    const cashBtn = document.getElementById('cash-choice-btn');
    if (cashBtn) {
        cashBtn.innerHTML = currentOrderMode === 'pickup' ? "💵 Pay at Register" : "💵 Cash on Delivery";
    }

    document.getElementById('payment-branch-area').innerHTML = `<p style="color: #999; text-align: center; font-size: 0.8rem; font-style: italic;">Please select a payment method above.</p>`;
    
    discount = 0;
    isPromoApplied = false; 
    const promoInputField = document.getElementById('promo-input');
    if (promoInputField) promoInputField.value = ""; 
    
    const discountDisplay = document.getElementById('discount-text');
    if (discountDisplay) discountDisplay.style.display = 'none';

    refreshFinalTotal();
    showPage('payment-page');
}

function applyPromo() {
    if (isPromoApplied) return alert("A promo code has already been applied.");
    const promoInput = document.getElementById('promo-input');
    const code = promoInput.value.toUpperCase();
    const total = cart.reduce((sum, item) => sum + item.price, 0);

    if (code === 'Q20') {
        discount = total * 0.2;
        isPromoApplied = true; 
        const p = document.getElementById('discount-text');
        p.innerText = `Promo Applied: -Rp ${discount.toLocaleString('id-ID')}`;
        p.style.display = 'block';
        alert("Promo code applied!");
    } else {
        alert("Invalid Code");
    }
    refreshFinalTotal();
}

function refreshFinalTotal() {
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    const final = total - discount;
    document.getElementById('final-total').innerText = `Total: Rp ${final.toLocaleString('id-ID')}`;
}

function selectPaymentBranch(method) {
    selectedPaymentMethod = method;
    const branchArea = document.getElementById('payment-branch-area');
    const finalPrice = (cart.reduce((sum, item) => sum + item.price, 0) - discount).toLocaleString('id-ID');

    if (method === 'qr') {
        branchArea.innerHTML = `
            <div style="background: white; padding: 15px; border-radius: 12px; text-align: center; border: 1px solid #ddd;">
                <p style="font-weight: bold; font-size: 0.9rem;">Scan QRIS to Pay</p>
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=QuantomOrder" style="width: 140px; margin: 10px 0;">
                <p style="font-size: 0.75rem; color: #666;">Supports GoPay, OVO, Dana, ShopeePay</p>
                <button class="confirm-btn" style="margin-top: 10px;" onclick="processPayment('QRIS')">I Have Paid</button>
            </div>
        `;
    } else {
        const isPickup = currentOrderMode === 'pickup';
        const title = isPickup ? "Pay at Register" : "Cash on Delivery";
        const instruction = isPickup 
            ? "Pay at the counter when you arrive at the store." 
            : "Pay our courier in cash when your food arrives.";

        branchArea.innerHTML = `
            <div style="background: white; padding: 15px; border-radius: 12px; text-align: center; border: 1px solid #ddd;">
                <p style="font-weight: bold; font-size: 0.9rem;">${title}</p>
                <p style="font-size: 0.8rem; color: #555; margin: 10px 0;">
                    ${instruction}<br>
                    Total Due: <strong>Rp ${finalPrice}</strong>.
                </p>
                <button class="confirm-btn" onclick="processPayment('${title}')">Confirm Order</button>
            </div>
        `;
    }
}

function processPayment(methodUsed) {
    if (cart.length === 0) return;

    const total = cart.reduce((sum, item) => sum + item.price, 0);
    const newOrder = {
        id: Math.floor(1000 + Math.random() * 9000),
        items: [...cart],
        amount: total - discount,
        location: currentOrderLocation, 
        paymentMethod: methodUsed,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'Cooking'
    };

    ordersHistory.unshift(newOrder); 
    
    cart = [];
    discount = 0;
    isPromoApplied = false;
    selectedPaymentMethod = "";
    currentOrderMode = "";
    const promoInputField = document.getElementById('promo-input');
    if (promoInputField) promoInputField.value = ""; 
    
    showPage('order-status-page');
}

function renderOrders() {
    const statusContainer = document.querySelector('.status-container');
    if (!statusContainer) return;

    if (ordersHistory.length === 0) {
        statusContainer.innerHTML = `
            <div class="logo-circle" style="opacity: 0.3; margin-top: 50px;">
                <img src="asset/quantom logo.jpeg" alt="Logo" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
            <p style="text-align:center;">No orders yet.</p>
            <button class="pay-btn" onclick="showPage('menu-page')">Start Ordering</button>
        `;
        return;
    }

    const ordersHTML = ordersHistory.map(order => `
        <div class="order-details-box" style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: 900; font-size: 1.1rem;">#${order.id}</span>
                <span style="background: #fff3e0; color: var(--accent); padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: bold;">
                    ${order.status}
                </span>
            </div>
            <div style="margin: 10px 0; padding: 10px; background: #f9f9f9; border-radius: 8px; border-left: 4px solid var(--accent);">
                <p style="font-size: 0.7rem; color: #777; margin: 0; text-transform: uppercase;">Method: ${order.paymentMethod}</p>
                <p style="font-size: 0.9rem; font-weight: 600; color: #333; margin: 4px 0;">📍 ${order.location}</p>
            </div>
            <p style="font-size: 0.8rem; color: #888; margin: 5px 0;">${order.time} • ${order.items.length} items</p>
            <div style="font-size: 0.85rem; color: #555; margin-bottom: 10px;">
                ${order.items.map(i => i.name).join(', ')}
            </div>
            <div style="border-top: 1px dashed #eee; padding-top: 10px; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 0.8rem; color: #999;">Paid</span>
                <span style="font-weight: bold; color: var(--dark);">Rp ${order.amount.toLocaleString('id-ID')}</span>
            </div>
        </div>
    `).join('');

    statusContainer.innerHTML = `
        <h2 style="padding: 20px 0 10px 5px; text-align: left; width: 100%;">Order History</h2>
        ${ordersHTML}
        <button class="guest-btn" style="margin: 10px 0 20px 0; border-color: var(--accent); color: var(--accent);" onclick="showPage('menu-page')">
            + Order More
        </button>
        <div style="height: 100px; width: 100%;"></div>
    `;
}

function updateUI() {
    const count = cart.length;
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    const countLabel = document.getElementById('count');
    if (countLabel) countLabel.innerText = count;
    
    const bar = document.getElementById('checkout-bar');
    const isMenu = document.getElementById('menu-page')?.style.display !== 'none';
    if (count > 0 && isMenu) {
        bar.style.display = 'flex';
        document.getElementById('bar-count').innerText = count;
        document.getElementById('bar-total').innerText = `Rp ${total.toLocaleString('id-ID')}`;
    } else if (bar) bar.style.display = 'none';
}

function handleLogin() {
    const user = document.getElementById('username').value;
    if (user.length > 2) showPage('home-page');
    else alert("Enter valid credentials");
}
function handleSignUp() { showPage('home-page'); }
function continueAsGuest() { showPage('home-page'); }
function tryGoToCheckout() { if (cart.length > 0) showPage('order-mode-page'); }

document.addEventListener("DOMContentLoaded", () => {
    renderMenu();
    showPage('login-page');
});