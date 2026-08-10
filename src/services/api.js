import axios from "axios";
import { mockData } from "../data/mockData";

export const api = axios.create({
  baseURL: "https://rocket-imports-api.onrender.com",
});

api.interceptors.request.use((config) => {
  const isMock = import.meta.env.VITE_USE_MOCK === "true";

  if (isMock) {
    let mockResponseData = null;
    const url = config.url;

    if (url.includes("/api/sales") || url.includes("/vendas")) {
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