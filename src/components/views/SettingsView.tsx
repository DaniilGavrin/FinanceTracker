"use client";

import { useState } from "react";
import { getDatabase } from "@/lib/database";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PermissionChecker } from "../PermissionChecker";
import { CollapsibleSection } from "../CollapsibleSection";
import { useStorageInfo } from "@/hooks/useStorageInfo";
import { useDeviceInfo } from "@/hooks/useDeviceInfo";

export function SettingsView() {
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);
  const storageInfo = useStorageInfo();
  const deviceInfo = useDeviceInfo();

  const handleClearAllData = async () => {
    try {
      const db = getDatabase();
      await db.importData(JSON.stringify({ accounts: [], debts: [], transactions: [] }));
      window.location.reload();
    } catch (error) {
      console.error("Ошибка очистки данных:", error);
      alert("Не удалось очистить данные. Попробуйте ещё раз.");
    }
  };

  const getStatusColor = (status: "success" | "warning" | "error") => {
    switch (status) {
      case "success":
        return "text-green-500";
      case "warning":
        return "text-yellow-500";
      case "error":
        return "text-red-500";
    }
  };

  const getStatusIcon = (status: "success" | "warning" | "error") => {
    switch (status) {
      case "success":
        return "✅";
      case "warning":
        return "⚠️";
      case "error":
        return "❌";
    }
  };

  const getOverallStorageStatus = (): "success" | "warning" | "error" | "neutral" => {
    if (!storageInfo) return "neutral";
    
    if (storageInfo.storageHealthStatus === "error" || storageInfo.writeStatus === "error") {
      return "error";
    }
    if (storageInfo.storageHealthStatus === "warning" || storageInfo.writeStatus === "warning" || storageInfo.freeSpaceStatus === "warning") {
      return "warning";
    }
    return "success";
  };

  const overallStatus = getOverallStorageStatus();
  const overallStatusText = storageInfo 
    ? overallStatus === "success" 
      ? "Всё в порядке" 
      : overallStatus === "warning" 
        ? "Требует внимания" 
        : "Критическая ситуация"
    : "Загрузка...";

  return (
    <div className="space-y-4 pb-20">
      {/* Панель разрешений */}
      <CollapsibleSection
        title="Разрешения приложения"
        icon="🛡️"
        status="neutral"
        statusText={deviceInfo ? `${deviceInfo.model} • ${deviceInfo.platform.toUpperCase()}` : "Определение устройства..."}
        defaultOpen={false}
      >
        <PermissionChecker showDeviceInfo={false} />
      </CollapsibleSection>

      {/* Панель хранилища */}
      <CollapsibleSection
        title="Хранилище данных"
        icon="💾"
        status={overallStatus === "neutral" ? undefined : overallStatus}
        statusText={overallStatusText}
        defaultOpen={false}
      >
        {storageInfo ? (
          <div className="space-y-4">
            {/* Размер базы данных */}
            <div className="p-3 bg-secondary/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Размер базы данных</span>
                <span className={`text-lg ${getStatusColor(storageInfo.dbSizeStatus)}`}>
                  {getStatusIcon(storageInfo.dbSizeStatus)}
                </span>
              </div>
              <p className={`text-xs ${getStatusColor(storageInfo.dbSizeStatus)}`}>
                {storageInfo.dbSizeText}
              </p>
            </div>

            {/* Свободное место */}
            <div className="p-3 bg-secondary/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Свободное место</span>
                <span className={`text-lg ${getStatusColor(storageInfo.freeSpaceStatus)}`}>
                  {getStatusIcon(storageInfo.freeSpaceStatus)}
                </span>
              </div>
              <p className={`text-xs ${getStatusColor(storageInfo.freeSpaceStatus)}`}>
                {storageInfo.freeSpaceText}
              </p>
            </div>

            {/* Здоровье хранилища */}
            <div className="p-3 bg-secondary/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Здоровье хранилища</span>
                <span className={`text-lg ${getStatusColor(storageInfo.storageHealthStatus)}`}>
                  {getStatusIcon(storageInfo.storageHealthStatus)}
                </span>
              </div>
              <p className={`text-xs ${getStatusColor(storageInfo.storageHealthStatus)}`}>
                {storageInfo.storageHealthText}
              </p>
            </div>

            {/* Статус записи */}
            <div className="p-3 bg-secondary/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Статус записи в БД</span>
                <span className={`text-lg ${getStatusColor(storageInfo.writeStatus)}`}>
                  {getStatusIcon(storageInfo.writeStatus)}
                </span>
              </div>
              <p className={`text-xs ${getStatusColor(storageInfo.writeStatus)}`}>
                {storageInfo.writeStatusText}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="animate-spin text-2xl mb-2">⏳</div>
            <p className="text-sm text-muted-foreground">Загрузка информации о хранилище...</p>
          </div>
        )}
      </CollapsibleSection>

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
        <p>Finance Tracker v0.3.0</p>
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