import { useEffect, useState } from "react"

import axios from "axios"

import {
  Routes,
  Route,
  Link,
  useLocation
} from "react-router-dom"

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

  const [showAllProducts, setShowAllProducts] =
    useState(false)

  const [showAllProfits, setShowAllProfits] =
    useState(false)

  const [loadingImport, setLoadingImport] =
    useState(false)

  useEffect(() => {

    loadDashboard()

  }, [marketplace, period])

  const loadDashboard = () => {

    let url =
      `http://localhost:8080/api/dashboard/summary?period=${period}`

    if (marketplace !== "ALL") {

      url +=
        `&marketplace=${marketplace}`
    }

    axios
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

  const importSales = async () => {

    try {

      setLoadingImport(true)

      await axios.post(
        "http://localhost:8080/api/shopee/simulate-import"
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

  const visibleProducts =

    showAllProducts

      ?

      sortedProducts

      :

      sortedProducts.slice(0, 10)

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

  const visibleProfits =

    showAllProfits

      ?

      sortedProfits

      :

      sortedProfits.slice(0, 10)

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

            className="bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-xl font-semibold transition"
          >

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

      <div className="grid grid-cols-1 md:grid-cols-5 gap-5">

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

        <div className="bg-slate-900 p-6 rounded-2xl shadow-lg">

          <p className="text-slate-400">
            Margem
          </p>

          <h2 className="text-3xl font-bold mt-3 text-yellow-400">

            {
              dashboard?.profitMargin ?? 0
            }%

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

            Top Produtos

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

      {/* LISTAS */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-8">

        <div className="bg-slate-900 p-6 rounded-2xl shadow-lg">

          <h2 className="text-xl font-bold mb-5">

            Produtos Mais Vendidos

          </h2>

          <div className="space-y-3">

            {

              visibleProducts.map(
                ([name, quantity]) => (

                  <div

                    key={name}

                    className="flex justify-between bg-slate-800 p-3 rounded-xl"
                  >

                    <span>
                      {name}
                    </span>

                    <strong>
                      {quantity}
                    </strong>

                  </div>

                )
              )
            }

          </div>

        </div>

        <div className="bg-slate-900 p-6 rounded-2xl shadow-lg">

          <h2 className="text-xl font-bold mb-5">

            Produtos Mais Lucrativos

          </h2>

          <div className="space-y-3">

            {

              visibleProfits.map(
                ([name, profit]) => (

                  <div

                    key={name}

                    className="flex justify-between bg-slate-800 p-3 rounded-xl"
                  >

                    <span>
                      {name}
                    </span>

                    <strong className="text-green-400">

                      R$ {
                        formatCurrency(
                          profit
                        )
                      }

                    </strong>

                  </div>

                )
              )
            }

          </div>

        </div>

      </div>

    </div>
  )

  return (

    <div className="bg-slate-950 min-h-screen text-white flex">

      {/* SIDEBAR */}

      <aside className="w-64 bg-slate-900 border-r border-slate-800 p-6">

        <h1 className="text-2xl font-bold text-green-400 mb-10">

          Rocket Imports Gestão

        </h1>

        <nav className="space-y-3">

          <Link
            to="/"
            className={`block p-3 rounded-xl transition

            ${location.pathname === "/"

                ? "bg-slate-800"

                : "hover:bg-slate-800"
              }`}
          >

            Dashboard

          </Link>

          <Link
            to="/products"
            className={`block p-3 rounded-xl transition

            ${location.pathname === "/products"

                ? "bg-slate-800"

                : "hover:bg-slate-800"
              }`}
          >

            Produtos

          </Link>

          <Link
            to="/sales"
            className={`block p-3 rounded-xl transition

            ${location.pathname === "/sales"

                ? "bg-slate-800"

                : "hover:bg-slate-800"
              }`}
          >

            Vendas

          </Link>

          <Link
            to="/reports"
            className={`block p-3 rounded-xl transition

            ${location.pathname === "/reports"

                ? "bg-slate-800"

                : "hover:bg-slate-800"
              }`}
          >

            Relatórios

          </Link>

        </nav>

      </aside>

      {/* CONTEÚDO */}

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