"use client";
import { useState, useEffect } from "react";
import { db } from "@/db";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export function SettingsView() {
  const [storageInfo, setStorageInfo] = useState<{ usage: string; quota: string; percent: number } | null>(null);
  const [showClearCacheDialog, setShowClearCacheDialog] = useState(false);
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);

  useEffect(() => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then(estimate => {
        if (estimate.usage !== undefined && estimate.quota !== undefined) {
          const usageMB = (estimate.usage / 1024 / 1024).toFixed(2);
          const quotaMB = (estimate.quota / 1024 / 1024).toFixed(2);
          const percent = ((estimate.usage / estimate.quota) * 100).toFixed(3);
          setStorageInfo({ 
            usage: `${usageMB} МБ`, 
            quota: `${quotaMB} МБ`,
            percent: parseFloat(percent)
          });
        }
      });
    }
  }, []);

  const handleClearAllData = async () => {
    try {
      await db.delete();
      window.location.reload();
    } catch (error) {
      console.error("Ошибка очистки данных:", error);
      alert("Не удалось очистить данные. Попробуйте ещё раз.");
    }
  };

  const handleClearCache = async () => {
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(key => caches.delete(key)));
      }
      window.location.reload();
    } catch (error) {
      console.error("Ошибка очистки кэша:", error);
      alert("Не удалось очистить кэш. Попробуйте ещё раз.");
    }
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="card">
        <h3 className="font-semibold mb-3">Локальное хранилище</h3>
        {storageInfo ? (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Использовано: <span className="text-foreground font-mono">{storageInfo.usage}</span></p>
              <p>Квота браузера: <span className="text-foreground font-mono">{storageInfo.quota}</span></p>
            </div>
            
            {/* Прогресс-бар */}
            <div className="space-y-1">
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all"
                  style={{ width: `${storageInfo.percent}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-right">
                {storageInfo.percent}% от квоты
              </p>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              💡 Квота — это лимит, который браузер выделил для нашего приложения. 
              Она не связана с памятью вашего устройства. При достижении лимита браузер может автоматически очистить старые данные.
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Загрузка информации...</p>
        )}
      </div>

      <div className="card space-y-3">
        <h3 className="font-semibold">Управление приложением</h3>
        
        <button className="w-full text-left px-4 py-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-sm font-medium">
          🔄 Принудительная синхронизация (Скоро)
        </button>
        
        <button 
          onClick={() => setShowClearCacheDialog(true)}
          className="w-full text-left px-4 py-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-sm font-medium text-yellow-500"
        >
          🧹 Очистить кэш и пересобрать PWA
        </button>

        <button 
          onClick={() => setShowClearAllDialog(true)}
          className="w-full text-left px-4 py-3 rounded-lg bg-destructive/10 hover:bg-destructive/20 transition-colors text-sm font-medium text-destructive"
        >
          🗑️ Полная очистка всех данных
        </button>
      </div>

      <div className="text-center text-xs text-muted-foreground pt-8">
        <p>Finance Tracker v0.1.0</p>
        <p>ByteWizard © 2026</p>
      </div>

      {showClearCacheDialog && (
        <ConfirmDialog
          title="Очистить кэш?"
          message="Это очистит кэш приложения и перезагрузит страницу. Ваши данные (счета, долги, операции) не пострадают."
          onConfirm={handleClearCache}
          onCancel={() => setShowClearCacheDialog(false)}
        />
      )}

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