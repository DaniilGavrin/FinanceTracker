"use client";
import { useState } from "react";
import { db } from "@/db";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PermissionChecker } from "../PermissionChecker";

export function SettingsView() {
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);

  const handleClearAllData = async () => {
    try {
      await db.delete();
      window.location.reload();
    } catch (error) {
      console.error("Ошибка очистки данных:", error);
      alert("Не удалось очистить данные. Попробуйте ещё раз.");
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Проверка разрешений (работает в Capacitor и Tauri) */}
      <PermissionChecker />

      {/* Управление приложением */}
      <div className="card space-y-3">
        <h3 className="font-semibold">Управление приложением</h3>
        
        <button className="w-full text-left px-4 py-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-sm font-medium">
          🔄 Синхронизация (Скоро)
        </button>

        <button 
          onClick={() => setShowClearAllDialog(true)}
          className="w-full text-left px-4 py-3 rounded-lg bg-destructive/10 hover:bg-destructive/20 transition-colors text-sm font-medium text-destructive"
        >
          🗑️ Полная очистка всех данных
        </button>
      </div>

      <div className="text-center text-xs text-muted-foreground pt-8">
        <p>Finance Tracker v0.2.0</p>
        <p>ByteWizard © 2026</p>
      </div>

      {showClearAllDialog && (
        <ConfirmDialog
          title="Полная очистка данных?"
          message="ВНИМАНИЕ: Это удалит ВСЕ счета, долги и операции безвозвратно. Это действие нельзя отменить."
          onConfirm={handleClearAllData}
          onCancel={() => setShowClearAllDialog(false)}
        />
      )}
    </div>
  );
}