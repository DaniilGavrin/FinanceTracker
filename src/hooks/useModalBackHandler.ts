"use client";

import { useEffect } from "react";

/**
 * Хук для обработки аппаратной кнопки "Назад" на Android.
 * При монтировании добавляет запись в историю браузера,
 * при нажатии "Назад" вызывает onClose.
 */
export function useModalBackHandler(onClose: () => void, isOpen: boolean = true) {
  useEffect(() => {
    if (!isOpen) return;

    // Добавляем запись в историю, чтобы кнопка "Назад" сработала
    const stateKey = `modal-${Date.now()}`;
    window.history.pushState({ modal: stateKey }, "");

    const handlePopState = () => {
      onClose();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      // Если модалка закрылась не через "Назад" — убираем запись из истории
      if (window.history.state?.modal === stateKey) {
        window.history.back();
      }
    };
  }, [isOpen, onClose]);
}