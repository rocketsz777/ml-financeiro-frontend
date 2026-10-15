const makeSale = (id, product, day, quantity, unitPrice, marketplace) => {
    const productCost = product.costPrice;
    const totalPrice = Number((unitPrice * quantity).toFixed(2));
    const totalCost = Number((productCost * quantity).toFixed(2));

    return {
        id,
        orderId: `DEMO-${String(id).padStart(5, "0")}`,
        productName: product.name,
        sku: product.sku,
        marketplace,
        quantity,
        totalPrice,
        netAmount: totalPrice,
        cost: totalCost,
        productCost,
        profit: Number((totalPrice - totalCost).toFixed(2)),
        marketplaceItemId: product.mlItemId,
        soldAt: new Date(2026, 9, day, 10 + (id % 8), 15).toISOString(),
    };
};

export const mockProdutos = [
    { id: 1, sku: "CA777", name: "Calota Audi 5 pontas", mlItemId: "MLB123456", stock: 15, unitCost: 16, costPrice: 16, oldCostPrice: 12 },
    { id: 2, sku: "PP777", name: "Puxador Passageiro Golf", mlItemId: "MLB654321", stock: 8, unitCost: 25, costPrice: 25, oldCostPrice: 20 },
    { id: 3, sku: "BARFP777", name: "Kit Botões Ar Condicionado Preto Ford Focus", mlItemId: "MLB234567", stock: 22, unitCost: 20, costPrice: 20, oldCostPrice: 18 },
    { id: 4, sku: "FARONIX", name: "Farol de Milha Onix 2017 a 2020", mlItemId: "MLB345678", stock: 11, unitCost: 68, costPrice: 68, oldCostPrice: 60 },
    { id: 5, sku: "RETROHB20", name: "Retrovisor HB20 com controle", mlItemId: "MLB456789", stock: 7, unitCost: 82, costPrice: 82, oldCostPrice: 75 },
    { id: 6, sku: "TAPETEFOX", name: "Jogo de Tapetes Ford New Fiesta", mlItemId: "MLB567890", stock: 18, unitCost: 39.5, costPrice: 39.5, oldCostPrice: 35 },
    { id: 7, sku: "LANTCOR", name: "Lanterna Traseira Corolla 2015", mlItemId: "MLB678901", stock: 5, unitCost: 115, costPrice: 115, oldCostPrice: 105 },
    { id: 8, sku: "SENSORVW", name: "Sensor de Estacionamento Volkswagen", mlItemId: "MLB789012", stock: 26, unitCost: 32, costPrice: 32, oldCostPrice: 28 },
    { id: 9, sku: "MOLDCRV", name: "Moldura Central Honda Civic", mlItemId: "MLB890123", stock: 9, unitCost: 47, costPrice: 47, oldCostPrice: 42 },
    { id: 10, sku: "COXIMGM", name: "Coxim do Motor Chevrolet Onix", mlItemId: "MLB901234", stock: 13, unitCost: 54, costPrice: 54, oldCostPrice: 49 },
    { id: 11, sku: "MAÇANETA", name: "Maçaneta Externa Fiat Palio", mlItemId: "MLB112233", stock: 20, unitCost: 22, costPrice: 22, oldCostPrice: 19 },
    { id: 12, sku: "GRADEGOL", name: "Grade Dianteira Volkswagen Gol", mlItemId: "MLB223344", stock: 6, unitCost: 73, costPrice: 73, oldCostPrice: 65 },
];

const normalizedProducts = mockProdutos.map((product) => ({
    ...product,
    stockQuantity: product.stock,
    marketplace: "MERCADO_LIVRE",
}));

const salePlan = [
    [3, 15, 2, 79.9, "MERCADO_LIVRE"], [1, 15, 1, 39.9, "SHOPEE"],
    [4, 14, 1, 119.9, "MERCADO_LIVRE"], [8, 14, 2, 59.9, "SHOPEE"],
    [2, 13, 1, 49.9, "MERCADO_LIVRE"], [6, 13, 1, 89.9, "SHOPEE"],
    [5, 12, 1, 149.9, "MERCADO_LIVRE"], [10, 12, 2, 94.9, "MERCADO_LIVRE"],
    [7, 11, 1, 189.9, "SHOPEE"], [11, 11, 3, 49.9, "MERCADO_LIVRE"],
    [9, 10, 1, 84.9, "SHOPEE"], [12, 10, 1, 119.9, "MERCADO_LIVRE"],
    [3, 9, 1, 79.9, "SHOPEE"], [1, 8, 2, 39.9, "MERCADO_LIVRE"],
    [4, 7, 1, 119.9, "SHOPEE"], [8, 6, 1, 59.9, "MERCADO_LIVRE"],
    [2, 5, 2, 49.9, "SHOPEE"], [6, 4, 1, 89.9, "MERCADO_LIVRE"],
    [5, 3, 1, 149.9, "SHOPEE"], [10, 2, 1, 94.9, "MERCADO_LIVRE"],
    [7, 1, 1, 189.9, "MERCADO_LIVRE"], [11, 1, 2, 49.9, "SHOPEE"],
];

export const mockVendas = salePlan.map(([productId, day, quantity, price, marketplace], index) => {
    const product = mockProdutos.find((item) => item.id === productId);
    return makeSale(index + 1, product, day, quantity, price, marketplace);
});

export const mockDashboard = {
    faturamento: mockVendas.reduce((sum, sale) => sum + sale.netAmount, 0),
    custos: mockVendas.reduce((sum, sale) => sum + sale.cost, 0),
    lucro: mockVendas.reduce((sum, sale) => sum + sale.profit, 0),
    vendasCount: new Set(mockVendas.map((sale) => sale.orderId)).size,
};

const normalizedSales = mockVendas.map((sale) => ({
    ...sale,
    productCost: sale.productCost,
    marketplaceItemId: sale.marketplaceItemId ?? "",
}));

const summarizeSales = (sales) => {
    const result = {
        totalRevenue: 0,
        totalCost: 0,
        totalProfit: 0,
        salesCount: 0,
        unitsSold: 0,
        totalExtraCosts: 0,
        topSellingItems: {},
        productCostBreakdown: {},
        topProfitableItems: {},
    };
    const orders = new Set();

    sales.forEach((sale) => {
        const name = sale.productName;
        const quantity = Number(sale.quantity || 0);
        const cost = Number(sale.productCost || 0) * quantity;
        result.totalRevenue += Number(sale.netAmount || 0);
        result.totalCost += cost;
        result.totalProfit += Number(sale.profit || 0);
        result.unitsSold += quantity;
        orders.add(sale.orderId);
        result.topSellingItems[name] = (result.topSellingItems[name] || 0) + quantity;
        result.productCostBreakdown[name] = (result.productCostBreakdown[name] || 0) + cost;
        result.topProfitableItems[name] = (result.topProfitableItems[name] || 0) + Number(sale.profit || 0);
    });

    result.salesCount = orders.size;
    return result;
};

export const mockData = {
    dashboard: {
        ...mockDashboard,
        ...summarizeSales(normalizedSales),
        period: "MONTH",
    },
    products: normalizedProducts,
    sales: normalizedSales,
    reports: {},
};
