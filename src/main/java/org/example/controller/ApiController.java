package org.example.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.model.*;
import org.example.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.crypto.SecretKey;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

/**
 * Контроллер зашифрованных эндпоинтов.
 *
 * Все запросы (кроме handshake) используют шифрование AES-256-GCM.
 *
 * =====================================================================
 * ФОРМАТ ЗАШИФРОВАННОГО ЗАПРОСА
 * =====================================================================
 * Клиент:
 *   1. Формирует JSON payload (например: {"username":"admin","password":"admin123"})
 *   2. Шифрует его AES-256-GCM ключом (полученным при handshake)
 *   3. Формат шифрования: Base64( IV(12 байт) || ciphertext )
 *   4. Отправляет POST-запрос:
 *
 *   POST /api/login  (или /api/resources, /api/server/join)
 *   Content-Type: application/json
 *   {
 *     "sessionToken": "uuid-from-handshake",
 *     "data": "base64-encoded-encrypted-payload"
 *   }
 *
 * =====================================================================
 * ФОРМАТ ЗАШИФРОВАННОГО ОТВЕТА
 * =====================================================================
 * Сервер:
 *   1. Формирует JSON ответ
 *   2. Шифрует его тем же AES-ключом сессии
 *   3. Отправляет:
 *   {
 *     "success": true,
 *     "data": "base64-encoded-encrypted-response"
 *   }
 *
 * Клиент расшифровывает data тем же ключом.
 * =====================================================================
 */
@RestController
@RequestMapping("/api")
public class ApiController {

    private final EncryptionService encryptionService;
    private final TokenService tokenService;
    private final UserService userService;
    private final ResourceService resourceService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    public ApiController(EncryptionService encryptionService,
                         TokenService tokenService,
                         UserService userService,
                         ResourceService resourceService) {
        this.encryptionService = encryptionService;
        this.tokenService = tokenService;
        this.userService = userService;
        this.resourceService = resourceService;
    }

    // ================================================================
    //  Вспомогательные методы
    // ================================================================

    private ResponseEntity<EncryptedResponse> errorResponse(String message) {
        return ResponseEntity.ok(new EncryptedResponse(false, message));
    }

    private ResponseEntity<EncryptedResponse> encryptAndRespond(Object responseObj, SecretKey key) throws Exception {
        String json = objectMapper.writeValueAsString(responseObj);
        String encrypted = encryptionService.encrypt(json, key);
        return ResponseEntity.ok(new EncryptedResponse(true, encrypted));
    }

    // ================================================================
    /**
     * =================================================================
     *  ЭНДПОИНТ: POST /api/login
     * =================================================================
     *  Авторизация пользователя.
     *
     *  --- Расшифрованный payload запроса (JSON внутри data): ---
     *  {
     *    "username": "admin",
     *    "password": "admin123"
     *  }
     *
     *  --- Расшифрованный ответ (JSON внутри data): ---
     *  Успех:
     *  {
     *    "status": "accepted",
     *    "message": "Login successful"
     *  }
     *
     *  Отказ:
     *  {
     *    "status": "denied",
     *    "message": "Invalid credentials"
     *  }
     * =================================================================
     */
    @PostMapping("/login")
    public ResponseEntity<EncryptedResponse> login(@RequestBody EncryptedRequest request) {
        try {
            // 1. Проверяем сессию
            if (!tokenService.isValidSession(request.getSessionToken())) {
                return errorResponse("Invalid session");
            }

            SecretKey key = tokenService.getKey(request.getSessionToken());

            // 2. Расшифровываем запрос
            String decrypted = encryptionService.decrypt(request.getData(), key);
            LoginRequest loginReq = objectMapper.readValue(decrypted, LoginRequest.class);

            System.out.println("[Login] Попытка входа: " + loginReq.getUsername());

            // 3. Проверяем учётные данные
            Map<String, String> responseMap = new HashMap<>();
            if (userService.authenticate(loginReq.getUsername(), loginReq.getPassword())) {
                // Помечаем сессию как аутентифицированную
                tokenService.authenticate(request.getSessionToken(), loginReq.getUsername());
                responseMap.put("status", "accepted");
                responseMap.put("message", "Login successful");
                System.out.println("[Login] Успешный вход: " + loginReq.getUsername());
            } else {
                responseMap.put("status", "denied");
                responseMap.put("message", "Invalid credentials");
                System.out.println("[Login] Отказано: " + loginReq.getUsername());
            }

            // 4. Шифруем и отправляем ответ
            return encryptAndRespond(responseMap, key);

        } catch (Exception e) {
            e.printStackTrace();
            try {
                return ResponseEntity.ok(new EncryptedResponse(false, "Decryption error"));
            } catch (Exception ex) {
                return ResponseEntity.status(500).build();
            }
        }
    }

    // ================================================================
    /**
     * =================================================================
     *  ЭНДПОИНТ: POST /api/resources
     * =================================================================
     *  Запрос списка доступных ресурсов (модов и файлов Minecraft).
     *
     *  --- Расшифрованный payload запроса (JSON внутри data): ---
     *  {
     *    "type": "list"
     *  }
     *
     *  --- Расшифрованный ответ (JSON внутри data): ---
     *  {
     *    "mods": ["optifine.jar", "jei.jar", "sodium.jar"],
     *    "minecraft": ["minecraft.jar", "libraries.zip", "assets.zip"]
     *  }
     *
     *  После получения списка, клиент может скачать каждый файл
     *  через POST /api/resources/download
     * =================================================================
     */
    @PostMapping("/resources")
    public ResponseEntity<EncryptedResponse> resources(@RequestBody EncryptedRequest request) {
        try {
            if (!tokenService.isValidSession(request.getSessionToken())) {
                return errorResponse("Invalid session");
            }

            SecretKey key = tokenService.getKey(request.getSessionToken());

            // Формируем список ресурсов
            Map<String, Object> responseMap = new HashMap<>();
            responseMap.put("mods", resourceService.getModsList());
            responseMap.put("minecraft", resourceService.getMinecraftFilesList());

            return encryptAndRespond(responseMap, key);

        } catch (Exception e) {
            e.printStackTrace();
            try {
                return ResponseEntity.ok(new EncryptedResponse(false, "Error"));
            } catch (Exception ex) {
                return ResponseEntity.status(500).build();
            }
        }
    }

    // ================================================================
    /**
     * =================================================================
     *  ЭНДПОИНТ: POST /api/resources/download
     * =================================================================
     *  Скачивание конкретного файла ресурса.
     *  ТРЕБУЕТ УСПЕШНОЙ АВТОРИЗАЦИИ (предварительный /api/login).
     *
     *  --- Расшифрованный payload запроса (JSON внутри data): ---
     *  {
     *    "type": "mod",              // "mod" или "minecraft"
     *    "filename": "optifine.jar"  // имя файла из списка
     *  }
     *
     *  --- Ответ: ---
     *  Успех: файл передаётся как application/octet-stream (бинарные данные)
     *  Отказ: JSON с описанием ошибки
     *
     *  NOTE: Этот эндпоинт НЕ возвращает зашифрованный JSON.
     *  Файл отправляется как есть (бинарный поток).
     *  Сессия проверяется через sessionToken в query-параметре.
     *
     *  Альтернативный вариант вызова (через query-параметры):
     *  GET /api/resources/download?sessionToken=UUID&type=mod&filename=optifine.jar
     * =================================================================
     */
    @GetMapping("/resources/download")
    public ResponseEntity<?> downloadResource(
            @RequestParam String sessionToken,
            @RequestParam String type,
            @RequestParam String filename) {
        try {
            // Проверяем сессию и авторизацию
            if (!tokenService.isValidSession(sessionToken)) {
                return ResponseEntity.status(401).body("Invalid session");
            }
            if (!tokenService.isAuthenticated(sessionToken)) {
                return ResponseEntity.status(403).body("Not authenticated. Login first.");
            }

            File file;
            if ("mod".equals(type)) {
                file = resourceService.getModFile(filename);
            } else if ("minecraft".equals(type)) {
                file = resourceService.getMinecraftFile(filename);
            } else {
                return ResponseEntity.badRequest().body("Invalid type. Use 'mod' or 'minecraft'");
            }

            if (file == null || !file.exists()) {
                return ResponseEntity.notFound().build();
            }

            // Отправляем файл
            Resource resource = new FileSystemResource(file);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getName() + "\"")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .contentLength(file.length())
                    .body(resource);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Server error");
        }
    }

    // ================================================================
    /**
     * =================================================================
     *  ЭНДПОИНТ: POST /api/resources/download-all
     * =================================================================
     *  Скачивание ВСЕХ ресурсов одним ZIP-архивом.
     *  ТРЕБУЕТ УСПЕШНОЙ АВТОРИЗАЦИИ.
     *
     *  --- Расшифрованный payload запроса (JSON внутри data): ---
     *  {}   (пустой JSON объект)
     *
     *  --- Ответ: ---
     *  Успех: ZIP-файл (application/zip)
     *  Отказ: JSON с ошибкой
     * =================================================================
     */
    @PostMapping("/resources/download-all")
    public ResponseEntity<?> downloadAll(@RequestBody EncryptedRequest request) {
        try {
            if (!tokenService.isValidSession(request.getSessionToken())) {
                return ResponseEntity.status(401).body("Invalid session");
            }
            if (!tokenService.isAuthenticated(request.getSessionToken())) {
                return ResponseEntity.status(403).body("Not authenticated");
            }

            // Создаём ZIP в памяти
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            try (ZipOutputStream zos = new ZipOutputStream(baos)) {
                // Добавляем моды
                for (String modName : resourceService.getModsList()) {
                    File modFile = resourceService.getModFile(modName);
                    if (modFile != null) {
                        zos.putNextEntry(new ZipEntry("mods/" + modName));
                        zos.write(java.nio.file.Files.readAllBytes(modFile.toPath()));
                        zos.closeEntry();
                    }
                }
                // Добавляем файлы Minecraft
                for (String mcName : resourceService.getMinecraftFilesList()) {
                    File mcFile = resourceService.getMinecraftFile(mcName);
                    if (mcFile != null) {
                        zos.putNextEntry(new ZipEntry("minecraft/" + mcName));
                        zos.write(java.nio.file.Files.readAllBytes(mcFile.toPath()));
                        zos.closeEntry();
                    }
                }
            }

            byte[] zipBytes = baos.toByteArray();

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"resources.zip\"")
                    .contentType(MediaType.parseMediaType("application/zip"))
                    .contentLength(zipBytes.length)
                    .body(zipBytes);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Server error");
        }
    }

    // ================================================================
    /**
     * =================================================================
     *  ЭНДПОИНТ: POST /api/server/join
     * =================================================================
     *  Запрос на вход на Minecraft-сервер.
     *  Проверяет полную цепочку: handshake -> login -> join.
     *  ТРЕБУЕТ УСПЕШНОЙ АВТОРИЗАЦИИ (предварительный /api/login).
     *
     *  --- Расшифрованный payload запроса (JSON внутри data): ---
     *  {
     *    "username": "admin"
     *  }
     *
     *  --- Расшифрованный ответ (JSON внутри data): ---
     *  Успех (цепочка полная, игрок авторизован):
     *  {
     *    "status": "accepted",
     *    "message": "Welcome to the server!",
     *    "username": "admin"
     *  }
     *
     *  Отказ (не был выполнен login):
     *  {
     *    "status": "denied",
     *    "message": "Not authenticated. Please login first."
     *  }
     *
     *  Отказ (имя не совпадает с сессией):
     *  {
     *    "status": "denied",
     *    "message": "Username does not match session"
     *  }
     * =================================================================
     */
    @PostMapping("/server/join")
    public ResponseEntity<EncryptedResponse> serverJoin(@RequestBody EncryptedRequest request) {
        try {
            if (!tokenService.isValidSession(request.getSessionToken())) {
                return errorResponse("Invalid session");
            }

            SecretKey key = tokenService.getKey(request.getSessionToken());

            // Расшифровываем запрос
            String decrypted = encryptionService.decrypt(request.getData(), key);
            ServerJoinRequest joinReq = objectMapper.readValue(decrypted, ServerJoinRequest.class);

            System.out.println("[ServerJoin] Попытка входа на сервер: " + joinReq.getUsername());

            // Проверяем цепочку: была ли успешная авторизация?
            Map<String, String> responseMap = new HashMap<>();
            if (!tokenService.isAuthenticated(request.getSessionToken())) {
                responseMap.put("status", "denied");
                responseMap.put("message", "Not authenticated. Please login first.");
                return encryptAndRespond(responseMap, key);
            }

            // Проверяем что имя совпадает с сессией
            String sessionUsername = tokenService.getUsername(request.getSessionToken());
            if (!joinReq.getUsername().equals(sessionUsername)) {
                responseMap.put("status", "denied");
                responseMap.put("message", "Username does not match session");
                return encryptAndRespond(responseMap, key);
            }

            // Всё ок — разрешаем вход
            responseMap.put("status", "accepted");
            responseMap.put("message", "Welcome to the server!");
            responseMap.put("username", joinReq.getUsername());
            System.out.println("[ServerJoin] Игрок " + joinReq.getUsername() + " вошёл на сервер");

            return encryptAndRespond(responseMap, key);

        } catch (Exception e) {
            e.printStackTrace();
            try {
                return ResponseEntity.ok(new EncryptedResponse(false, "Error"));
            } catch (Exception ex) {
                return ResponseEntity.status(500).build();
            }
        }
    }
}
