// app.js

// 1. Импортируем модули Firebase напрямую через CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// 2. ТВОЙ КОНФИГ FIREBASE (Скопируй свои значения из текстового файла)
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

// 5. Логика Авторизации
loginBtn.addEventListener('click', () => {
    signInWithPopup(auth, provider).catch((error) => {
        console.error("Auth Error:", error);
    });
});

logoutBtn.addEventListener('click', () => {
    signOut(auth);
});

// Слушатель состояния (проверяет, залогинен ли юзер)
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Доступ разрешен
        loginBtn.style.display = 'none';
        userInfo.style.display = 'flex';
        userName.textContent = `USER: ${user.displayName.toUpperCase()}`;
        newAdBtn.style.display = 'block'; // Показываем кнопку добавления товара
        console.log("System Status: ACCESS GRANTED");
    } else {
        // Доступ закрыт
        loginBtn.style.display = 'block';
        userInfo.style.display = 'none';
        newAdBtn.style.display = 'none';
        console.log("System Status: OFFLINE");
    }
});

// 6. Инициализация Карты (Leaflet)
// Центрируем карту: Буэнос-Айрес
const map = L.map('map').setView([-34.6037, -58.3816], 12);

// Темный слой карты (CartoDB Dark Matter), идеально под киберпанк
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    subdomains: 'abcd',
    maxZoom: 20
}).addTo(map);

// Убираем текст "Cargando mapa..."
document.querySelector('.loading-text').style.display = 'none';

console.log("MAP AND DATABASES INITIALIZED.");

// --- Логика Модального Окна ---

// 1. Подхватываем элементы
const modalOverlay = document.getElementById('modal-overlay');
const closeModalBtn = document.getElementById('close-modal-btn');
const newItemForm = document.getElementById('new-item-form');

// 2. Открытие окна
newAdBtn.addEventListener('click', () => {
    modalOverlay.style.display = 'flex';
});

// 3. Закрытие по кнопке [X]
closeModalBtn.addEventListener('click', () => {
    modalOverlay.style.display = 'none';
});

// 4. Закрытие при клике на темный фон (вне формы)
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
        modalOverlay.style.display = 'none';
    }
});

// 5. Перехват отправки формы
newItemForm.addEventListener('submit', (e) => {
    e.preventDefault(); // Строго запрещаем браузеру перезагружать страницу
    
    // Собираем данные из полей
    const title = document.getElementById('item-title').value;
    const desc = document.getElementById('item-desc').value;
    const price = document.getElementById('item-price').value;

    console.log("> DATA READY FOR UPLOAD:", { title, desc, price });
    
    // Временно: просто закрываем окно и очищаем поля
    // В следующем шаге мы отправим эти данные в Firebase и нарисуем точку на карте!
    modalOverlay.style.display = 'none';
    newItemForm.reset();
});

// --- Логика Модального Окна и GPS ---

// 1. Подхватываем элементы
const modalOverlay = document.getElementById('modal-overlay');
const closeModalBtn = document.getElementById('close-modal-btn');
const newItemForm = document.getElementById('new-item-form');
const getLocationBtn = document.getElementById('get-location-btn');
const geoStatus = document.getElementById('geo-status');

// Переменная для хранения координат текущего товара
let currentItemLocation = null;

// 2. Открытие окна
newAdBtn.addEventListener('click', () => {
    modalOverlay.style.display = 'flex';
});

// 3. Закрытие и сброс формы
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

modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
});

// 4. Запрос GPS координат
getLocationBtn.addEventListener('click', () => {
    geoStatus.textContent = "> TRIANGULANDO_POSICIÓN...";
    geoStatus.className = "geo-status-text";

    if (!navigator.geolocation) {
        geoStatus.textContent = "ERROR: GPS_NO_SOPORTADO_POR_EL_SISTEMA";
        geoStatus.classList.add('text-error');
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            // Успех: координаты получены
            currentItemLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            geoStatus.textContent = `> LOCK: [${currentItemLocation.lat.toFixed(4)}, ${currentItemLocation.lng.toFixed(4)}]`;
            geoStatus.classList.add('text-success');
            
            // Меняем цвет кнопки на зеленый
            getLocationBtn.style.color = "#50FA7B";
            getLocationBtn.style.borderColor = "#50FA7B";
        },
        (error) => {
            // Ошибка: юзер не дал права или GPS выключен
            geoStatus.textContent = "ERROR: ACCESO_GPS_DENEGADO";
            geoStatus.classList.add('text-error');
            console.error("GPS Error:", error);
        }
    );
});

// 5. Перехват отправки формы
newItemForm.addEventListener('submit', (e) => {
    e.preventDefault(); 
    
    // Блокируем отправку, если координаты не собраны
    if (!currentItemLocation) {
        geoStatus.textContent = "ERROR: REQUIERE_ESCANEO_GPS_PREVIO";
        geoStatus.classList.add('text-error');
        return;
    }

    const title = document.getElementById('item-title').value;
    const desc = document.getElementById('item-desc').value;
    const price = document.getElementById('item-price').value;

    console.log("> DATA READY FOR UPLOAD:", { 
        title, 
        desc, 
        price, 
        location: currentItemLocation 
    });
    
    closeModal();
});