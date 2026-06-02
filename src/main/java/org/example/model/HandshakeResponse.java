package org.example.model;

/**
 * Ответ на handshake (НЕ шифруется, отправляется открыто).
 */
public class HandshakeResponse {
    private String sessionToken;
    /** AES-256 ключ в Base64 для шифрования дальнейших запросов */
    private String aesKey;

    public HandshakeResponse() {}

    public HandshakeResponse(String sessionToken, String aesKey) {
        this.sessionToken = sessionToken;
        this.aesKey = aesKey;
    }

    public String getSessionToken() { return sessionToken; }
    public void setSessionToken(String sessionToken) { this.sessionToken = sessionToken; }
    public String getAesKey() { return aesKey; }
    public void setAesKey(String aesKey) { this.aesKey = aesKey; }
}
