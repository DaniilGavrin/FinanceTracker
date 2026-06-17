"use client";

import { useState, useEffect } from "react";
import { Filesystem, Directory } from "@capacitor/filesystem";

export interface StorageStatus {
  dbSize: number;
  freeSpace: number;
  dbSizeStatus: "success" | "warning" | "error";
  freeSpaceStatus: "success" | "warning" | "error";
  storageHealthStatus: "success" | "warning" | "error";
  writeStatus: "success" | "warning" | "error";
  dbSizeText: string;
  freeSpaceText: string;
  storageHealthText: string;
  writeStatusText: string;
}

export function useStorageInfo(): StorageStatus | null {
  const [status, setStatus] = useState<StorageStatus | null>(null);

  useEffect(() => {
    const checkStorage = async () => {
      try {
        // Получаем размер файла БД
        let dbSize = 0;
        try {
          const stat = await Filesystem.stat({
            directory: Directory.Data,
            path: "databases/finance.db",
          });
          dbSize = stat.size || 0;
        } catch (e) {
          console.log("БД ещё не создана или файл не найден");
        }

        // Получаем свободное место через navigator.storage
        let freeSpace = 0;
        if ("storage" in navigator && "estimate" in navigator.storage) {
          const estimate = await navigator.storage.estimate();
          freeSpace = (estimate.quota || 0) - (estimate.usage || 0);
        }

        // Статус размера БД
        let dbSizeStatus: "success" | "warning" | "error" = "success";
        let dbSizeText = "";
        const dbSizeMB = dbSize / (1024 * 1024);
        const dbSizeGB = dbSize / (1024 * 1024 * 1024);

        if (dbSizeGB > 5) {
          dbSizeStatus = "error";
          dbSizeText = `Критически большой размер: ${dbSizeGB.toFixed(2)} ГБ`;
        } else if (dbSizeGB > 1) {
          dbSizeStatus = "warning";
          dbSizeText = `Большой размер: ${dbSizeGB.toFixed(2)} ГБ`;
        } else if (dbSizeMB > 0) {
          dbSizeStatus = "success";
          dbSizeText = `Размер: ${dbSizeMB.toFixed(2)} МБ`;
        } else {
          dbSizeStatus = "success";
          dbSizeText = "База данных пуста или не создана";
        }

        // Статус свободного места
        let freeSpaceStatus: "success" | "warning" | "error" = "success";
        let freeSpaceText = "";
        const freeSpaceGB = freeSpace / (1024 * 1024 * 1024);
        const freeSpaceMB = freeSpace / (1024 * 1024);

        if (freeSpaceMB < 100) {
          freeSpaceStatus = "error";
          freeSpaceText = `Критически мало: ${freeSpaceMB.toFixed(0)} МБ`;
        } else if (freeSpaceGB < 5) {
          freeSpaceStatus = "warning";
          freeSpaceText = `Мало места: ${freeSpaceGB.toFixed(2)} ГБ`;
        } else {
          freeSpaceStatus = "success";
          freeSpaceText = `Достаточно: ${freeSpaceGB.toFixed(2)} ГБ`;
        }

        // Статус здоровья хранилища
        let storageHealthStatus: "success" | "warning" | "error" = "success";
        let storageHealthText = "";
        const difference = freeSpace - dbSize;
        const differenceMB = difference / (1024 * 1024);

        if (differenceMB < 100) {
          storageHealthStatus = "error";
          storageHealthText = `Критически мало места (разница ${differenceMB.toFixed(0)} МБ)`;
        } else if (freeSpaceGB < 5) {
          storageHealthStatus = "warning";
          storageHealthText = `Место может скоро закончиться`;
        } else {
          storageHealthStatus = "success";
          storageHealthText = "Хранилище в хорошем состоянии";
        }

        // Статус записи в БД
        let writeStatus: "success" | "warning" | "error" = "success";
        let writeStatusText = "";

        if (freeSpaceMB < 100) {
          writeStatus = "error";
          writeStatusText = "Критически мало места! Запись может остановиться";
        } else if (freeSpaceMB < 250) {
          writeStatus = "warning";
          writeStatusText = "Внимание: скоро база данных остановится";
        } else {
          writeStatus = "success";
          writeStatusText = "Запись работает нормально";
        }

        setStatus({
          dbSize,
          freeSpace,
          dbSizeStatus,
          freeSpaceStatus,
          storageHealthStatus,
          writeStatus,
          dbSizeText,
          freeSpaceText,
          storageHealthText,
          writeStatusText,
        });
      } catch (error) {
        console.error("Ошибка проверки хранилища:", error);
      }
    };

    checkStorage();
  }, []);

  return status;
}