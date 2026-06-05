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