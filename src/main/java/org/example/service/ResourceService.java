package org.example.service;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

/**
 * Сервис управления ресурсами (моды и файлы Minecraft).
 * Сканирует директории и предоставляет списки файлов для скачивания.
 */
@Service
public class ResourceService {

    @Value("${launcher.mods-dir}")
    private String modsDir;

    @Value("${launcher.minecraft-dir}")
    private String minecraftDir;

    @PostConstruct
    public void init() {
        // Создаём директории если не существуют
        new File(modsDir).mkdirs();
        new File(minecraftDir).mkdirs();
        System.out.println("[ResourceService] Директория модов: " + new File(modsDir).getAbsolutePath());
        System.out.println("[ResourceService] Директория Minecraft: " + new File(minecraftDir).getAbsolutePath());
    }

    /**
     * Возвращает список имён файлов модов.
     */
    public List<String> getModsList() {
        return getFileNames(new File(modsDir));
    }

    /**
     * Возвращает список имён файлов Minecraft.
     */
    public List<String> getMinecraftFilesList() {
        return getFileNames(new File(minecraftDir));
    }

    /**
     * Возвращает File для мода по имени.
     * @return null если файл не существует или находится вне директории
     */
    public File getModFile(String filename) {
        return getSafeFile(modsDir, filename);
    }

    /**
     * Возвращает File для файла Minecraft по имени.
     * @return null если файл не существует или находится вне директории
     */
    public File getMinecraftFile(String filename) {
        return getSafeFile(minecraftDir, filename);
    }

    private File getSafeFile(String baseDir, String filename) {
        // Защита от path traversal
        File file = new File(baseDir, filename);
        try {
            String canonicalBase = new File(baseDir).getCanonicalPath();
            String canonicalFile = file.getCanonicalPath();
            if (!canonicalFile.startsWith(canonicalBase)) {
                return null; // Попытка выйти за пределы директории
            }
        } catch (Exception e) {
            return null;
        }
        return file.exists() ? file : null;
    }

    private List<String> getFileNames(File dir) {
        List<String> names = new ArrayList<>();
        File[] files = dir.listFiles();
        if (files != null) {
            for (File file : files) {
                if (file.isFile()) {
                    names.add(file.getName());
                }
            }
        }
        return names;
    }
}
