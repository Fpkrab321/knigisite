package org.example.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.util.HashMap;
import java.util.Map;

/**
 * Сервис управления пользователями.
 * Хранит пользователей в JSON-файле в формате: { "login": "password", ... }
 */
@Service
public class UserService {

    @Value("${launcher.users-db}")
    private String usersDbPath;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private Map<String, String> users = new HashMap<>();

    @PostConstruct
    public void init() throws Exception {
        File dbFile = new File(usersDbPath);

        // Создаём директорию если не существует
        File parentDir = dbFile.getParentFile();
        if (parentDir != null && !parentDir.exists()) {
            parentDir.mkdirs();
        }

        if (!dbFile.exists()) {
            // Создаём файл с пользователем по умолчанию
            users.put("admin", "admin123");
            saveUsers();
            System.out.println("[UserService] Создан файл пользователей по умолчанию: " + usersDbPath);
            System.out.println("[UserService] Логин: admin, Пароль: admin123");
        } else {
            loadUsers();
            System.out.println("[UserService] Загружено " + users.size() + " пользователей из " + usersDbPath);
        }
    }

    private void loadUsers() throws Exception {
        File dbFile = new File(usersDbPath);
        users = objectMapper.readValue(dbFile, new TypeReference<Map<String, String>>() {});
    }

    private void saveUsers() throws Exception {
        File dbFile = new File(usersDbPath);
        objectMapper.writerWithDefaultPrettyPrinter().writeValue(dbFile, users);
    }

    /**
     * Проверяет учётные данные.
     * @return true если логин существует и пароль совпадает
     */
    public boolean authenticate(String username, String password) {
        String storedPassword = users.get(username);
        return storedPassword != null && storedPassword.equals(password);
    }

    /**
     * Проверяет существование пользователя.
     */
    public boolean userExists(String username) {
        return users.containsKey(username);
    }

    /**
     * Добавляет нового пользователя и сохраняет в файл.
     */
    public void addUser(String username, String password) throws Exception {
        users.put(username, password);
        saveUsers();
    }

    /**
     * Удаляет пользователя и сохраняет изменения.
     */
    public void removeUser(String username) throws Exception {
        users.remove(username);
        saveUsers();
    }
}
