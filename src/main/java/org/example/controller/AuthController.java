package org.example.controller;

import org.example.model.HandshakeResponse;
import org.example.service.TokenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Контроллер для первичного рукопожатия (НЕ шифруется).
 *
 * =====================================================================
 * ЭНДПОИНТ: POST /api/auth/handshake
 * =====================================================================
 * Клиент отправляет встроенный токен лаунчера (открытым текстом).
 * Сервер генерирует AES-256 ключ и сессионный токен, возвращает их.
 *
 * --- Запрос (JSON, без шифрования): ---
 * {
 *   "token": "super-secret-launcher-token-2024"
 * }
 *
 * --- Ответ (JSON, без шифрования): ---
 * {
 *   "sessionToken": "550e8400-e29b-41d4-a716-446655440000",
 *   "aesKey": "base64-encoded-AES-256-key..."
 * }
 *
 * После этого клиент использует sessionToken и aesKey для всех
 * последующих зашифрованных запросов.
 * =====================================================================
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Value("${launcher.builtin-token}")
    private String builtInToken;

    private final TokenService tokenService;

    @Autowired
    public AuthController(TokenService tokenService) {
        this.tokenService = tokenService;
    }

    @PostMapping("/handshake")
    public ResponseEntity<?> handshake(@RequestBody Map<String, String> request) {
        String token = request.get("token");

        // Проверяем встроенный токен
        if (token == null || !token.equals(builtInToken)) {
            return ResponseEntity.status(401)
                    .body(Map.of(
                            "status", "denied",
                            "message", "Invalid launcher token"
                    ));
        }

        try {
            // Создаём новую сессию
            String[] session = tokenService.createSession();
            String sessionToken = session[0];
            String aesKey = session[1];

            System.out.println("[Auth] Новый handshake, сессия: " + sessionToken);

            return ResponseEntity.ok(new HandshakeResponse(sessionToken, aesKey));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .body(Map.of(
                            "status", "error",
                            "message", "Internal server error"
                    ));
        }
    }
}
