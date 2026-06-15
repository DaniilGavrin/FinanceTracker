"use client";
import { useEffect, useState } from "react";

interface PersistentStorageStatus {
  isPersisted: boolean | null; // null = еще не проверили, true/false = результат
  isSupported: boolean;
}

export function usePersistentStorage(): PersistentStorageStatus {
  const [status, setStatus] = useState<PersistentStorageStatus>({
    isPersisted: null,
    isSupported: false,
  });

  useEffect(() => {
    // Проверяем поддержку API
    if (!('storage' in navigator) || !('persist' in navigator.storage)) {
      setStatus({ isPersisted: false, isSupported: false });
      return;
    }

    // Проверяем и запрашиваем persistent storage
    const checkPersistence = async () => {
      try {
        const isPersisted = await navigator.storage.persisted();
        
        if (!isPersisted) {
          // Если еще не persistent — запрашиваем
          const granted = await navigator.storage.persist();
          setStatus({ isPersisted: granted, isSupported: true });
        } else {
          setStatus({ isPersisted: true, isSupported: true });
        }
      } catch (error) {
        console.error('Ошибка проверки persistent storage:', error);
        setStatus({ isPersisted: false, isSupported: true });
      }
    };

    checkPersistence();
  }, []);

  return status;
}