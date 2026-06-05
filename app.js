// app.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// !!! ВСТАВЬ СВОИ КЛЮЧИ СЮДА !!!
const firebaseConfig = {
  apiKey: "ТВОЙ_КЛЮЧ",
  authDomain: "ТВОЙ_ДОМЕН",
  projectId: "ТВОЙ_PROJECT_ID",
  storageBucket: "ТВОЙ_BUCKET",
  messagingSenderId: "ТВОЙ_SENDER_ID",
  appId: "ТВОЙ_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userInfo = document.getElementById('user-info');
const userName = document.getElementById('user-name');
const newAdBtn = document.getElementById('new-ad-btn');
const adsList = document.getElementById('ads-list');

// --- Авторизация ---
loginBtn.addEventListener('click', () => signInWithPopup(auth, provider).catch(e => console.error(e)));
logoutBtn.addEventListener('click', () => signOut(auth));

onAuthStateChanged(auth, (user) => {
    if (user) {
        loginBtn.style.display = 'none';
        userInfo.style.display = 'flex';
        userName.textContent = `USER: ${user.displayName.toUpperCase()}`;
        newAdBtn.style.display = 'block';
    } else {
        loginBtn.style.display = 'block';
        userInfo.style.display = 'none';
        newAdBtn.style.display = 'none';
    }
});

// --- Карта ---
const map = L.map('map').setView([-34.6037, -58.3816], 12);
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OSM',
    subdomains: 'abcd',
    maxZoom: 20
}).addTo(map);

document.querySelector('.loading-text').style.display = 'none';
let currentMarkers = [];

// --- Радар (Firebase Listener) ---
onSnapshot(collection(db, "items"), (snapshot) => {
    adsList.innerHTML = '';
    currentMarkers.forEach(marker => map.removeLayer(marker));
    currentMarkers = [];

    if (snapshot.empty) {
        adsList.innerHTML = `
            <div class="status-box text-center">
                <p>> ESCANEANDO ZONA...</p>
                <p style="font-size: 12px; margin-top: 10px;">NO HAY ITEMS DETECTADOS AÚN.</p>
            </div>`;
        return;
    }

    snapshot.forEach((doc) => {
        const item = doc.data();
        
        const itemCard = document.createElement('div');
        itemCard.className = 'status-box';
        itemCard.style.textAlign = 'left';
        itemCard.innerHTML = `
            <div style="color: #64FFDA; font-weight: bold; border-bottom: 1px dashed #333; padding-bottom: 5px; margin-bottom: 5px;">> ${item.title}</div>
            <div style="color: #FF9F1C; font-size: 14px; margin-bottom: 10px;">[ ${item.price} ]</div>
            <div style="color: #8892B0; font-size: 12px;">${item.desc}</div>
            <div style="color: #555; font-size: 10px; margin-top: 10px;">SELLER: ${item.sellerName}</div>
        `;
        adsList.appendChild(itemCard);

        if (item.location) {
            const marker = L.circleMarker([item.location.lat, item.location.lng], {
                color: '#64FFDA',
                fillColor: '#64FFDA',
                fillOpacity: 0.5,
                radius: 6
            }).addTo(map);
            marker.bindPopup(`<b>${item.title}</b><br>${item.price}`);
            currentMarkers.push(marker);
        }
    });
});

// --- Модальное Окно, GPS и MODO TARGETING ---
const modalOverlay = document.getElementById('modal-overlay');
const closeModalBtn = document.getElementById('close-modal-btn');
const newItemForm = document.getElementById('new-item-form');
const getLocationBtn = document.getElementById('get-location-btn');
const mapTargetBtn = document.getElementById('map-target-btn');
const geoStatus = document.getElementById('geo-status');

let currentItemLocation = null;
let targetingMode = false; 
let draftMarker = null;    

newAdBtn.addEventListener('click', () => {
    modalOverlay.style.display = 'flex';
    // Если передумали тыкать в карту и просто переоткрыли окно
    if (targetingMode) resetTargetingMode();
});

function resetTargetingMode() {
    targetingMode = false;
    document.getElementById('map').style.cursor = '';
    const banner = document.getElementById('targeting-banner');
    if (banner) banner.style.display = 'none';
}

function closeModal() {
    modalOverlay.style.display = 'none';
    newItemForm.reset();
    currentItemLocation = null;
    resetTargetingMode();
    
    geoStatus.textContent = "ESPERANDO_COORDENADAS...";
    geoStatus.className = "geo-status-text";
    
    getLocationBtn.style.color = "#FF9F1C"; getLocationBtn.style.borderColor = "#FF9F1C";
    mapTargetBtn.style.color = "#FF9F1C"; mapTargetBtn.style.borderColor = "#FF9F1C";
    
    if (draftMarker) {
        map.removeLayer(draftMarker);
        draftMarker = null;
    }
}

closeModalBtn.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });

// 1. Обработчик GPS
getLocationBtn.addEventListener('click', () => {
    geoStatus.textContent = "> TRIANGULANDO_POSICIÓN...";
    geoStatus.className = "geo-status-text";

    if (!navigator.geolocation) {
        geoStatus.textContent = "ERROR: GPS_NO_SOPORTADO";
        geoStatus.classList.add('text-error');
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            currentItemLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
            geoStatus.textContent = `> LOCK: [${currentItemLocation.lat.toFixed(4)}, ${currentItemLocation.lng.toFixed(4)}]`;
            geoStatus.classList.add('text-success');
            
            getLocationBtn.style.color = "#50FA7B"; getLocationBtn.style.borderColor = "#50FA7B";
            mapTargetBtn.style.color = "#50FA7B"; mapTargetBtn.style.borderColor = "#50FA7B";
        },
        () => {
            geoStatus.textContent = "ERROR: ACCESO_GPS_DENEGADO";
            geoStatus.classList.add('text-error');
        }
    );
});

// 2. Обработчик Ручного Прицеливания (MODO TARGETING)
mapTargetBtn.addEventListener('click', () => {
    modalOverlay.style.display = 'none'; 
    targetingMode = true;
    document.getElementById('map').style.cursor = 'crosshair';
    
    let banner = document.getElementById('targeting-banner');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'targeting-banner';
        banner.innerHTML = '> MODO_TARGETING: HAZ CLIC EN EL MAPA PARA FIJAR UBICACIÓN <';
        banner.style.position = 'absolute';
        banner.style.top = '10px';
        banner.style.left = '50%';
        banner.style.transform = 'translateX(-50%)';
        banner.style.backgroundColor = 'rgba(255, 159, 28, 0.9)';
        banner.style.color = '#000';
        banner.style.padding = '5px 15px';
        banner.style.fontFamily = 'Courier New, monospace';
        banner.style.fontWeight = 'bold';
        banner.style.zIndex = '9999';
        banner.style.pointerEvents = 'none';
        document.getElementById('map').appendChild(banner);
    }
    banner.style.display = 'block';
});

// 3. Обработчик клика по карте
map.on('click', (e) => {
    if (!targetingMode) return; 
    
    resetTargetingMode();

    currentItemLocation = { lat: e.latlng.lat, lng: e.latlng.lng };

    if (draftMarker) map.removeLayer(draftMarker);
    draftMarker = L.circleMarker([e.latlng.lat, e.latlng.lng], {
        color: '#FF9F1C', fillColor: '#FF9F1C', fillOpacity: 0.8, radius: 8
    }).addTo(map);

    modalOverlay.style.display = 'flex';
    geoStatus.textContent = `> LOCK: [${currentItemLocation.lat.toFixed(4)}, ${currentItemLocation.lng.toFixed(4)}] (MANUAL)`;
    geoStatus.className = 'geo-status-text text-success';
    
    getLocationBtn.style.color = "#50FA7B"; getLocationBtn.style.borderColor = "#50FA7B";
    mapTargetBtn.style.color = "#50FA7B"; mapTargetBtn.style.borderColor = "#50FA7B";
});

// --- Отправка в Базу Данных ---
newItemForm.addEventListener('submit', async (e) => {
    e.preventDefault(); 
    
    if (!currentItemLocation) {
        geoStatus.textContent = "ERROR: REQUIERE_ESCANEO_PREVIO";
        geoStatus.classList.add('text-error');
        return;
    }

    const submitBtn = newItemForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "> UPLOADING...";
    submitBtn.disabled = true;

    try {
        await addDoc(collection(db, "items"), {
            title: document.getElementById('item-title').value,
            desc: document.getElementById('item-desc').value,
            price: document.getElementById('item-price').value,
            location: currentItemLocation,
            sellerName: auth.currentUser.displayName, 
            sellerId: auth.currentUser.uid,           
            timestamp: serverTimestamp()              
        });

        console.log("> UPLOAD COMPLETE.");
        closeModal(); 
    } catch (error) {
        console.error("Upload Error:", error);
        alert("Ошибка загрузки. Проверьте консоль.");
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});