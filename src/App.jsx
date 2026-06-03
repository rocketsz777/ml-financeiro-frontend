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
  Store
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
  Cell,
  Legend
} from "recharts"

import Products from "./pages/Products"
import Reports from "./pages/Reports"
import Sales from "./pages/Sales"

function App() {

  const location =
    useLocation()

  const [dashboard, setDashboard] =
    useState(null)

  const [marketplace, setMarketplace] =
    useState("ALL")

  const [period, setPeriod] =
    useState("MONTH")

  const [loadingImport, setLoadingImport] =
    useState(false)

  const [appReady, setAppReady] =
    useState(false)

  const [mercadoLivreReady, setMercadoLivreReady] =
    useState(false)

  const [shopeeReady, setShopeeReady] =
    useState(false)

  const wakeUpBackend = async () => {

    try {

      const health = await api.get("/health")

      const isOnline =
        health.data.status === "UP"

      setAppReady(isOnline)

      checkConnections()

      return isOnline

    } catch {

      setAppReady(false)

      return false
    }
  }

  const connectMercadoLivre = async () => {

    try {

      const appOnline =
        await wakeUpBackend()

      if (!appOnline) {

        alert(
          "A API ainda nao esta online. Clique em Ligar App e tente novamente em alguns segundos."
        )

        return
      }

      const response =
        await api.get(
          "/oauth/mercadolivre/login"
        )

      window.location.href =
        response.data

    } catch (error) {

      console.error(error)

      setMercadoLivreReady(false)

      alert(
        "Nao foi possivel iniciar a autenticacao do Mercado Livre"
      )
    }
  }

  const connectShopee = async () => {

    try {

      const appOnline =
        await wakeUpBackend()

      if (!appOnline) {

        alert(
          "A API ainda nao esta online. Clique em Ligar App e tente novamente em alguns segundos."
        )

        return
      }

      const response =
        await api.get(
          "/shopee/login"
        )

      window.location.href =
        response.data

    } catch (error) {

      console.error(error)

      setShopeeReady(false)

      alert(
        "Nao foi possivel iniciar a autenticacao da Shopee"
      )
    }
  }

  useEffect(() => {

    loadDashboard()
    checkConnections()

  }, [marketplace, period])

  useEffect(() => {

    const params =
      new URLSearchParams(
        location.search
      )

    const auth =
      params.get("auth")

    const status =
      params.get("status")

    if (!auth
      || !status) {

      return
    }

    checkConnections()

    const marketplaceName =
      auth === "shopee"
        ? "Shopee"
        : "Mercado Livre"

    alert(
      status === "success"
        ? `${marketplaceName} conectado com sucesso`
        : `Nao foi possivel conectar ${marketplaceName}`
    )

    window.history.replaceState(
      null,
      "",
      location.pathname
    )

  }, [location.search])

 const loadDashboard = () => {

   let url =
     `/api/dashboard/summary?period=${period}`

   if (marketplace !== "ALL") {

     url +=
       `&marketplace=${marketplace}`
   }

   api
     .get(url)

     .then(response => {

       setDashboard(
         response.data
       )

     })

     .catch(error => {

       console.error(error)

     })
 }

  const checkConnections = async () => {

   try {

     const health =
       await api.get("/health")

     setAppReady(
       health.data.status === "UP"
     )

   } catch {

     setAppReady(false)
   }

   try {

     const ml =
       await api.get(
         "/api/mercadolivre/status"
       )

     setMercadoLivreReady(
       ml.data === "CONECTADO"
     )

   } catch {

     setMercadoLivreReady(false)
   }

   try {

     const shopee =
       await api.get(
         "/shopee/status"
       )

     setShopeeReady(
       shopee.data === "CONECTADO"
     )

   } catch {

     setShopeeReady(false)
   }
 }

  const importSales = async () => {

    try {

      setLoadingImport(true)

     await api.post(
       "/api/import/sales"
     )

      alert(
        "Vendas importadas com sucesso"
      )

      loadDashboard()

    } catch (error) {

      console.error(error)

      alert(
        "Erro ao importar vendas"
      )

    } finally {

      setLoadingImport(false)
    }
  }

  const formatCurrency = (value) => {

    return Number(value || 0)
      .toLocaleString(
        "pt-BR",
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }
      )
  }

  const sortedProducts =

    dashboard?.topSellingItems

      ?

      Object.entries(
        dashboard.topSellingItems
      )

        .sort(
          (a, b) => b[1] - a[1]
        )

      : []

  const sortedProfits =

    dashboard?.topProfitableItems

      ?

      Object.entries(
        dashboard.topProfitableItems
      )

        .sort(
          (a, b) => b[1] - a[1]
        )

      : []

  const chartData = [

    {
      name: "Faturamento",
      valor: Number(
        dashboard?.totalRevenue || 0
      )
    },

    {
      name: "Custos",
      valor: Number(
        dashboard?.totalCost || 0
      )
    },

    {
      name: "Lucro",
      valor: Number(
        dashboard?.totalProfit || 0
      )
    }

  ]

  const pieData =

    sortedProducts
      .slice(0, 5)

      .map(
        ([name, quantity]) => ({

          name,
          value: quantity
        })
      )

  const COLORS = [
    "#3b82f6",
    "#22c55e",
    "#f59e0b",
    "#a855f7",
    "#ef4444"
  ]

  const connectionButtonClass = (ready) =>
    `w-full flex items-center gap-2 p-3 rounded-xl font-semibold transition border ${
      ready
        ? "bg-green-600 border-green-500 text-white hover:bg-green-500"
        : "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
    }`

  const DashboardPage = () => (

    <div>

      {/* TOPO */}

      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">

        <div>

          <h1 className="text-4xl font-bold">

            Dashboard

          </h1>

          <p className="text-slate-400 mt-2">

            Rocket Imports Gestão

          </p>

        </div>

        <div className="flex flex-wrap gap-3">

          <select

            value={marketplace}

            onChange={(e) =>
              setMarketplace(
                e.target.value
              )
            }

            className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2"
          >

            <option value="ALL">
              Todos
            </option>

            <option value="MERCADO_LIVRE">
              Mercado Livre
            </option>

            <option value="SHOPEE">
              Shopee
            </option>

          </select>

          <button

            onClick={() =>
              setPeriod("WEEK")
            }

            className={`px-4 py-2 rounded-xl font-semibold transition

            ${period === "WEEK"

                ? "bg-blue-600"

                : "bg-slate-700"
              }`}
          >

            Semanal

          </button>

          <button

            onClick={() =>
              setPeriod("MONTH")
            }

            className={`px-4 py-2 rounded-xl font-semibold transition

            ${period === "MONTH"

                ? "bg-green-600"

                : "bg-slate-700"
              }`}
          >

            Mensal

          </button>

          <button

            onClick={importSales}

            className="bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2"
          >
            <Download size={18} />

            {

              loadingImport

                ?

                "Importando..."

                :

                "Importar"
            }

          </button>

        </div>

      </div>

      {/* KPIS */}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">

        <div className="bg-slate-900 p-6 rounded-2xl shadow-lg">

          <p className="text-slate-400">
            Faturamento
          </p>

          <h2 className="text-3xl font-bold mt-3 text-green-400">

            R$ {
              formatCurrency(
                dashboard?.totalRevenue
              )
            }

          </h2>

        </div>

        <div className="bg-slate-900 p-6 rounded-2xl shadow-lg">

          <p className="text-slate-400">
            Custos
          </p>

          <h2 className="text-3xl font-bold mt-3 text-red-400">

            R$ {
              formatCurrency(
                dashboard?.totalCost
              )
            }

          </h2>

        </div>

        <div className="bg-slate-900 p-6 rounded-2xl shadow-lg">

          <p className="text-slate-400">
            Lucro
          </p>

          <h2 className="text-3xl font-bold mt-3 text-blue-400">

            R$ {
              formatCurrency(
                dashboard?.totalProfit
              )
            }

          </h2>

        </div>

        <div className="bg-slate-900 p-6 rounded-2xl shadow-lg">

          <p className="text-slate-400">
            Vendas
          </p>

          <h2 className="text-3xl font-bold mt-3">

            {
              dashboard?.unitsSold ?? 0
            }

          </h2>

        </div>

      </div>

      {/* GRÁFICOS */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-8">

        <div className="bg-slate-900 p-6 rounded-2xl shadow-lg">

          <h2 className="text-xl font-bold mb-5">

            Performance Financeira

          </h2>

          <ResponsiveContainer
            width="100%"
            height={300}
          >

            <BarChart
              data={chartData}
            >

              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="name" />

              <YAxis />

              <Tooltip />

              <Bar
                dataKey="valor"
                fill="#22c55e"
              />

            </BarChart>

          </ResponsiveContainer>

        </div>

        <div className="bg-slate-900 p-6 rounded-2xl shadow-lg">

          <h2 className="text-xl font-bold mb-5">

            Distribuição Produtos

          </h2>

          <ResponsiveContainer
            width="100%"
            height={300}
          >

            <PieChart>

              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
                label
              >

                {

                  pieData.map(
                    (_, index) => (

                      <Cell
                        key={index}
                        fill={
                          COLORS[
                          index % COLORS.length
                          ]
                        }
                      />

                    )
                  )
                }

              </Pie>

              <Tooltip />

              <Legend />

            </PieChart>

          </ResponsiveContainer>

        </div>

      </div>

    </div>
  )

  return (

    <div className="bg-slate-950 min-h-screen text-white flex">

      <aside className="w-64 bg-slate-900 border-r border-slate-800 p-6">

        <h1 className="text-2xl font-bold text-green-400 mb-10">

          Rocket Imports Gestão

        </h1>

        <div className="mb-8 space-y-2">

          <button
            onClick={wakeUpBackend}
            className={connectionButtonClass(appReady)}
          >
            <Power size={18} />
            <span className={`w-3 h-3 rounded-full ${
              appReady ? "bg-white" : "bg-red-500"
            }`}></span>
            Ligar App
          </button>

          <button
            onClick={connectMercadoLivre}
            className={connectionButtonClass(mercadoLivreReady)}
          >
            <Store size={18} />
            <span className={`w-3 h-3 rounded-full ${
              mercadoLivreReady ? "bg-white" : "bg-red-500"
            }`}></span>
            Mercado Livre
          </button>

          <button
            onClick={connectShopee}
            className={connectionButtonClass(shopeeReady)}
          >
            <ShoppingBag size={18} />
            <span className={`w-3 h-3 rounded-full ${
              shopeeReady ? "bg-white" : "bg-red-500"
            }`}></span>
            Shopee
          </button>

        </div>

        <nav className="space-y-3">

          <Link
            to="/"
            className={`flex items-center gap-2 p-3 rounded-xl transition

            ${location.pathname === "/"

                ? "bg-slate-800"

                : "hover:bg-slate-800"
              }`}
          >
            <LayoutDashboard size={18} />

            Dashboard

          </Link>

          <Link
            to="/products"
            className={`flex items-center gap-2 p-3 rounded-xl transition

            ${location.pathname === "/products"

                ? "bg-slate-800"

                : "hover:bg-slate-800"
              }`}
          >
            <Package size={18} />

            Produtos

          </Link>

          <Link
            to="/sales"
            className={`flex items-center gap-2 p-3 rounded-xl transition

            ${location.pathname === "/sales"

                ? "bg-slate-800"

                : "hover:bg-slate-800"
              }`}
          >
            <ReceiptText size={18} />

            Vendas

          </Link>

<Link
  to="/reports"
  className={`flex items-center gap-2 p-3 rounded-xl transition

  ${location.pathname === "/reports"

      ? "bg-slate-800"

      : "hover:bg-slate-800"
    }`}
>

  Relatórios

</Link>

        </nav>

      </aside>

      <main className="flex-1 p-8 overflow-auto">

        <Routes>

          <Route
            path="/"
            element={<DashboardPage />}
          />

          <Route
            path="/products"
            element={<Products />}
          />

          <Route
            path="/sales"
            element={<Sales />}
          />

          <Route
            path="/reports"
            element={<Reports />}
          />

        </Routes>

      </main>

    </div>
  )
}

export default App
