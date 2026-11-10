import { useEffect, useMemo, useState } from "react";
import { api, isDemoMode } from "../services/api";

const MONTH_NAMES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

function Reports() {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`);
  const [sales, setSales] = useState([]);
  const [extraCosts, setExtraCosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const demoMode = isDemoMode();

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      api.get("/api/sales"),
      api.get("/api/extra-costs").catch(() => ({ data: [] })),
    ]).then(([salesResponse, extraCostResponse]) => {
      if (!active) return;
      setSales(Array.isArray(salesResponse.data) ? salesResponse.data : []);
      setExtraCosts(Array.isArray(extraCostResponse.data) ? extraCostResponse.data : []);
      const actualSales = Array.isArray(salesResponse.data) ? salesResponse.data : [];
      const latestMonth = actualSales.map((sale) => {
        const date = new Date(sale.soldAt);
        return Number.isNaN(date.getTime()) ? null : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      }).filter(Boolean).sort().reverse()[0];
      if (latestMonth) setSelectedMonth((current) => actualSales.some((sale) => {
        const date = new Date(sale.soldAt);
        return !Number.isNaN(date.getTime()) && `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}` === current;
      }) ? current : latestMonth);
    }).catch((error) => {
      console.error(error);
      if (active) alert("Não foi possível carregar os dados do relatório.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const monthlySales = useMemo(() => sales.filter((sale) => {
    const date = new Date(sale.soldAt);
    return !Number.isNaN(date.getTime()) && `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}` === selectedMonth;
  }).sort((a, b) => new Date(a.soldAt) - new Date(b.soldAt)), [sales, selectedMonth]);

  const groups = useMemo(() => {
    const grouped = new Map();
    monthlySales.forEach((sale) => {
      const sku = sale.sku || "SEM SKU";
      if (!grouped.has(sku)) grouped.set(sku, { sku, productName: sale.productName || sku, quantity: 0, revenue: 0, productCost: 0, saleExtraCosts: 0, profit: 0 });
      const row = grouped.get(sku);
      const quantity = Number(sale.quantity || 0);
      row.quantity += quantity;
      row.revenue += Number(sale.netAmount ?? sale.grossAmount ?? 0);
      row.productCost += Number(sale.productCost || 0) * quantity;
      row.saleExtraCosts += Number(sale.extraCosts || 0);
      row.profit += Number(sale.profit || 0);
    });
    return [...grouped.values()].sort((a, b) => a.sku.localeCompare(b.sku));
  }, [monthlySales]);

  const totals = useMemo(() => monthlySales.reduce((result, sale) => {
    result.revenue += Number(sale.netAmount ?? sale.grossAmount ?? 0);
    result.productCost += Number(sale.productCost || 0) * Number(sale.quantity || 0);
    result.saleExtraCosts += Number(sale.extraCosts || 0);
    result.fees += Number(sale.marketplaceFee || 0);
    result.shipping += Number(sale.shippingCost || 0);
    result.profit += Number(sale.profit || 0);
    result.units += Number(sale.quantity || 0);
    return result;
  }, { revenue: 0, productCost: 0, saleExtraCosts: 0, fees: 0, shipping: 0, profit: 0, units: 0 }), [monthlySales]);

  const manualExtraCosts = useMemo(() => extraCosts.filter((cost) => cost.active !== false).reduce((sum, cost) => sum + Number(cost.value || 0), 0), [extraCosts]);
  const netProfitAfterManualCosts = totals.profit - manualExtraCosts;
  const totalMonthlyCosts = totals.productCost + totals.saleExtraCosts + manualExtraCosts + totals.fees + totals.shipping;
  const firstSale = monthlySales[0]?.soldAt;
  const lastSale = monthlySales[monthlySales.length - 1]?.soldAt;
  const money = (value) => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const dateTime = (value) => value ? new Date(value).toLocaleString("pt-BR") : "—";

  async function downloadMonthly() {
    if (!monthlySales.length) {
      alert("Não há vendas no mês selecionado para gerar o fechamento.");
      return;
    }
    setDownloading(true);
    try {
      let blob;
      if (demoMode) {
        blob = createMonthlyCsv();
      } else {
        const [year, month] = selectedMonth.split("-");
        const response = await api.get(`/api/sales/report?year=${year}&month=${Number(month)}`, { responseType: "blob" });
        const isExcel = response.data instanceof Blob && response.data.size > 0 && response.data.type !== "application/json";
        blob = isExcel ? response.data : createMonthlyCsv();
      }
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `fechamento-${selectedMonth}.${demoMode ? "csv" : "xlsx"}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("Erro ao gerar o fechamento mensal. Tente novamente.");
    } finally {
      setDownloading(false);
    }
  }

  function createMonthlyCsv() {
    const rows = [
      ["FECHAMENTO MENSAL", selectedMonth],
      ["Primeira venda", dateTime(firstSale), "Última venda", dateTime(lastSale)],
      [],
      ["RESUMO DO MÊS", "Valor"],
      ["Faturamento líquido", totals.revenue],
      ["Custo dos produtos vendidos", totals.productCost],
      ["Custos extras por venda", totals.saleExtraCosts],
      ["Custos extras manuais cadastrados", manualExtraCosts],
      ["Custo total do mês (produtos, extras, taxas e frete)", totalMonthlyCosts],
      ["Taxas de marketplace", totals.fees],
      ["Frete", totals.shipping],
      ["Lucro registrado nas vendas", totals.profit],
      ["Lucro após custos extras manuais", netProfitAfterManualCosts],
      ["Unidades vendidas", totals.units],
      ["Quantidade de vendas", monthlySales.length],
      [],
      ["FECHAMENTO POR SKU", "SKU", "Unidades vendidas", "Custo unitário médio", "Custo total dos produtos", "Custos extras das vendas", "Faturamento", "Lucro"],
      ...groups.map((group) => [group.productName, group.sku, group.quantity, group.quantity ? group.productCost / group.quantity : 0, group.productCost, group.saleExtraCosts, group.revenue, group.profit]),
      ["TOTAL POR SKU", "", totals.units, totals.units ? totals.productCost / totals.units : 0, totals.productCost, totals.saleExtraCosts, totals.revenue, totals.profit],
      [],
      ["CUSTOS EXTRAS MANUAIS", "Valor"],
      ...extraCosts.filter((cost) => cost.active !== false).map((cost) => [cost.name, Number(cost.value || 0)]),
      ["Total custos extras manuais", manualExtraCosts],
      [],
      ["VENDAS DETALHADAS", "Data", "Marketplace", "Pedido", "Produto", "SKU", "Unidades", "Custo unitário", "Custo total", "Custos extras", "Faturamento", "Taxas", "Frete", "Lucro"],
      ...monthlySales.map((sale) => [dateTime(sale.soldAt), sale.marketplace || "", sale.orderId || "", sale.productName || "", sale.sku || "", Number(sale.quantity || 0), Number(sale.productCost || 0), Number(sale.productCost || 0) * Number(sale.quantity || 0), Number(sale.extraCosts || 0), Number(sale.netAmount ?? sale.grossAmount ?? 0), Number(sale.marketplaceFee || 0), Number(sale.shippingCost || 0), Number(sale.profit || 0)]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(";")).join("\r\n");
    return new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Fechamento mensal</h1>
        <p className="mt-2 text-slate-400">Análise de vendas, custos e lucro por SKU para gestão do negócio.</p>
      </div>

      <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <label className="text-sm font-medium text-slate-300">Mês do fechamento
            <input type="month" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} className="mt-2 block rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white" />
          </label>
          <button onClick={downloadMonthly} disabled={loading || downloading || monthlySales.length === 0} className="rounded-xl bg-green-600 px-5 py-3 font-semibold transition hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50">
            {downloading ? "Gerando arquivo..." : demoMode ? "Baixar fechamento mensal (CSV)" : "Baixar fechamento mensal (Excel)"}
          </button>
        </div>
        {demoMode && <p className="mt-3 text-xs text-cyan-300">No modo demonstração, o fechamento é baixado como CSV, compatível com Excel.</p>}
      </section>

      {loading ? <p className="py-8 text-center text-slate-400">Carregando vendas...</p> : monthlySales.length === 0 ? <p className="rounded-xl bg-slate-900 p-6 text-slate-400">Não há vendas registradas em {MONTH_NAMES[Number(selectedMonth.slice(5, 7)) - 1]} de {selectedMonth.slice(0, 4)}.</p> : <>
        <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[ ["Primeira venda", dateTime(firstSale)], ["Última venda", dateTime(lastSale)], ["Unidades vendidas", totals.units], ["SKUs vendidos", groups.length], ["Faturamento líquido", money(totals.revenue)], ["Custo dos produtos", money(totals.productCost)], ["Custo total do mês", money(totalMonthlyCosts)], ["Custos extras manuais", money(manualExtraCosts)], ["Lucro registrado", money(totals.profit)], ["Lucro após custos manuais", money(netProfitAfterManualCosts)] ].map(([label, value]) => <div key={label} className="rounded-xl border border-slate-800 bg-slate-900 p-4"><p className="text-xs text-slate-400">{label}</p><p className="mt-1 text-lg font-bold text-white">{value}</p></div>)}
        </section>

        <section className="mb-6 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
          <div className="p-5"><h2 className="text-xl font-bold">Fechamento por SKU</h2><p className="mt-1 text-sm text-slate-400">Vendas agrupadas por SKU, com o custo unitário médio ponderado.</p></div>
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-800 text-xs uppercase text-slate-300"><tr>{["Produto", "SKU", "Unidades", "Custo unitário médio", "Custo total", "Faturamento", "Lucro"].map((heading) => <th key={heading} className="px-4 py-3">{heading}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-800">{groups.map((group) => <tr key={group.sku}><td className="px-4 py-3 font-medium">{group.productName}</td><td className="px-4 py-3 font-mono text-xs">{group.sku}</td><td className="px-4 py-3">{group.quantity}</td><td className="px-4 py-3">{money(group.quantity ? group.productCost / group.quantity : 0)}</td><td className="px-4 py-3">{money(group.productCost)}</td><td className="px-4 py-3">{money(group.revenue)}</td><td className="px-4 py-3 font-semibold text-green-400">{money(group.profit)}</td></tr>)}</tbody>
            <tfoot className="bg-slate-800/70 font-bold"><tr><td className="px-4 py-3" colSpan="2">Total do mês</td><td className="px-4 py-3">{totals.units}</td><td className="px-4 py-3">{money(totals.units ? totals.productCost / totals.units : 0)}</td><td className="px-4 py-3">{money(totals.productCost)}</td><td className="px-4 py-3">{money(totals.revenue)}</td><td className="px-4 py-3 text-green-400">{money(totals.profit)}</td></tr></tfoot>
          </table>
        </section>

        <section className="mb-6 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
          <div className="p-5"><h2 className="text-xl font-bold">Custos extras manuais</h2><p className="mt-1 text-sm text-slate-400">Custos cadastrados manualmente que não estão associados a uma venda específica.</p></div>
          <table className="w-full text-left text-sm"><thead className="bg-slate-800 text-slate-300"><tr><th className="px-4 py-3">Descrição</th><th className="px-4 py-3">Valor</th></tr></thead><tbody className="divide-y divide-slate-800">{extraCosts.filter((cost) => cost.active !== false).map((cost) => <tr key={cost.id}><td className="px-4 py-3">{cost.name}</td><td className="px-4 py-3">{money(cost.value)}</td></tr>)}</tbody><tfoot className="bg-slate-800/70 font-bold"><tr><td className="px-4 py-3">Total dos custos extras</td><td className="px-4 py-3">{money(manualExtraCosts)}</td></tr></tfoot></table>
        </section>

        <section className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
          <div className="p-5"><h2 className="text-xl font-bold">Vendas do mês</h2><p className="mt-1 text-sm text-slate-400">{monthlySales.length} registros de venda, da primeira à última data do período.</p></div>
          <table className="w-full min-w-[1150px] text-left text-sm"><thead className="bg-slate-800 text-xs uppercase text-slate-300"><tr>{["Data", "Marketplace", "Pedido", "Produto", "SKU", "Unid.", "Custo unitário", "Custo total", "Faturamento", "Taxas", "Frete", "Lucro"].map((heading) => <th key={heading} className="px-3 py-3">{heading}</th>)}</tr></thead><tbody className="divide-y divide-slate-800">{monthlySales.map((sale, index) => <tr key={sale.id || `${sale.orderId}-${sale.sku}-${index}`}><td className="whitespace-nowrap px-3 py-3">{dateTime(sale.soldAt)}</td><td className="px-3 py-3">{sale.marketplace || "—"}</td><td className="px-3 py-3">{sale.orderId || "—"}</td><td className="px-3 py-3">{sale.productName || "—"}</td><td className="px-3 py-3 font-mono text-xs">{sale.sku || "—"}</td><td className="px-3 py-3">{sale.quantity || 0}</td><td className="px-3 py-3">{money(sale.productCost)}</td><td className="px-3 py-3">{money(Number(sale.productCost || 0) * Number(sale.quantity || 0))}</td><td className="px-3 py-3">{money(sale.netAmount ?? sale.grossAmount)}</td><td className="px-3 py-3">{money(sale.marketplaceFee)}</td><td className="px-3 py-3">{money(sale.shippingCost)}</td><td className="px-3 py-3 font-semibold text-green-400">{money(sale.profit)}</td></tr>)}</tbody></table>
        </section>
      </>}
    </div>
  );
}

export default Reports;
