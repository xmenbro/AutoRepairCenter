const http = require("http");
const url = require("url");
const fs = require("fs");
const path = require("path");

// Пути к файлам данных
const USERS_FILE = path.join(__dirname, '../api/users.json');
const PRODUCTS_FILE = path.join(__dirname, '../api/products.json');
const PROMOS_FILE = path.join(__dirname, '../api/promocodes.json');
const CARTS_DIR = path.join(__dirname, '../api/carts');

// Создаем директорию для корзин если её нет
if (!fs.existsSync(CARTS_DIR)) {
    fs.mkdirSync(CARTS_DIR, { recursive: true });
}

// Вспомогательные функции для работы с файлами
function readUsers() {
    try {
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Ошибка чтения users.json:', error);
        return { users: [] };
    }
}

function writeUsers(usersData) {
    try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(usersData, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Ошибка записи users.json:', error);
        return false;
    }
}

function readProducts() {
    try {
        const data = fs.readFileSync(PRODUCTS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Ошибка чтения products.json:', error);
        return { status: 'success', count: 0, products: [] };
    }
}

function readPromos() {
    try {
        if (!fs.existsSync(PROMOS_FILE)) {
            return { status: 'success', count: 0, promos: [] };
        }
        const data = fs.readFileSync(PROMOS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Ошибка чтения promocodes.json:', error);
        return { status: 'success', count: 0, promos: [] };
    }
}

function writeProducts(productsData) {
    try {
        fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(productsData, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Ошибка записи products.json:', error);
        return false;
    }
}

function getUserCart(userId) {
    const cartFile = path.join(CARTS_DIR, `cart_${userId}.json`);
    try {
        if (fs.existsSync(cartFile)) {
            const data = fs.readFileSync(cartFile, 'utf8');
            return JSON.parse(data);
        }
        return [];
    } catch (error) {
        console.error('Ошибка чтения корзины:', error);
        return [];
    }
}

function saveUserCart(userId, cart) {
    const cartFile = path.join(CARTS_DIR, `cart_${userId}.json`);
    try {
        fs.writeFileSync(cartFile, JSON.stringify(cart, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Ошибка сохранения корзины:', error);
        return false;
    }
}

// Функция для отправки JSON ответа
function sendJSON(response, statusCode, data) {
    response.writeHead(statusCode, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    });
    response.end(JSON.stringify(data));
}

http.createServer(function(request, response) {
    
    const parsedUrl = url.parse(request.url, true);
    const pathname = parsedUrl.pathname;
    
    console.log("URL:", request.url);
    console.log("Path:", pathname);
    console.log("Тип запроса:", request.method);
    
    // Настройка CORS
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Обработка preflight запросов
    if (request.method === 'OPTIONS') {
        response.writeHead(204);
        response.end();
        return;
    }
    
    // Обработка POST запросов
    if (request.method === 'POST') {
        let body = '';
        
        request.on('data', chunk => {
            body += chunk.toString();
        });
        
        request.on('end', () => {
            try {
                const data = JSON.parse(body);
                
                // Авторизация
                if (pathname === '/auth' || pathname === '/sign-in') {
                    const usersData = readUsers();
                    const user = usersData.users.find(u => 
                        u.login === data.login && u.password === data.password
                    );
                    
                    if (user) {
                        sendJSON(response, 200, {
                            success: true,
                            message: "Вход выполнен успешно",
                            user: {
                                id: user.id,
                                login: user.login,
                                email: user.email,
                                role: user.role
                            }
                        });
                    } else {
                        sendJSON(response, 401, {
                            success: false,
                            message: "Неверный логин или пароль"
                        });
                    }
                    return;
                }
                
                // Регистрация
                if (pathname === '/register' || pathname === '/sign-up') {
                    const usersData = readUsers();
                    const hasEmail = data.email || data.mail;
                    
                    if (!data.login || !data.password || !hasEmail) {
                        sendJSON(response, 400, {
                            success: false,
                            message: "Заполните все обязательные поля: логин, пароль и email"
                        });
                        return;
                    }
                    
                    // Проверка на существующего пользователя
                    if (usersData.users.find(u => u.login === data.login || u.email === (data.email || data.mail))) {
                        sendJSON(response, 409, {
                            success: false,
                            message: "Пользователь с таким логином или email уже существует"
                        });
                        return;
                    }
                    
                    // Создаем нового пользователя
                    const newUser = {
                        id: usersData.users.length > 0 ? Math.max(...usersData.users.map(u => u.id)) + 1 : 1,
                        login: data.login,
                        email: data.email || data.mail,
                        password: data.password,
                        role: 'user' // По умолчанию обычный пользователь
                    };
                    
                    usersData.users.push(newUser);
                    
                    if (writeUsers(usersData)) {
                        sendJSON(response, 200, {
                            success: true,
                            message: "Аккаунт успешно создан",
                            user: {
                                id: newUser.id,
                                login: newUser.login,
                                email: newUser.email,
                                role: newUser.role
                            }
                        });
                    } else {
                        sendJSON(response, 500, {
                            success: false,
                            message: "Ошибка при создании аккаунта"
                        });
                    }
                    return;
                }
                
                // Получение корзины пользователя
                if (pathname === '/cart') {
                    if (!data.userId) {
                        sendJSON(response, 400, {
                            success: false,
                            message: "Не указан ID пользователя"
                        });
                        return;
                    }
                    
                    const cart = getUserCart(data.userId);
                    sendJSON(response, 200, {
                        status: 'success',
                        cart: cart,
                        count: cart.reduce((sum, item) => sum + item.quantity, 0),
                        total: cart.reduce((total, item) => total + (item.price * item.quantity), 0)
                    });
                    return;
                }
                
                // Сохранение корзины пользователя
                if (pathname === '/cart/save') {
                    if (!data.userId || !data.cart) {
                        sendJSON(response, 400, {
                            success: false,
                            message: "Не указан ID пользователя или корзина"
                        });
                        return;
                    }
                    
                    if (saveUserCart(data.userId, data.cart)) {
                        sendJSON(response, 200, {
                            success: true,
                            message: "Корзина сохранена"
                        });
                    } else {
                        sendJSON(response, 500, {
                            success: false,
                            message: "Ошибка при сохранении корзины"
                        });
                    }
                    return;
                }
                
                // Добавление товара (только для администратора)
                if (pathname === '/products/add') {
                    if (!data.userId) {
                        sendJSON(response, 401, {
                            success: false,
                            message: "Требуется авторизация"
                        });
                        return;
                    }
                    
                    const usersData = readUsers();
                    const user = usersData.users.find(u => u.id === data.userId);
                    
                    if (!user || user.role !== 'admin') {
                        sendJSON(response, 403, {
                            success: false,
                            message: "Доступ запрещен. Требуются права администратора"
                        });
                        return;
                    }
                    
                    if (!data.product || !data.product.title || !data.product.price) {
                        sendJSON(response, 400, {
                            success: false,
                            message: "Не указаны обязательные поля товара"
                        });
                        return;
                    }
                    
                    const productsData = readProducts();
                    const newProduct = {
                        id: productsData.products.length > 0 ? Math.max(...productsData.products.map(p => p.id)) + 1 : 1,
                        image: data.product.image || "../images/cards/default.webp",
                        title: data.product.title,
                        brand: data.product.brand || "Unknown",
                        price: parseInt(data.product.price),
                        availability: data.product.availability || "В наличии"
                    };
                    
                    productsData.products.push(newProduct);
                    productsData.count = productsData.products.length;
                    
                    if (writeProducts(productsData)) {
                        sendJSON(response, 200, {
                            success: true,
                            message: "Товар добавлен",
                            product: newProduct
                        });
                    } else {
                        sendJSON(response, 500, {
                            success: false,
                            message: "Ошибка при добавлении товара"
                        });
                    }
                    return;
                }
                
                // Удаление товара (только для администратора)
                if (pathname === '/products/delete') {
                    if (!data.userId) {
                        sendJSON(response, 401, {
                            success: false,
                            message: "Требуется авторизация"
                        });
                        return;
                    }
                    
                    const usersData = readUsers();
                    const user = usersData.users.find(u => u.id === data.userId);
                    
                    if (!user || user.role !== 'admin') {
                        sendJSON(response, 403, {
                            success: false,
                            message: "Доступ запрещен. Требуются права администратора"
                        });
                        return;
                    }
                    
                    if (!data.productId) {
                        sendJSON(response, 400, {
                            success: false,
                            message: "Не указан ID товара"
                        });
                        return;
                    }
                    
                    const productsData = readProducts();
                    const initialLength = productsData.products.length;
                    productsData.products = productsData.products.filter(p => p.id !== parseInt(data.productId));
                    
                    if (productsData.products.length < initialLength) {
                        productsData.count = productsData.products.length;
                        
                        if (writeProducts(productsData)) {
                            sendJSON(response, 200, {
                                success: true,
                                message: "Товар удален"
                            });
                        } else {
                            sendJSON(response, 500, {
                                success: false,
                                message: "Ошибка при удалении товара"
                            });
                        }
                    } else {
                        sendJSON(response, 404, {
                            success: false,
                            message: "Товар не найден"
                        });
                    }
                    return;
                }
                
                // Оформление заказа
                if (pathname === '/order') {
                    const isValid = data.customerName && data.phone && data.email && 
                                  data.address && data.deliveryMethod && data.paymentMethod;
                    
                    if (isValid) {
                        sendJSON(response, 200, {
                            success: true,
                            message: "Заказ успешно оформлен",
                            order: {
                                customerName: data.customerName,
                                phone: data.phone,
                                email: data.email,
                                address: data.address,
                                deliveryMethod: data.deliveryMethod,
                                paymentMethod: data.paymentMethod,
                                comments: data.comments || ''
                            }
                        });
                    } else {
                        sendJSON(response, 400, {
                            success: false,
                            message: "Заполните все обязательные поля"
                        });
                    }
                    return;
                }

                // Проверка промокода
                if (pathname === '/promo/check' || pathname === '/check-promo') {
                    if (!data.code) {
                        sendJSON(response, 400, {
                            success: false,
                            message: 'Не передан код промокода'
                        });
                        return;
                    }

                    const promosData = readPromos();
                    const code = (data.code || '').toString().trim().toLowerCase();
                    const promo = (promosData.promos || []).find(p => (p.code || '').toString().toLowerCase() === code);

                    if (!promo) {
                        sendJSON(response, 404, {
                            success: false,
                            message: 'Промокод не найден'
                        });
                        return;
                    }

                    // Optionally check expiry
                    if (promo.expires) {
                        const now = new Date();
                        const exp = new Date(promo.expires);
                        if (!isNaN(exp.getTime()) && exp < now) {
                            sendJSON(response, 410, {
                                success: false,
                                message: 'Промокод просрочен'
                            });
                            return;
                        }
                    }

                    sendJSON(response, 200, {
                        success: true,
                        message: 'Промокод применим',
                        promo: promo
                    });
                    return;
                }
                
                // Неизвестный эндпоинт
                sendJSON(response, 404, {
                    success: false,
                    message: "Эндпоинт не найден"
                });
                
            } catch (error) {
                console.error("Ошибка парсинга JSON:", error);
                sendJSON(response, 400, {
                    success: false,
                    message: "Некорректный формат данных. Ожидается JSON.",
                    error: error.message
                });
            }
        });
        
    } else if (request.method === 'GET' || request.method === 'HEAD') {
        // Попытка отдать статический файл (из `src/html` или сборки `docs/`) перед обработкой API
        try {
            const localPath = (pathname === '/' || pathname === '') ? 'index.html' : pathname.replace(/^\//, '');

            const candidates = [
                path.join(__dirname, '..', 'html', localPath),           // src/html/...
                path.join(__dirname, '..', '..', 'docs', localPath),     // docs/...
                path.join(__dirname, '..', localPath)                    // src/...
            ];

            for (const fp of candidates) {
                if (fs.existsSync(fp) && fs.statSync(fp).isFile()) {
                    const ext = path.extname(fp).toLowerCase();
                    const mimeTypes = {
                        '.html': 'text/html; charset=utf-8',
                        '.css': 'text/css; charset=utf-8',
                        '.js': 'application/javascript; charset=utf-8',
                        '.json': 'application/json; charset=utf-8',
                        '.png': 'image/png',
                        '.jpg': 'image/jpeg',
                        '.jpeg': 'image/jpeg',
                        '.webp': 'image/webp',
                        '.svg': 'image/svg+xml',
                        '.ico': 'image/x-icon'
                    };

                    const contentType = mimeTypes[ext] || 'application/octet-stream';
                    const fileBuffer = fs.readFileSync(fp);
                    response.writeHead(200, { 'Content-Type': contentType, 'Access-Control-Allow-Origin': '*' });
                    response.end(fileBuffer);
                    return;
                }
            }
        } catch (err) {
            console.error('Error serving static file:', err);
            // fallthrough to API handlers
        }

        // Получение списка товаров
        if (pathname === '/products' || pathname === '/api/products.json') {
            const productsData = readProducts();
            // Normalize image paths for server-hosted site: make them absolute so client loads from same origin
            if (productsData && Array.isArray(productsData.products)) {
                productsData.products = productsData.products.map(p => {
                    try {
                        if (p && p.image && typeof p.image === 'string') {
                            // remove leading ./ or ../ segments
                            // replace any leading ./ or ../ with a single leading slash
                            let img = p.image.replace(/^(\.\.\/|\.\/)+/, '/');
                            p.image = img;
                        }
                    } catch (e) { /* ignore */ }
                    return p;
                });
            }
            sendJSON(response, 200, productsData);
            return;
        }

        // Получение списка промокодов
        if (pathname === '/api/promocodes.json' || pathname === '/promocodes') {
            const promosData = readPromos();
            sendJSON(response, 200, promosData);
            return;
        }
        
        // Информация о сервере
        sendJSON(response, 200, {
            message: "Сервер работает",
            endpoints: {
                login: "POST /auth",
                register: "POST /register",
                cart: "POST /cart",
                cartSave: "POST /cart/save",
                productsAdd: "POST /products/add (admin only)",
                productsDelete: "POST /products/delete (admin only)",
                products: "GET /products",
                order: "POST /order"
            },
            status: "online"
        });
        
    } else {
        sendJSON(response, 405, {
            success: false,
            message: "Метод не поддерживается"
        });
    }
    
}).listen(3000, function(){ 
    console.log("Сервер запущен по адресу http://localhost:3000");
    console.log("\nДоступные эндпоинты:");
    console.log("1. Авторизация: POST http://localhost:3000/auth");
    console.log("2. Регистрация: POST http://localhost:3000/register");
    console.log("3. Получение корзины: POST http://localhost:3000/cart");
    console.log("4. Сохранение корзины: POST http://localhost:3000/cart/save");
    console.log("5. Добавление товара: POST http://localhost:3000/products/add (admin)");
    console.log("6. Удаление товара: POST http://localhost:3000/products/delete (admin)");
    console.log("7. Получение товаров: GET http://localhost:3000/products");
    console.log("8. Получение промокодов: GET http://localhost:3000/api/promocodes.json");
    console.log("8. Оформление заказа: POST http://localhost:3000/order");
    console.log("9. Проверка промокода: POST http://localhost:3000/promo/check");
    console.log("\nТестовые аккаунты:");
    console.log("Администратор: login=admin, password=admin123");
    console.log("Пользователь: login=user, password=user123");
});