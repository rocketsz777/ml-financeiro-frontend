import "./Dashboard.css";

import Sidebar from "../components/Sidebar/Sidebar";

import {
  FaDollarSign,
  FaShoppingCart,
  FaBoxes,
  FaChartLine
} from "react-icons/fa";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

const data = [

  {
    nome: "Faturamento",
    valor: 4000
  },

  {
    nome: "Custos",
    valor: 2400
  },

  {
    nome: "Lucro",
    valor: 1600
  }

];

const produtosData = [

  {
    name: "Mouse Gamer",
    value: 400
  },

  {
    name: "Teclado Mecânico",
    value: 300
  },

  {
    name: "Fonte ATX",
    value: 300
  }

];

const COLORS = [

  "#3b82f6",
  "#22c55e",
  "#f97316"

];

function Dashboard() {

  return (

    <div className="dashboard-container">

      <Sidebar />

      <main className="dashboard-content">

        <header className="topbar">

          <div>

            <h1>Dashboard</h1>

            <p>Rocket Imports Gestão</p>

          </div>

          <div className="topbar-actions">

            <select>

              <option>Todos</option>
              <option>Mercado Livre</option>
              <option>Shopee</option>

            </select>

            <button className="period-btn">
              Semanal
            </button>

            <button className="period-btn active">
              Mensal
            </button>

            <button className="import-btn">
              Importar
            </button>

          </div>

        </header>

        <section className="cards-container">

          <div className="card">

            <div>

              <h3>Faturamento</h3>

              <p className="green-text">
                R$ 12.450,00
              </p>

            </div>

            <FaDollarSign className="card-icon green" />

          </div>

          <div className="card">

            <div>

              <h3>Custos</h3>

              <p className="red-text">
                R$ 7.130,00
              </p>

            </div>

            <FaBoxes className="card-icon orange" />

          </div>

          <div className="card">

            <div>

              <h3>Lucro</h3>

              <p className="blue-text">
                R$ 5.320,00
              </p>

            </div>

            <FaChartLine className="card-icon blue" />

          </div>

          <div className="card">

            <div>

              <h3>Vendas</h3>

              <p>
                152 pedidos
              </p>

            </div>

            <FaShoppingCart className="card-icon purple" />

          </div>

        </section>

        <section className="dashboard-grid">

          <div className="chart-section">

            <h2>Performance Financeira</h2>

            <ResponsiveContainer width="100%" height={300}>

              <BarChart data={data}>

                <XAxis dataKey="nome" />

                <YAxis />

                <Tooltip />

                <Bar
                  dataKey="valor"
                  fill="#2563eb"
                  radius={[8, 8, 0, 0]}
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

          <div className="chart-section">

            <h2>Top Produtos</h2>

            <ResponsiveContainer width="100%" height={300}>

              <PieChart>

                <Pie
                  data={produtosData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label
                >

                  {

                    produtosData.map((entry, index) => (

                      <Cell
                        key={index}
                        fill={COLORS[index % COLORS.length]}
                      />

                    ))

                  }

                </Pie>

                <Tooltip />

                <Legend />

              </PieChart>

            </ResponsiveContainer>

          </div>

        </section>

        <section className="bottom-grid">

          <div className="bottom-card">

            <h2>Produtos Mais Vendidos</h2>

          </div>

          <div className="bottom-card">

            <h2>Produtos Mais Lucrativos</h2>

          </div>

        </section>

      </main>

    </div>
  )
}

export default Dashboard;