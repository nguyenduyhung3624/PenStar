"use client";

import { App as AntdApp, ConfigProvider, theme as antdTheme } from "antd";
import vi from "antd/locale/vi_VN";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
dayjs.locale("vi");

export const AppThemeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);
  const [componentSize, setComponentSize] = useState<"small" | "middle">(
    "small"
  );

  useEffect(() => {
    const MD_WIDTH = 768;
    const calc = () => {
      const w = typeof window !== "undefined" ? window.innerWidth : 0;
      setComponentSize(w <= MD_WIDTH ? "small" : "middle");
    };

    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  return (
    <ConfigProvider
      locale={vi}
      input={{
        autoComplete: "off",
      }}
      componentSize={componentSize}
      theme={{
        token: {
          colorPrimary: "#fadb14",
          colorInfo: "#fadb14",
          wireframe: false,
        },
        algorithm: [antdTheme.compactAlgorithm, antdTheme.defaultAlgorithm],
      }}
    >
      <div suppressHydrationWarning>
        {mounted ? <AntdApp>{children}</AntdApp> : <div className="ant-app" />}
      </div>
    </ConfigProvider>
  );
};
