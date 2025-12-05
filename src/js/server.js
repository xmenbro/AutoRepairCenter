const http = require("http");

http.createServer(function(request, response) {
    
    console.log("Url:", request.url);
    console.log("Тип запроса:", request.method);
    console.log("User-Agent:", request.headers["user-agent"]);
    
    // Настройка CORS
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Обработка preflight запросов
    if (request.method === 'OPTIONS') {
        response.writeHead(204);
        response.end();
        return;
    }
    
    // Обработка POST запроса
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
                
                // Простая валидация
                const isValid = data.login && data.password;
                
                response.writeHead(200, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify({
                    success: isValid,
                    message: isValid ? "Вход выполнен успешно" : "Неверные данные",
                    user: isValid ? { login: data.login } : null
                }));
                
            } catch (error) {
                console.error("Ошибка парсинга JSON:", error);
                response.writeHead(400, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify({
                    success: false,
                    message: "Некорректные данные"
                }));
            }
        });
        
    } else {
        // Для других методов
        response.writeHead(200, { 'Content-Type': 'text/plain' });
        response.end("Сервер работает");
    }
    
}).listen(3000, function(){ 
    console.log("Сервер запущен по адресу http://localhost:3000");
    console.log("Для авторизации отправляйте POST запросы на http://localhost:3000/auth");
    console.log("Для регистрации отправляйте POST запросы на http://localhost:3000/register");
});