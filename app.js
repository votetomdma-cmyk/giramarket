// app.js

// 1. Импортируем модули Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
// ДОБАВИЛИ НОВЫЕ ФУНКЦИИ ДЛЯ БАЗЫ ДАННЫХ:
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// 2. ТВОЙ КОНФИГ FIREBASE (Вставь свои ключи!)
const firebaseConfig = {
  apiKey: "AIzaSyAvziZ1M87lLtJJTH_Is3IIafXY8VmI8Fo",
  authDomain: "giramarket-60f41.firebaseapp.com",
  projectId: "giramarket-60f41",
  storageBucket: "giramarket-60f41.firebasestorage.app",
  messagingSenderId: "511808754118",
  appId: "1:511808754118:web:231f4a498cdc4e0778a2c7"
};

// 3. Инициализация систем
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// 4. Подхватываем элементы интерфейса
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userInfo = document.getElementById('user-info');
const userName = document.getElementById('user-name');
const newAdBtn = document.getElementById('new-ad-btn');
const adsList = document.getElementById('ads-list'); // Контейнер для списка товаров

// 5. Логика Авторизации
loginBtn.addEventListener('click', () => {
    signInWithPopup(auth, provider).catch((error) => console.error("Auth Error:", error));
});

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

// 6. Инициализация Карты (Leaflet)
const map = L.map('map').setView([-34.6037, -58.3816], 12);
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OSM',
    subdomains: 'abcd',
    maxZoom: 20
}).addTo(map);

document.querySelector('.loading-text').style.display = 'none';

// Массив для хранения текущих маркеров на карте (чтобы удалять старые при обновлении)
let currentMarkers = [];

// --- 7. РАДАР: Слушаем базу данных в реальном времени ---
onSnapshot(collection(db, "items"), (snapshot) => {
    // 1. Очищаем старые данные
    adsList.innerHTML = '';
    currentMarkers.forEach(marker => map.removeLayer(marker));
    currentMarkers = [];

    // 2. Если база пуста
    if (snapshot.empty) {
        adsList.innerHTML = `
            <div class="status-box text-center">
                <p>> ESCANEANDO ZONA...</p>
                <p style="font-size: 12px; margin-top: 10px;">NO HAY ITEMS DETECTADOS AÚN.</p>
            </div>`;
        return;
    }

    // 3. Отрисовываем каждый товар
    snapshot.forEach((doc) => {
        const item = doc.data();
        
        // Создаем карточку в правом меню
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

        // Ставим маркер на карту
        if (item.location) {
            const marker = L.circleMarker([item.location.lat, item.location.lng], {
                color: '#64FFDA',
                fillColor: '#64FFDA',
                fillOpacity: 0.5,
                radius: 6
            }).addTo(map);
            
            // Всплывающее окно при клике на точку
            marker.bindPopup(`<b>${item.title}</b><br>${item.price}`);
            currentMarkers.push(marker);
        }
    });
});

// --- 8. Логика Модального Окна и GPS ---
const modalOverlay = document.getElementById('modal-overlay');
const closeModalBtn = document.getElementById('close-modal-btn');
const newItemForm = document.getElementById('new-item-form');
const getLocationBtn = document.getElementById('get-location-btn');
const geoStatus = document.getElementById('geo-status');

let currentItemLocation = null;

newAdBtn.addEventListener('click', () => modalOverlay.style.display = 'flex');

function closeModal() {
    modalOverlay.style.display = 'none';
    newItemForm.reset();
    currentItemLocation = null;
    geoStatus.textContent = "ESPERANDO_COORDENADAS...";
    geoStatus.className = "geo-status-text";
    getLocationBtn.style.color = "#FF9F1C";
    getLocationBtn.style.borderColor = "#FF9F1C";
}

closeModalBtn.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });

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
            getLocationBtn.style.color = "#50FA7B";
            getLocationBtn.style.borderColor = "#50FA7B";
        },
        (error) => {
            geoStatus.textContent = "ERROR: ACCESO_GPS_DENEGADO";
            geoStatus.classList.add('text-error');
        }
    );
});

// --- 9. ОТПРАВКА ДАННЫХ В FIREBASE ---
newItemForm.addEventListener('submit', async (e) => {
    e.preventDefault(); 
    
    if (!currentItemLocation) {
        geoStatus.textContent = "ERROR: REQUIERE_ESCANEO_GPS_PREVIO";
        geoStatus.classList.add('text-error');
        return;
    }

    // Меняем текст кнопки, пока идет загрузка
    const submitBtn = newItemForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "> UPLOADING...";
    submitBtn.disabled = true;

    try {
        // Пушим данные в коллекцию 'items'
        await addDoc(collection(db, "items"), {
            title: document.getElementById('item-title').value,
            desc: document.getElementById('item-desc').value,
            price: document.getElementById('item-price').value,
            location: currentItemLocation,
            sellerName: auth.currentUser.displayName, // Имя продавца из Google
            sellerId: auth.currentUser.uid,           // Уникальный ID продавца
            timestamp: serverTimestamp()              // Время сервера Google
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