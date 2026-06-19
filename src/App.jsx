import { useEffect, useState } from "react"
import { api } from "./services/api";

import {
  Routes,
  Route,
  Link,
  useLocation
} from "react-router-dom"

import {
  Download,
  LayoutDashboard,
  Package,
  Power,
  ReceiptText,
  ShoppingBag,
  Store,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Loader2,
  Calendar,
  ChevronLeft,
  ChevronRight
} from "lucide-react"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts"

import Products from "./pages/Products"
import Reports from "./pages/Reports"
import Sales from "./pages/Sales"

function App() {

  const location = useLocation()

  const [dashboard, setDashboard] = useState(null)
  const [productIds, setProductIds] = useState({})

  const [globalImportRange, setGlobalImportRange] = useState(null)
  const [filteredPeriodRange, setFilteredPeriodRange] = useState(null)

  const [marketplace, setMarketplace] = useState("ALL")
  const [period, setPeriod] = useState("MONTH")

  const [loadingImport, setLoadingImport] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [loadingApp, setLoadingApp] = useState(false)
  const [loadingML, setLoadingML] = useState(false)
  const [loadingShopee, setLoadingShopee] = useState(false)

  const [appReady, setAppReady] = useState(false)
  const [mercadoLivreReady, setMercadoLivreReady] = useState(false)
  const [shopeeReady, setShopeeReady] = useState(false)

  const wakeUpBackend = async () => {
    try {
      setLoadingApp(true)
      await new Promise(resolve => setTimeout(resolve, 600))

      const health = await api.get("/health")
      const isOnline = health.data?.status === "UP"

      setAppReady(isOnline)
      await checkConnections()
      return isOnline
    } catch {
      setAppReady(false)
      return false
    } finally {
      setLoadingApp(false)
    }
  }

  const connectMercadoLivre = async () => {
    try {
      setLoadingML(true)
      const appOnline = await wakeUpBackend()
      if (!appOnline) return

      const response = await api.get("/oauth/mercadolivre/login")
      window.location.href = response.data
    } catch (error) {
      console.error(error)
      setMercadoLivreReady(false)
    } finally {
      setLoadingML(false)
    }
  }

  const connectShopee = async () => {
    try {
      setLoadingShopee(true)
      const appOnline = await wakeUpBackend()
      if (!appOnline) return

      const response = await api.get("/shopee/login")
      window.location.href = response.data
    } catch (error) {
      console.error(error)
      setShopeeReady(false)
    } finally {
      setLoadingShopee(false)
    }
  }

  useEffect(() => {
    setCurrentPage(1)
    loadDashboard()
    checkConnections()
    loadSalesRange()
  }, [marketplace, period])

  function loadDashboard() {
    let url = `/api/dashboard/summary?period=${period}`
    if (marketplace !== "ALL") {
      url += `&marketplace=${marketplace}`
    }

    api
      .get(url)
      .then(response => {
        setDashboard(prev => ({
          ...prev,
          totalExtraCosts: response.data?.totalExtraCosts || prev?.totalExtraCosts || 0
        }))
      })
      .catch(error => {
        console.error(error)
      })
  }

  function loadSalesRange() {
    api
      .get("/api/sales")
      .then(response => {
        const salesData = response.data || []

        const idMap = {}
        salesData.forEach(sale => {
          if (sale.productName) {
            const identificationId = sale.marketplaceItemId || "";
            if (identificationId) {
              idMap[sale.productName] = String(identificationId);
            }
          }
        })
        setProductIds(idMap)

        // 1. IMPORTAÇÃO GLOBAL ABSOLUTA
        const allDates = salesData
          .filter(sale => sale.soldAt)
          .map(sale => new Date(sale.soldAt))
          .filter(d => !isNaN(d.getTime()))
          .sort((a, b) => a.getTime() - b.getTime())

        if (allDates.length > 0) {
          setGlobalImportRange({
            first: allDates[0],
            last: allDates[allDates.length - 1]
          })
        }

        // 2. FILTRAGEM DE PERÍODO LOCAL
        const now = new Date()
        const filteredSales = salesData.filter(sale => {
          if (!sale.soldAt) return false
          if (marketplace !== "ALL" && sale.marketplace !== marketplace) return false

          const targetDate = new Date(sale.soldAt)
          if (isNaN(targetDate.getTime())) return false

          if (period === "DAY") {
            return targetDate.toLocaleDateString("pt-BR") === now.toLocaleDateString("pt-BR")
          }
          if (period === "WEEK") {
            const sevenDaysAgo = new Date()
            sevenDaysAgo.setDate(now.getDate() - 7)
            return targetDate >= sevenDaysAgo && targetDate <= now
          }
          if (period === "PREVIOUS_WEEK") {
            const fourteenDaysAgo = new Date()
            fourteenDaysAgo.setDate(now.getDate() - 14)
            const sevenDaysAgo = new Date()
            sevenDaysAgo.setDate(now.getDate() - 7)
            return targetDate >= fourteenDaysAgo && targetDate < sevenDaysAgo
          }
          if (period === "MONTH") {
            return targetDate.getMonth() === now.getMonth() && targetDate.getFullYear() === now.getFullYear()
          }
          if (period === "PREVIOUS_MONTH") {
            const currentMonth = now.getMonth()
            let expectedMonth = currentMonth - 1
            let expectedYear = now.getFullYear()
            if (expectedMonth < 0) {
              expectedMonth = 11
              expectedYear -= 1
            }
            return targetDate.getMonth() === expectedMonth && targetDate.getFullYear() === expectedYear
          }
          if (period === "YEAR") {
            return targetDate.getFullYear() === now.getFullYear()
          }
          return true
        })

        // 3. ENGENHARIA DE CÁLCULO LOCAL ALINHADO COM SALES.JSX
        let localRevenue = 0
        let localCost = 0
        let localProfit = 0
        const uniqueOrders = new Set()

        const localTopSelling = {}
        const localCostBreakdown = {}
        const localTopProfitable = {}

        filteredSales.forEach((sale, index) => {
          const name = sale.productName || "Item sem nome"
          const qty = Number(sale.quantity || 0)
          const rev = Number(sale.netAmount || 0)
          const cst = Number(sale.productCost || 0) * qty
          const prf = Number(sale.profit || 0)

          localRevenue += rev
          localCost += cst
          localProfit += prf

          // Agrupa por ID do pedido para contar vendas reais e não quantidade de itens
          uniqueOrders.add(sale.orderId || `fallback-${index}`)

          localTopSelling[name] = (localTopSelling[name] || 0) + qty
          localCostBreakdown[name] = (localCostBreakdown[name] || 0) + cst
          localTopProfitable[name] = (localTopProfitable[name] || 0) + prf
        })

        setDashboard(prev => ({
          ...prev,
          totalRevenue: localRevenue,
          totalCost: localCost,
          totalProfit: localProfit,
          unitsSold: uniqueOrders.size, // Conta vendas únicas de forma correta
          topSellingItems: localTopSelling,
          productCostBreakdown: localCostBreakdown,
          topProfitableItems: localTopProfitable,
          totalExtraCosts: prev?.totalExtraCosts || 0
        }))

        const saleDates = filteredSales
          .map(sale => new Date(sale.soldAt))
          .sort((a, b) => a.getTime() - b.getTime())

        if (saleDates.length > 0) {

          console.log(
            "Primeira venda:",
            saleDates[0]
          )

          console.log(
            "Última venda:",
            saleDates[saleDates.length - 1]
          )

          setFilteredPeriodRange({
            first: saleDates[0],
            last: saleDates[saleDates.length - 1]
          })

        } else {

          setFilteredPeriodRange(null)

        }
      })
      .catch(() => {
        setGlobalImportRange(null)
        setFilteredPeriodRange(null)
      })
  }

  async function checkConnections() {
    try {
      const health = await api.get("/health")
      setAppReady(health.data?.status === "UP")
    } catch {
      setAppReady(false)
    }

    try {
      const ml = await api.get("/api/mercadolivre/status")
      setMercadoLivreReady(ml.data === "CONECTADO")
    } catch {
      setMercadoLivreReady(false)
    }

    try {
      const shopee = await api.get("/shopee/status")
      setShopeeReady(shopee.data === "CONECTADO")
    } catch {
      setShopeeReady(false)
    }
  }

  const importSales = async () => {
    try {
      setLoadingImport(true)
      await api.post("/api/import/sales")
      alert("Importação de vendas concluída com sucesso!")
      loadDashboard()
      loadSalesRange()
    } catch (error) {
      console.error(error)
      alert("Erro ao realizar a importação das vendas.")
    } finally {
      setLoadingImport(false)
    }
  }

  const formatCurrency = (value) => {
    return Number(value || 0).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  const formatShortDate = (value) => {
    if (!value) return ""
    const d = new Date(value)
    if (isNaN(d.getTime())) return ""
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit"
    })
  }

  const getDynamicPeriodText = () => {
    if (filteredPeriodRange?.first && filteredPeriodRange?.last) {
      return `${filteredPeriodRange.first.toLocaleDateString("pt-BR")} até ${filteredPeriodRange.last.toLocaleDateString("pt-BR")}`
    }

    const now = new Date()
    const format = (d) => d.toLocaleDateString("pt-BR")

    if (period === "DAY") return `${format(now)} até ${format(now)}`
    if (period === "WEEK") {
      const past = new Date(); past.setDate(now.getDate() - 7)
      return `${format(past)} até ${format(now)}`
    }
    if (period === "PREVIOUS_WEEK") {
      const start = new Date(); start.setDate(now.getDate() - 14)
      const end = new Date(); end.setDate(now.getDate() - 7)
      return `${format(start)} até ${format(end)}`
    }
    if (period === "MONTH") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      return `${format(firstDay)} até ${format(now)}`
    }
    if (period === "PREVIOUS_MONTH") {
      const firstDayPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastDayPrev = new Date(now.getFullYear(), now.getMonth(), 0)
      return `${format(firstDayPrev)} até ${format(lastDayPrev)}`
    }
    if (period === "YEAR") {
      const firstDayYear = new Date(now.getFullYear(), 0, 1)
      return `${format(firstDayYear)} até ${format(now)}`
    }
    return "Sem registros"
  }

  const importRangeText = globalImportRange?.first
    ? `Importação do dia ${formatShortDate(globalImportRange.first)} ao ${formatShortDate(globalImportRange.last)}`
    : "Processando dados..."

  const shortenText = (value, maxLength = 46) => {
    const text = String(value || "")
    if (text.length <= maxLength) return text
    return `${text.slice(0, maxLength)}...`
  }

  const sortedProducts = dashboard?.topSellingItems
    ? Object.entries(dashboard.topSellingItems).sort((a, b) => b[1] - a[1])
    : []

  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage) || 1
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const chartData = [
    { name: "Faturamento", valor: Number(dashboard?.totalRevenue || 0), color: "#22c55e" },
    { name: "Custos", valor: Number(dashboard?.totalCost || 0), color: "#ef4444" },
    { name: "Custos Extras", valor: Number(dashboard?.totalExtraCosts || 0), color: "#f59e0b" },
    { name: "Lucro", valor: Number(dashboard?.totalProfit || 0), color: "#3b82f6" }
  ]

  const pieData = sortedProducts.slice(0, 5).map(([name, quantity]) => ({
    name,
    value: quantity
  }))

  const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#a855f7", "#ef4444"]

  const dashboardPage = (
    <div>
      {/* TOPO */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">Rocket Imports Gestão</p>
        </div>

        <div className="flex flex-col items-start sm:items-end gap-2">
          <div className="flex flex-wrap justify-start sm:justify-end gap-2.5">
            <select
              value={marketplace}
              onChange={(e) => setMarketplace(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-sm"
            >
              <option value="ALL">Todos</option>
              <option value="MERCADO_LIVRE">Marketplace Livre</option>
              <option value="SHOPEE">Shopee</option>
            </select>

            <button
              onClick={() => setPeriod("DAY")}
              className={`px-3 py-1.5 text-sm rounded-xl font-semibold transition ${
                period === "DAY" ? "bg-cyan-600 text-white" : "bg-slate-700 text-slate-200"
              }`}
            >
              Diário
            </button>

            <button
              onClick={() => setPeriod("WEEK")}
              className={`px-3 py-1.5 text-sm rounded-xl font-semibold transition ${
                period === "WEEK" ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-200"
              }`}
            >
              Semanal
            </button>

            <button
              onClick={() => setPeriod("PREVIOUS_WEEK")}
              className={`px-3 py-1.5 text-sm rounded-xl font-semibold transition ${
                period === "PREVIOUS_WEEK" ? "bg-indigo-600 text-white" : "bg-slate-700 text-slate-200"
              }`}
            >
              Semana Passada
            </button>

            <button
              onClick={() => setPeriod("MONTH")}
              className={`px-3 py-1.5 text-sm rounded-xl font-semibold transition ${
                period === "MONTH" ? "bg-green-600 text-white" : "bg-slate-700 text-slate-200"
              }`}
            >
              Mensal
            </button>

            <button
              onClick={() => setPeriod("PREVIOUS_MONTH")}
              className={`px-3 py-1.5 text-sm rounded-xl font-semibold transition ${
                period === "PREVIOUS_MONTH" ? "bg-emerald-600 text-white" : "bg-slate-700 text-slate-200"
              }`}
            >
              Mês Passado
            </button>

            <button
              onClick={() => setPeriod("YEAR")}
              className={`px-3 py-1.5 text-sm rounded-xl font-semibold transition ${
                period === "YEAR" ? "bg-purple-600 text-white" : "bg-slate-700 text-slate-200"
              }`}
            >
              Anual
            </button>

            <button
              onClick={importSales}
              className="bg-orange-500 hover:bg-orange-600 px-3 py-1.5 text-sm rounded-xl font-semibold transition flex items-center gap-1.5"
            >
              <Download size={16} />
              {loadingImport ? "Importando..." : "Importar"}
            </button>
          </div>

          <div className="text-xs text-slate-400 text-left sm:text-right flex items-center gap-1.5 mt-0.5">
            <Calendar size={13} className="text-slate-500" />
            <span>
              Período: {getDynamicPeriodText()}
            </span>
            <span className="text-slate-600 mx-1">|</span>
            <span>{importRangeText}</span>
          </div>
        </div>
      </div>

      {/* KPIS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 p-4 rounded-xl shadow-lg flex justify-between items-start">
          <div>
            <p className="text-xs text-slate-400">Faturamento</p>
            <h2 className="text-2xl font-bold mt-1.5 text-green-400">
              R$ {formatCurrency(dashboard?.totalRevenue)}
            </h2>
          </div>
          <div className="p-2 bg-green-500/10 rounded-full text-green-500 flex-shrink-0">
            <DollarSign size={18} />
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl shadow-lg flex justify-between items-start">
          <div className="space-y-2 w-full">
            <div>
              <p className="text-xs text-slate-400">Custos</p>
              <h2 className="text-2xl font-bold mt-0.5 text-red-500">
                R$ {formatCurrency(dashboard?.totalCost)}
              </h2>
            </div>
            <div>
              <p className="text-xs text-slate-400">Custos Extras</p>
              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                <h2 className="text-2xl font-bold text-amber-500">
                  R$ {formatCurrency(dashboard?.totalExtraCosts)}
                </h2>
              </div>
            </div>
          </div>
          <div className="p-2 bg-red-500/10 rounded-full text-red-500 flex-shrink-0">
            <Package size={18} />
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl shadow-lg flex justify-between items-start">
          <div>
            <p className="text-xs text-slate-400">Lucro</p>
            <h2 className="text-2xl font-bold mt-1.5 text-blue-500">
              R$ {formatCurrency(dashboard?.totalProfit)}
            </h2>
          </div>
          <div className="p-2 bg-blue-500/10 rounded-full text-blue-500 flex-shrink-0">
            <TrendingUp size={18} />
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl shadow-lg flex justify-between items-start">
          <div>
            <p className="text-xs text-slate-400">Vendas</p>
            <h2 className="text-2xl font-bold mt-1.5 text-white">
              {dashboard?.salesCount ?? 0}
            </h2>
          </div>
          <div className="p-2 bg-purple-500/10 rounded-full text-purple-500 flex-shrink-0">
            <ShoppingCart size={18} />
          </div>
        </div>
      </div>

      {/* BLOCO CENTRAL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6 items-start">

        {/* ESQUERDA: Produtos Vendidos */}
        <div className="bg-slate-900 p-5 rounded-xl shadow-lg flex flex-col justify-between min-h-[636px]">
          <div>
            <h2 className="text-lg font-bold mb-4">Produtos Vendidos no Período</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                    <th className="pb-2.5 font-semibold">Produto</th>
                    <th className="pb-2.5 font-semibold text-center">Unidades</th>
                    <th className="pb-2.5 font-semibold text-right">Custo Unit.</th>
                    <th className="pb-2.5 font-semibold text-right">Custo Total</th>
                    <th className="pb-2.5 font-semibold text-right">Lucro Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30 text-xs">
                  {paginatedProducts.length > 0 ? (
                    paginatedProducts.map(([name, quantity], index) => {

                      const totalCostOfItem = dashboard?.productCostBreakdown?.[name] || 0
                      const unitCost = quantity > 0 ? totalCostOfItem / quantity : 0
                      const totalProfitOfItem = dashboard?.topProfitableItems?.[name] || 0
                      const currentSaleId = productIds[name] || ""

                      return (
                        <tr key={index} className="hover:bg-slate-800/20 transition-colors">
                          <td className="py-3 pr-2 text-slate-300 font-medium max-w-[180px]">
                            <div className="flex flex-col">
                              <span className="truncate" title={name}>
                                {shortenText(name, 30)}
                              </span>
                              {currentSaleId && (
                                <span
                                  onClick={() => {
                                    navigator.clipboard.writeText(currentSaleId);
                                  }}
                                  className="text-[10px] text-slate-500 hover:text-slate-400 cursor-pointer mt-0.5 w-max font-mono tracking-wider hover:underline select-none"
                                  title="Clique para copiar"
                                >
                                  {currentSaleId.length > 12 ? `${currentSaleId.slice(0, 10)}...` : currentSaleId}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 text-center font-bold text-white pt-5">
                            {quantity} un
                          </td>
                          <td className="py-3 text-right text-amber-400 font-medium pt-5">
                            R$ {formatCurrency(unitCost)}
                          </td>
                          <td className="py-3 text-right text-red-400 font-semibold pt-5">
                            R$ {formatCurrency(totalCostOfItem)}
                          </td>
                          <td className="py-3 text-right text-blue-400 font-semibold pt-5">
                            R$ {formatCurrency(totalProfitOfItem)}
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-10 text-center text-slate-500 italic">
                        Nenhum produto vendido no período selecionado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-800 text-[11px]">
            <span className="text-slate-400">
              Mostrando {sortedProducts.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, sortedProducts.length)} de {sortedProducts.length} itens
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 transition text-white"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-slate-300 px-2 font-medium">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 transition text-white"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* DIREITA: Coluna de Gráficos */}
        <div className="space-y-4">
          <div className="bg-slate-900 p-5 rounded-xl shadow-lg flex flex-col justify-between min-h-[350px]">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-bold">Distribuição Produtos</h2>
                <h3 className="font-bold text-sm text-slate-300 pr-2">Produtos Mais Vendidos</h3>
              </div>

              <div className="flex gap-4 items-center">
                <div className="w-1/2">
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        labelLine={false}
                        label={({ value }) => value}
                      >
                        {pieData.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="w-1/2">
                  <div className="space-y-3">
                    {sortedProducts.slice(0, 5).map(([name, quantity], index) => (
                      <div key={index} className="flex justify-between border-b border-slate-800/60 pb-1.5">
                        <span className="text-slate-300 text-xs">{shortenText(name, 30)}</span>
                        <span className="font-bold text-green-400 text-xs flex-shrink-0 pl-1">{quantity} un</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 italic">
              Exibindo os 5 produtos com maior quantidade vendida no período.
            </p>
          </div>

          <div className="bg-slate-900 p-5 rounded-xl shadow-lg min-h-[270px] flex flex-col justify-between">
            <h2 className="text-base font-bold mb-3">Performance Financeira</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: '11px' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '11px' }} />
                <Tooltip />
                <Bar dataKey="valor">
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="bg-slate-950 min-h-screen text-white flex">
      <aside className="w-64 bg-slate-900 border-r border-slate-800 p-6">
        <h1 className="text-2xl font-bold text-green-400 mb-10">Rocket Imports Gestão</h1>

        <div className="mb-8 space-y-2">
          {/* Ligar App */}
          <button
            onClick={wakeUpBackend}
            className="w-full flex items-center justify-between p-3 rounded-xl font-medium text-sm transition bg-slate-950 border border-slate-800 hover:bg-slate-800/60 text-slate-200"
            disabled={loadingApp}
          >
            <div className="flex items-center gap-2.5">
              <Power size={16} className={appReady ? "text-green-400" : "text-slate-400"} />
              <span>Ligar App</span>
            </div>
            {loadingApp ? (
              <Loader2 size={16} className="animate-spin text-slate-400" />
            ) : (
              <span className={`w-2 h-2 rounded-full ${appReady ? "bg-green-500 shadow-sm shadow-green-500" : "bg-red-500"}`} />
            )}
          </button>

          {/* Mercado Livre */}
          <button
            onClick={connectMercadoLivre}
            className="w-full flex items-center justify-between p-3 rounded-xl font-medium text-sm transition bg-slate-950 border border-slate-800 hover:bg-slate-800/60 text-slate-200"
            disabled={loadingML}
          >
            <div className="flex items-center gap-2.5">
              <Store size={16} className={mercadoLivreReady ? "text-green-400" : "text-slate-400"} />
              <span>Mercado Livre</span>
            </div>
            {loadingML ? (
              <Loader2 size={16} className="animate-spin text-slate-400" />
            ) : (
              <span className={`w-2 h-2 rounded-full ${mercadoLivreReady ? "bg-green-500 shadow-sm shadow-green-500" : "bg-red-500"}`} />
            )}
          </button>

          {/* Shopee */}
          <button
            onClick={connectShopee}
            className="w-full flex items-center justify-between p-3 rounded-xl font-medium text-sm transition bg-slate-950 border border-slate-800 hover:bg-slate-800/60 text-slate-200"
            disabled={loadingShopee}
          >
            <div className="flex items-center gap-2.5">
              <ShoppingBag size={16} className={shopeeReady ? "text-green-400" : "text-slate-400"} />
              <span>Shopee</span>
            </div>
            {loadingShopee ? (
              <Loader2 size={16} className="animate-spin text-slate-400" />
            ) : (
              <span className={`w-2 h-2 rounded-full ${shopeeReady ? "bg-green-500 shadow-sm shadow-green-500" : "bg-red-500"}`} />
            )}
          </button>
        </div>

        <nav className="space-y-3">
          <Link
            to="/"
            className={`flex items-center gap-2 p-3 rounded-xl transition ${
              location.pathname === "/" ? "bg-slate-800" : "hover:bg-slate-800"
            }`}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </Link>

          <Link
            to="/products"
            className={`flex items-center gap-2 p-3 rounded-xl transition ${
              location.pathname === "/products" ? "bg-slate-800" : "hover:bg-slate-800"
            }`}
          >
            <Package size={18} />
            Produtos
          </Link>

          <Link
            to="/sales"
            className={`flex items-center gap-2 p-3 rounded-xl transition ${
              location.pathname === "/sales" ? "bg-slate-800" : "hover:bg-slate-800"
            }`}
          >
            <ReceiptText size={18} />
            Vendas
          </Link>

          <Link
            to="/reports"
            className={`flex items-center gap-2 p-3 rounded-xl transition ${
              location.pathname === "/reports" ? "bg-slate-800" : "hover:bg-slate-800"
            }`}
          >
            Relatórios
          </Link>
        </nav>
      </aside>

      <main className="flex-1 p-8 overflow-auto">
        <Routes>
          <Route path="/" element={dashboardPage} />
          <Route path="/products" element={<Products />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </main>
    </div>
  )
}

export default App