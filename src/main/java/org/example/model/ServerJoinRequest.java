package org.example.model;

/**
 * Запрос на вход на Minecraft-сервер (расшифровывается на сервере).
 */
public class ServerJoinRequest {
    private String username;

    public ServerJoinRequest() {}

    public ServerJoinRequest(String username) {
        this.username = username;
    }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
}
