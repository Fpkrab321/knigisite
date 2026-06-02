package org.example.service;

import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Сервис шифрования AES-256-GCM.
 *
 * Формат зашифрованных данных:
 *   Base64( IV(12 байт) || ciphertext+tag )
 */
@Service
public class EncryptionService {

    private static final String ALGORITHM = "AES";
    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12;   // 96 бит
    private static final int GCM_TAG_LENGTH = 128;  // 128 бит

    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * Генерирует новый AES-256 ключ.
     */
    public SecretKey generateKey() throws Exception {
        KeyGenerator keyGen = KeyGenerator.getInstance(ALGORITHM);
        keyGen.init(256);
        return keyGen.generateKey();
    }

    /**
     * Кодирует SecretKey в Base64-строку.
     */
    public String encodeKey(SecretKey key) {
        return Base64.getEncoder().encodeToString(key.getEncoded());
    }

    /**
     * Декодирует Base64-строку обратно в SecretKey.
     */
    public SecretKey decodeKey(String encodedKey) {
        byte[] decodedKey = Base64.getDecoder().decode(encodedKey);
        return new SecretKeySpec(decodedKey, 0, decodedKey.length, ALGORITHM);
    }

    /**
     * Шифрует plaintext с помощью AES-GCM.
     * Возвращает Base64(IV + ciphertext).
     */
    public String encrypt(String plaintext, SecretKey key) throws Exception {
        byte[] iv = new byte[GCM_IV_LENGTH];
        secureRandom.nextBytes(iv);

        Cipher cipher = Cipher.getInstance(TRANSFORMATION);
        GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
        cipher.init(Cipher.ENCRYPT_MODE, key, gcmSpec);

        byte[] ciphertext = cipher.doFinal(plaintext.getBytes(java.nio.charset.StandardCharsets.UTF_8));

        // IV || ciphertext
        byte[] result = new byte[iv.length + ciphertext.length];
        System.arraycopy(iv, 0, result, 0, iv.length);
        System.arraycopy(ciphertext, 0, result, iv.length, ciphertext.length);

        return Base64.getEncoder().encodeToString(result);
    }

    /**
     * Расшифровывает Base64(IV + ciphertext) с помощью AES-GCM.
     */
    public String decrypt(String encryptedData, SecretKey key) throws Exception {
        byte[] decoded = Base64.getDecoder().decode(encryptedData);

        // Извлекаем IV (первые 12 байт)
        byte[] iv = new byte[GCM_IV_LENGTH];
        System.arraycopy(decoded, 0, iv, 0, GCM_IV_LENGTH);

        // Извлекаем ciphertext (остальное)
        byte[] ciphertext = new byte[decoded.length - GCM_IV_LENGTH];
        System.arraycopy(decoded, GCM_IV_LENGTH, ciphertext, 0, ciphertext.length);

        Cipher cipher = Cipher.getInstance(TRANSFORMATION);
        GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
        cipher.init(Cipher.DECRYPT_MODE, key, gcmSpec);

        byte[] plaintext = cipher.doFinal(ciphertext);
        return new String(plaintext, java.nio.charset.StandardCharsets.UTF_8);
    }
}
