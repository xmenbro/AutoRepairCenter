const http = require("http");
const url = require("url");

http.createServer(function(request, response) {
    
    const parsedUrl = url.parse(request.url, true);
    const pathname = parsedUrl.pathname;
    
    console.log("URL:", request.url);
    console.log("Path:", pathname);
    console.log("Тип запроса:", request.method);
    console.log("User-Agent:", request.headers["user-agent"]);
    
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
    
    // Обработка POST запросов для разных эндпоинтов
    if (request.method === 'POST') {
        let body = '';
        
        request.on('data', chunk => {
            body += chunk.toString();
        });
        
        request.on('end', () => {
            console.log("Тело запроса:", body);
            
            try {
                const data = JSON.parse(body);
                console.log("Parsed data:", data);
                
                // Определяем тип запроса по URL
                let isValid = false;
                let message = "";
                let user = null;
                
                if (pathname === '/auth' || pathname === '/sign-in') {
                    // Валидация для входа
                    isValid = data.login && data.password;
                    message = isValid ? "Вход выполнен успешно" : "Неверный логин или пароль";
                    
                    if (isValid) {
                        user = { 
                            login: data.login,
                            email: data.email || null
                        };
                    }
                    
                } else if (pathname === '/register' || pathname === '/sign-up') {
                    // Валидация для регистрации
                    const hasEmail = data.email || data.mail;
                    isValid = data.login && data.password && hasEmail;
                    
                    if (isValid) {
                        message = "Аккаунт успешно создан";
                        user = { 
                            login: data.login,
                            email: data.email || data.mail
                        };
                    } else {
                        message = "Заполните все обязательные поля: логин, пароль и email";
                    }
                    
                } else {
                    // Неизвестный эндпоинт
                    response.writeHead(404, { 'Content-Type': 'application/json' });
                    response.end(JSON.stringify({
                        success: false,
                        message: "Эндпоинт не найден"
                    }));
                    return;
                }
                
                response.writeHead(200, { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                });
                
                response.end(JSON.stringify({
                    success: isValid,
                    message: message,
                    user: user,
                    timestamp: new Date().toISOString()
                }));
                
            } catch (error) {
                console.error("Ошибка парсинга JSON:", error);
                response.writeHead(400, { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                });
                response.end(JSON.stringify({
                    success: false,
                    message: "Некорректный формат данных. Ожидается JSON.",
                    error: error.message
                }));
            }
        });
        
    } else if (request.method === 'GET') {
        // Простой ответ для GET запросов
        response.writeHead(200, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        });
        response.end(JSON.stringify({
            message: "Сервер аутентификации работает",
            endpoints: {
                login: "POST /auth или POST /sign-in",
                register: "POST /register или POST /sign-up"
            },
            status: "online"
        }));
        
    } else {
        // Для других методов
        response.writeHead(405, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        });
        response.end(JSON.stringify({
            success: false,
            message: "Метод не поддерживается"
        }));
    }
    
}).listen(3000, function(){ 
    console.log("Сервер запущен по адресу http://localhost:3000");
    console.log("\nДоступные эндпоинты:");
    console.log("1. Для авторизации: POST http://localhost:3000/auth");
    console.log("   или POST http://localhost:3000/sign-in");
    console.log("2. Для регистрации: POST http://localhost:3000/register");
    console.log("   или POST http://localhost:3000/sign-up");
    console.log("3. Для проверки работы: GET http://localhost:3000");
    console.log("\nПример данных для регистрации:");
    console.log('{ "login": "user123", "password": "pass123", "email": "user@example.com" }');
    console.log("\nПример данных для входа:");
    console.log('{ "login": "user123", "password": "pass123" }');
});