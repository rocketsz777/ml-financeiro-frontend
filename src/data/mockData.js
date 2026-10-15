export const mockDashboard = {
    faturamento: 1100.95,
    custos: 489.70,
    lucro: 611.25,
    vendasCount: 20,
};

export const mockProdutos = [
    {
        id: 1,
        sku: "CA777",
        name: "Calota Audi 5 pontas",
        mlItemId: "MLB123456",
        stock: 15,
        unitCost: 16.00,
        costPrice: 16.00,
        oldCostPrice: 0.00
    },
    {
        id: 2,
        sku: "PP777",
        name: "Puxador Passageiro Golf",
        mlItemId: "MLB654321",
        stock: 8,
        unitCost: 25.00,
        costPrice: 25.00,
        oldCostPrice: 20.00
    }
];

export const mockVendas = [
    {
        id: 1,
        orderId: "2020017745550176",
        productName: "Kit Botões Ar Condicionado Preto Ford Focus",
        sku: "BARFP777",
        marketplace: "MERCADO_LIVRE",
        quantity: 1,
        totalPrice: 44.60,
        cost: 20.00,
        profit: 24.60,
        soldAt: "2026-08-04T10:00:00"
    }
];
const normalizedProducts = mockProdutos.map((product) => ({
    ...product,
    stockQuantity: product.stockQuantity ?? product.stock ?? 0,
    costPrice: product.costPrice ?? product.unitCost ?? 0,
    oldCostPrice: product.oldCostPrice ?? 0,
    marketplace: product.marketplace ?? "CADASTRO",
}));

const normalizedSales = mockVendas.map((sale) => ({
    ...sale,
    netAmount: sale.netAmount ?? sale.totalPrice ?? 0,
    productCost: sale.productCost ?? sale.cost ?? 0,
    marketplaceItemId: sale.marketplaceItemId ?? "",
}));

export const mockData = {
    dashboard: {
        ...mockDashboard,
        totalRevenue: mockDashboard.faturamento,
        totalCost: mockDashboard.custos,
        totalProfit: mockDashboard.lucro,
        salesCount: mockDashboard.vendasCount,
        unitsSold: normalizedSales.reduce(
            (total, sale) => total + Number(sale.quantity || 0),
            0
        ),
        totalExtraCosts: 0,
        topSellingItems: normalizedSales.reduce((acc, sale) => {
            acc[sale.productName] = (acc[sale.productName] || 0) + Number(sale.quantity || 0);
            return acc;
        }, {}),
        productCostBreakdown: normalizedSales.reduce((acc, sale) => {
            acc[sale.productName] =
                (acc[sale.productName] || 0) +
                Number(sale.productCost || 0) * Number(sale.quantity || 0);
            return acc;
        }, {}),
        topProfitableItems: normalizedSales.reduce((acc, sale) => {
            acc[sale.productName] = (acc[sale.productName] || 0) + Number(sale.profit || 0);
            return acc;
        }, {}),
    },
    products: normalizedProducts,
    sales: normalizedSales,
    reports: {},
};