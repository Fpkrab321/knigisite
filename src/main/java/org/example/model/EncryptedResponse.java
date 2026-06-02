package org.example.model;

/**
 * Зашифрованный ответ сервера.
 */
public class EncryptedResponse {
    /** true если операция успешна */
    private boolean success;
    /** Base64(IV + ciphertext) — зашифрованные данные ответа */
    private String data;

    public EncryptedResponse() {}

    public EncryptedResponse(boolean success, String data) {
        this.success = success;
        this.data = data;
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    public String getData() { return data; }
    public void setData(String data) { this.data = data; }
}
