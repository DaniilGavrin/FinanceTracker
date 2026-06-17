"use client";

import { useState, useEffect } from "react";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Camera } from "@capacitor/camera";
import { Network } from "@capacitor/network";
import { BleClient } from "@capacitor-community/bluetooth-le";
import { App } from "@capacitor/app";

type Status = "checking" | "granted" | "denied" | "prompt" | "unavailable" | "available";

interface PermissionCheck {
  name: string;
  description: string;
  status: Status;
  detail?: string;
  action?: () => void;
}

interface Props {
  showDeviceInfo?: boolean;
}

export function PermissionChecker({ showDeviceInfo = true }: Props) {
  const [checks, setChecks] = useState<PermissionCheck[]>([]);

  useEffect(() => {
    const runChecks = async () => {
      const newChecks: PermissionCheck[] = [];

      // 1. Уведомления
      try {
        const notifResult = await LocalNotifications.checkPermissions();
        const notifStatus: Status =
          notifResult.display === "granted" ? "granted" :
          notifResult.display === "denied" ? "denied" : "prompt";

        newChecks.push({
          name: "Уведомления",
          description: "Для напоминаний о платежах по кредитам",
          status: notifStatus,
          action: notifStatus === "prompt" ? async () => {
            await LocalNotifications.requestPermissions();
            runChecks();
          } : notifStatus === "denied" ? async () => {
            await App.getInfo();
            alert("Откройте: Настройки → Приложения → Finance Tracker → Уведомления");
          } : undefined,
        });
      } catch (e) {
        newChecks.push({
          name: "Уведомления",
          description: "Для напоминаний о платежах",
          status: "unavailable",
        });
      }

      // 2. Камера
      try {
        const camResult = await Camera.checkPermissions() as any;
        const camPermission = camResult.camera || "prompt";
        const camStatus: Status =
          camPermission === "granted" ? "granted" :
          camPermission === "denied" ? "denied" : "prompt";

        newChecks.push({
          name: "Камера",
          description: "Для сканирования QR-кодов при синхронизации",
          status: camStatus,
          action: camStatus === "prompt" ? async () => {
            await Camera.requestPermissions();
            runChecks();
          } : camStatus === "denied" ? async () => {
            alert("Откройте: Настройки → Приложения → Finance Tracker → Разрешения → Камера");
          } : undefined,
        });
      } catch (e) {
        newChecks.push({
          name: "Камера",
          description: "Для сканирования QR-кодов",
          status: "unavailable",
        });
      }

      // 3. Сеть
      try {
        const networkStatus = await Network.getStatus();
        const isConnected = networkStatus.connected;
        const connectionType = networkStatus.connectionType;

        let typeLabel = "Нет подключения";
        if (isConnected) {
          switch (connectionType) {
            case "wifi":
              typeLabel = "Wi-Fi";
              break;
            case "cellular":
              typeLabel = "Мобильные данные";
              break;
            default:
              typeLabel = connectionType;
          }
        }

        newChecks.push({
          name: "Подключение к сети",
          description: "Для синхронизации данных между устройствами",
          status: isConnected ? "available" : "unavailable",
          detail: typeLabel,
        });
      } catch (e) {
        newChecks.push({
          name: "Подключение к сети",
          description: "Для синхронизации",
          status: "unavailable",
        });
      }

      // 4. Bluetooth
      try {
        await BleClient.initialize();
        const bleEnabled = await BleClient.isEnabled();

        newChecks.push({
          name: "Bluetooth",
          description: "Для прямой синхронизации с устройствами поблизости",
          status: bleEnabled ? "available" : "unavailable",
          detail: bleEnabled ? "Включен" : "Выключен",
          action: !bleEnabled ? async () => {
            alert("Включите Bluetooth в настройках устройства");
          } : undefined,
        });
      } catch (e) {
        newChecks.push({
          name: "Bluetooth",
          description: "Для синхронизации с устройствами",
          status: "unavailable",
          detail: "Не поддерживается",
        });
      }

      setChecks(newChecks);
    };

    runChecks();
  }, []);

  const getStatusIcon = (status: Status) => {
    switch (status) {
      case "granted":
      case "available":
        return <span className="text-green-500 text-lg">✅</span>;
      case "denied":
        return <span className="text-red-500 text-lg">❌</span>;
      case "prompt":
      case "unavailable":
        return <span className="text-yellow-500 text-lg">⚠️</span>;
      case "checking":
        return <span className="animate-spin text-primary">⏳</span>;
      default:
        return <span className="text-muted-foreground text-lg">➖</span>;
    }
  };

  const getActionLabel = (status: Status) => {
    switch (status) {
      case "prompt":
        return "Запросить";
      case "denied":
        return "Инструкция";
      case "unavailable":
        return "Включить";
      default:
        return null;
    }
  };

  return (
    <div className="space-y-3">
      {checks.map((check, idx) => (
        <div key={idx} className="flex items-start justify-between p-3 bg-secondary/50 rounded-lg border border-border">
          <div className="flex-1 pr-4">
            <p className="font-medium text-sm flex items-center gap-2">
              {check.name}
              {getStatusIcon(check.status)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {check.description}
              {check.detail && (
                <span className="ml-1 font-mono text-primary">({check.detail})</span>
              )}
            </p>

            {check.status === "denied" && (
              <p className="text-xs text-destructive mt-2">
                Разрешение заблокировано. Откройте настройки приложения.
              </p>
            )}
          </div>

          {check.action && (
            <button
              onClick={check.action}
              className="btn-primary text-xs px-3 py-1.5 h-fit whitespace-nowrap"
            >
              {getActionLabel(check.status)}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}