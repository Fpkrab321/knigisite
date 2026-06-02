package org.example.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Менеджер сессий.
 * Хранит маппинг sessionToken -> AES-ключ и sessionToken -> имя пользователя.
 */
@Service
public class TokenService {

    private final EncryptionService encryptionService;

    /** sessionToken -> AES SecretKey */
    private final Map<String, SecretKey> sessions = new ConcurrentHashMap<>();

    /** sessionToken -> username (заполняется после успешного логина) */
    private final Map<String, String> authenticatedUsers = new ConcurrentHashMap<>();

    @Autowired
    public TokenService(EncryptionService encryptionService) {
        this.encryptionService = encryptionService;
    }

    /**
     * Создаёт новую сессию: генерирует AES-ключ и токен.
     * @return [sessionToken, aesKeyBase64]
     */
    public String[] createSession() throws Exception {
        SecretKey aesKey = encryptionService.generateKey();
        String sessionToken = UUID.randomUUID().toString();
        sessions.put(sessionToken, aesKey);
        return new String[]{ sessionToken, encryptionService.encodeKey(aesKey) };
    }

    /**
     * Проверяет существование сессии.
     */
    public boolean isValidSession(String sessionToken) {
        return sessions.containsKey(sessionToken);
    }

    /**
     * Возвращает AES-ключ для данной сессии.
     */
    public SecretKey getKey(String sessionToken) {
        return sessions.get(sessionToken);
    }

    /**
     * Помечает сессию как аутентифицированную (после успешного login).
     */
    public void authenticate(String sessionToken, String username) {
        authenticatedUsers.put(sessionToken, username);
    }

    /**
     * Проверяет, аутентифицирована ли сессия.
     */
    public boolean isAuthenticated(String sessionToken) {
        return authenticatedUsers.containsKey(sessionToken);
    }

    /**
     * Возвращает имя пользователя для сессии.
     */
    public String getUsername(String sessionToken) {
        return authenticatedUsers.get(sessionToken);
    }

    /**
     * Удаляет сессию (logout / cleanup).
     */
    public void removeSession(String sessionToken) {
        sessions.remove(sessionToken);
        authenticatedUsers.remove(sessionToken);
    }
}
