import axios from "axios";
import { mockData } from "../data/mockData";

export const api = axios.create({
  baseURL: "https://rocket-imports-api.onrender.com",
});

export const isDemoMode = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const hasDemoParam = urlParams.get("demo") === "true";
  const disablesDemoParam = urlParams.get("demo") === "false";
  const hasMockEnv = import.meta.env.VITE_USE_MOCK === "true";
  const isVercelDeployment = window.location.hostname.endsWith(".vercel.app");

  return !disablesDemoParam && (hasDemoParam || hasMockEnv || isVercelDeployment);
};

api.interceptors.request.use((config) => {
  if (isDemoMode()) {
    let mockResponseData = null;
    const url = config.url || "";

    if (url.includes("/health")) {
      mockResponseData = { status: "UP" };
    } else if (url.includes("/api/mercadolivre/status") || url.includes("/shopee/status")) {
      mockResponseData = "DESCONECTADO";
    } else if (url.includes("/api/system/status")) {
      mockResponseData = {
        application: "DEMO",
        database: "FICTICIO",
        mercadoLivre: "DESCONECTADO",
        shopee: "DESCONECTADO",
      };
    } else if (url.includes("/api/import/sales")) {
      mockResponseData = { totalImported: mockData.sales.length };
    } else if (url.includes("/api/sales/report")) {
      mockResponseData = new Blob([], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
    } else if (url.includes("/api/sales") || url.includes("/vendas")) {
      mockResponseData = mockData.sales;
    } else if (url.includes("/api/produtos") || url.includes("/products")) {
      mockResponseData = mockData.products;
    } else if (url.includes("/api/dashboard")) {
      mockResponseData = mockData.dashboard;
    } else if (url.includes("/api/relatorios")) {
      mockResponseData = mockData.reports;
    } else {
      mockResponseData = [];
    }

    config.adapter = () => {
      return Promise.resolve({
        data: mockResponseData,
        status: 200,
        statusText: "OK",
        headers: config.headers,
        config: config,
      });
    };
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});
