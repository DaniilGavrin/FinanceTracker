"use client";

import { useEffect, useRef } from "react";

/**
 * Хук для обработки аппаратной кнопки "Назад" на Android.
 * При монтировании добавляет запись в историю браузера,
 * при нажатии "Назад" вызывает onClose.
 */
export function useModalBackHandler(onClose: () => void, isOpen: boolean = true) {
  // Сохраняем актуальную версию onClose в ref,
  // чтобы не добавлять её в зависимости useEffect
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    const stateKey = `modal-${Date.now()}`;
    window.history.pushState({ modal: stateKey }, "");

    const handlePopState = () => {
      onCloseRef.current();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      // Если модалка закрылась не через "Назад" — убираем запись из истории
      if (window.history.state?.modal === stateKey) {
        window.history.back();
      }
    };
  }, [isOpen]); // ← ТОЛЬКО isOpen, без onClose!
}