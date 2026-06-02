package org.example.model;

/**
 * Зашифрованный запрос от клиента.
 * Клиент шифрует JSON-payload AES-ключом и отправляет здесь.
 */
public class EncryptedRequest {
    /** Сессионный токен, полученный при handshake */
    private String sessionToken;
    /** Base64(IV + ciphertext) — зашифрованные данные */
    private String data;

    public EncryptedRequest() {}

    public EncryptedRequest(String sessionToken, String data) {
        this.sessionToken = sessionToken;
        this.data = data;
    }

    public String getSessionToken() { return sessionToken; }
    public void setSessionToken(String sessionToken) { this.sessionToken = sessionToken; }
    public String getData() { return data; }
    public void setData(String data) { this.data = data; }
}
