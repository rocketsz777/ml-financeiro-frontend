import axios from "axios";
import { mockData, mockVendas } from "../data/mockData";

export const api = axios.create({
  baseURL: "https://rocket-imports-api.onrender.com",
});

export const isDemoMode = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const hasDemoParam = urlParams.get("demo") === "true";
  const disablesDemoParam = urlParams.get("demo") === "false";
  const hasMockEnv = import.meta.env.VITE_USE_MOCK === "true";
  const isVercelDeployment = window.location.hostname.endsWith(".vercel.app");

  if (isVercelDeployment || hasMockEnv) return true;
  return hasDemoParam && !disablesDemoParam;
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
    } else if (url.includes("/api/dashboard")) {
      const params = new URLSearchParams(url.split("?")[1] || "");
      const period = params.get("period") || "MONTH";
      const marketplace = params.get("marketplace");
      const now = new Date();
      const startOfWeek = new Date(now);
      const weekDay = startOfWeek.getDay() || 7;
      startOfWeek.setDate(startOfWeek.getDate() - weekDay + 1);
      startOfWeek.setHours(0, 0, 0, 0);
      const currentMonth = now.getMonth();
      const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const previousMonthYear = currentMonth === 0 ? now.getFullYear() - 1 : now.getFullYear();
      const filteredSales = mockVendas.filter((sale) => {
        const soldAt = new Date(sale.soldAt);
        if (marketplace && sale.marketplace !== marketplace) return false;
        if (period === "DAY") return soldAt.toDateString() === now.toDateString();
        if (period === "WEEK") return soldAt >= startOfWeek && soldAt <= now;
        if (period === "PREVIOUS_WEEK") {
          const startPreviousWeek = new Date(startOfWeek);
          startPreviousWeek.setDate(startPreviousWeek.getDate() - 7);
          return soldAt >= startPreviousWeek && soldAt < startOfWeek;
        }
        if (period === "MONTH") return soldAt.getMonth() === currentMonth && soldAt.getFullYear() === now.getFullYear();
        if (period === "PREVIOUS_MONTH") return soldAt.getMonth() === previousMonth && soldAt.getFullYear() === previousMonthYear;
        if (period === "YEAR") return soldAt.getFullYear() === now.getFullYear();
        return true;
      });
      const orders = new Set(filteredSales.map((sale) => sale.orderId));
      const summary = filteredSales.reduce((result, sale) => {
        const name = sale.productName;
        const quantity = Number(sale.quantity || 0);
        const cost = Number(sale.productCost || 0) * quantity;
        result.totalRevenue += Number(sale.netAmount || 0);
        result.totalCost += cost;
        result.totalProfit += Number(sale.profit || 0);
        result.unitsSold += quantity;
        result.topSellingItems[name] = (result.topSellingItems[name] || 0) + quantity;
        result.productCostBreakdown[name] = (result.productCostBreakdown[name] || 0) + cost;
        result.topProfitableItems[name] = (result.topProfitableItems[name] || 0) + Number(sale.profit || 0);
        return result;
      }, {
        totalRevenue: 0,
        totalCost: 0,
        totalProfit: 0,
        unitsSold: 0,
        totalExtraCosts: 0,
        topSellingItems: {},
        productCostBreakdown: {},
        topProfitableItems: {},
      });
      mockResponseData = { ...summary, salesCount: orders.size };
    } else if (url.includes("/api/sales") || url.includes("/vendas")) {
      mockResponseData = mockData.sales;
    } else if (url.includes("/api/produtos") || url.includes("/products")) {
      mockResponseData = mockData.products;
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
