"use client";
import { useEffect, useRef } from "react";

/**
 * Хук для обработки аппаратной кнопки "Назад" на Android.
 * При монтировании добавляет запись в историю браузера,
 * при нажатии "Назад" вызывает onClose.
 */
export function useModalBackHandler(onClose: () => void, isOpen: boolean = true) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  
  // Флаг чтобы отличать закрытие через popstate от закрытия через onClose()
  const closedViaPopStateRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;
    
    closedViaPopStateRef.current = false;
    const stateKey = `modal-${Date.now()}`;
    window.history.pushState({ modal: stateKey }, "");
    
    const handlePopState = () => {
      closedViaPopStateRef.current = true;
      onCloseRef.current();
    };
    
    window.addEventListener("popstate", handlePopState);
    
    return () => {
      window.removeEventListener("popstate", handlePopState);
      
      // Если модалка закрылась НЕ через кнопку "Назад" (т.е. через onClose()),
      // то убираем запись из истории, но только если state ещё наш
      if (!closedViaPopStateRef.current && window.history.state?.modal === stateKey) {
        // Используем setTimeout чтобы избежать race condition с другими модалками
        setTimeout(() => {
          if (window.history.state?.modal === stateKey) {
            window.history.back();
          }
        }, 0);
      }
    };
  }, [isOpen]);
}