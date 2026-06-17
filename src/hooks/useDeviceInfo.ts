"use client";

import { useState, useEffect } from "react";
import { Device } from "@capacitor/device";

export interface DeviceInfo {
  model: string;
  platform: string;
  operatingSystem: string;
  osVersion: string;
}

export function useDeviceInfo(): DeviceInfo | null {
  const [info, setInfo] = useState<DeviceInfo | null>(null);

  useEffect(() => {
    const getDevice = async () => {
      try {
        const deviceInfo = await Device.getInfo();
        setInfo({
          model: deviceInfo.model || "Unknown",
          platform: deviceInfo.platform || "unknown",
          operatingSystem: deviceInfo.operatingSystem || "unknown",
          osVersion: deviceInfo.osVersion || "unknown",
        });
      } catch (error) {
        console.error("Ошибка получения информации об устройстве:", error);
      }
    };

    getDevice();
  }, []);

  return info;
}