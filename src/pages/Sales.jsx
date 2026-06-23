import { useEffect, useState } from "react"
import { api } from "../services/api";

function Sales() {

  const [products, setProducts] = useState([])
  const [productSkuMap, setProductSkuMap] = useState({})
  const [period, setPeriod] = useState("MONTH")

  const [sales, setSales] =
    useState([])

  const [search, setSearch] =
    useState("")

  const [marketplaceFilter, setMarketplaceFilter] =
    useState("TODOS")

  useEffect(() => {

   api
     .get(
       "/api/sales"
     )

      .then(response => {

        setSales(
          response.data
        )

      })

      .catch(error => {

        console.error(error)

      })
   api.get("/api/produtos")
     .then(response => {

       const productsData = response.data || []

       setProducts(productsData)

       const skuMap = {}

       productsData.forEach(product => {

         if (product.sku) {
           skuMap[String(product.sku).trim()] = true
         }

       })

       setProductSkuMap(skuMap)

     })
     .catch(console.error)

  }, [])

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

  const now = new Date()

  const filteredSales =

    sales.filter(sale => {

      const matchesSearch =

        sale.productName
          ?.toLowerCase()
          .includes(
            search.toLowerCase()
          )

      const matchesMarketplace =

        marketplaceFilter === "TODOS"

          ? true

          : sale.marketplace === marketplaceFilter

      const targetDate =
        new Date(sale.soldAt)

      let matchesPeriod = true

      if (period === "DAY") {

        matchesPeriod =
          targetDate.toDateString() ===
          now.toDateString()
      }

      if (period === "WEEK") {

        const startOfWeek =
          new Date(now)

        const day =
          startOfWeek.getDay() === 0
            ? 7
            : startOfWeek.getDay()

        startOfWeek.setDate(
          startOfWeek.getDate() - day + 1
        )

        startOfWeek.setHours(
          0, 0, 0, 0
        )

        matchesPeriod =
          targetDate >= startOfWeek &&
          targetDate <= now
      }

      if (period === "PREVIOUS_WEEK") {

        const startCurrent =
          new Date(now)

        const day =
          startCurrent.getDay() === 0
            ? 7
            : startCurrent.getDay()

        startCurrent.setDate(
          startCurrent.getDate() - day + 1
        )

        startCurrent.setHours(
          0, 0, 0, 0
        )

        const startPrevious =
          new Date(startCurrent)

        startPrevious.setDate(
          startPrevious.getDate() - 7
        )

        matchesPeriod =
          targetDate >= startPrevious &&
          targetDate < startCurrent
      }

      if (period === "MONTH") {

        matchesPeriod =
          targetDate.getMonth() === now.getMonth() &&
          targetDate.getFullYear() === now.getFullYear()
      }

      if (period === "PREVIOUS_MONTH") {

        const currentMonth =
          now.getMonth()

        let expectedMonth =
          currentMonth - 1

        let expectedYear =
          now.getFullYear()

        if (expectedMonth < 0) {
          expectedMonth = 11
          expectedYear -= 1
        }

        matchesPeriod =
          targetDate.getMonth() === expectedMonth &&
          targetDate.getFullYear() === expectedYear
      }

      return (
        matchesSearch &&
        matchesMarketplace &&
        matchesPeriod
      )
    })
  const totalSales =
    new Set(
      filteredSales.map(
        sale => sale.orderId
      )
    ).size

  const totalCostSummary =
    filteredSales.reduce(
      (acc, sale) =>
        acc +
        (
          Number(sale.productCost || 0) *
          Number(sale.quantity || 0)
        ),
      0
    )

  const totalProfitSummary =
    filteredSales.reduce(
      (acc, sale) =>
        acc +
        Number(sale.profit || 0),
      0
    )

  // LOGICA DO LOG DE DATAS DINÂMICO EQUIVALENTE AO DE PRODUTOS
  const getPeriodLabel = () => {
    const formatDate = (d) => d.toLocaleDateString("pt-BR");
    const formatDayMonth = (d) => {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      return `${day}/${month}`;
    };

    let start = new Date(now);
    let end = new Date(now);

    if (period === "DAY") {
      start = new Date(now);
      end = new Date(now);
    } else if (period === "WEEK") {
      const startOfWeek = new Date(now);
      const day = startOfWeek.getDay() === 0 ? 7 : startOfWeek.getDay();
      startOfWeek.setDate(startOfWeek.getDate() - day + 1);
      startOfWeek.setHours(0, 0, 0, 0);
      start = startOfWeek;
      end = now;
    } else if (period === "PREVIOUS_WEEK") {
      const startCurrent = new Date(now);
      const day = startCurrent.getDay() === 0 ? 7 : startCurrent.getDay();
      startCurrent.setDate(startCurrent.getDate() - day + 1);
      startCurrent.setHours(0, 0, 0, 0);

      const startPrevious = new Date(startCurrent);
      startPrevious.setDate(startPrevious.getDate() - 7);

      const endPrevious = new Date(startCurrent);
      endPrevious.setDate(endPrevious.getDate() - 1);

      start = startPrevious;
      end = endPrevious;
    } else if (period === "MONTH") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = now;
    } else if (period === "PREVIOUS_MONTH") {
      const currentMonth = now.getMonth();
      let expectedMonth = currentMonth - 1;
      let expectedYear = now.getFullYear();
      if (expectedMonth < 0) {
        expectedMonth = 11;
        expectedYear -= 1;
      }
      start = new Date(expectedYear, expectedMonth, 1);
      end = new Date(expectedYear, expectedMonth + 1, 0);
    }

    let importText = "";
    if (sales && sales.length > 0) {
      const dates = sales.map(s => new Date(s.soldAt).getTime()).filter(t => !isNaN(t));
      if (dates.length > 0) {
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));
        importText = ` | Importação do dia ${formatDayMonth(minDate)} ao ${formatDayMonth(maxDate)}`;
      }
    }

    return `Período: ${formatDate(start)} até ${formatDate(end)}${importText}`;
  };


  return (
      <div>
        {/* TOPO ALINHADO IGUAL A PRODUTOS (MANTENDO PADRÃO DAS IMAGENS image_3551e6.jpg E image_35521e.jpg) */}
        <div className="flex justify-between items-start mb-8">

          {/* ESQUERDA - TÍTULO E PERÍODO LOG */}
          <div>
            <h1 className="text-4xl font-bold">Vendas</h1>
            <p className="text-slate-400 mt-2">Histórico operacional de vendas</p>
            <p className="text-xs font-semibold text-cyan-400 mt-3 bg-slate-900/60 inline-block px-3 py-1.5 rounded-lg border border-slate-800 tracking-wide">
              {getPeriodLabel()}
            </p>
          </div>

          {/* CENTRO - CARDS DE RESUMO */}
          <div className="flex gap-4">
            <div className="bg-slate-900 p-4 rounded-xl shadow-lg min-w-[150px]">
              <p className="text-xs text-slate-400">Vendas Encontradas</p>
              <h2 className="text-2xl font-bold text-white mt-1">
                {totalSales}
              </h2>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl shadow-lg min-w-[180px]">
              <p className="text-xs text-slate-400">Custo Total</p>
              <h2 className="text-2xl font-bold text-red-400 mt-1">
                R$ {formatCurrency(totalCostSummary)}
              </h2>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl shadow-lg min-w-[180px]">
              <p className="text-xs text-slate-400">Lucro Total</p>
              <h2 className="text-2xl font-bold text-green-400 mt-1">
                R$ {formatCurrency(totalProfitSummary)}
              </h2>
            </div>
          </div>

          {/* DIREITA - INPUT DE BUSCA, FILTRO DE MARKETPLACE E FILTRO DE PERÍODOS */}
          <div className="flex flex-col items-end gap-3">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Buscar produto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 w-72"
              />

              {/* FILTROS DE MARKETPLACE */}
              <div className="flex gap-2">
                <button
                  onClick={() => setMarketplaceFilter("TODOS")}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                    marketplaceFilter === "TODOS"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 text-slate-300"
                  }`}
                >
                  Todos
                </button>

                <button
                  onClick={() => setMarketplaceFilter("MERCADO_LIVRE")}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                    marketplaceFilter === "MERCADO_LIVRE"
                      ? "bg-yellow-500 text-black"
                      : "bg-slate-800 text-slate-300"
                  }`}
                >
                  Mercado Livre
                </button>

                <button
                  onClick={() => setMarketplaceFilter("SHOPEE")}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                    marketplaceFilter === "SHOPEE"
                      ? "bg-orange-500 text-white"
                      : "bg-slate-800 text-slate-300"
                  }`}
                >
                  Shopee
                </button>
              </div>
            </div>

            {/* FILTROS DE PERÍODO */}
            <div className="flex gap-2 flex-wrap justify-end">
              <button
                onClick={() => setPeriod("DAY")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                  period === "DAY"
                    ? "bg-cyan-600 text-white"
                    : "bg-slate-800 text-slate-300"
                }`}
              >
                Diário
              </button>

              <button
                onClick={() => setPeriod("WEEK")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                  period === "WEEK"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-300"
                }`}
              >
                Semanal
              </button>

              <button
                onClick={() => setPeriod("PREVIOUS_WEEK")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                  period === "PREVIOUS_WEEK"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-300"
                }`}
              >
                Semana Passada
              </button>

              <button
                onClick={() => setPeriod("MONTH")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                  period === "MONTH"
                    ? "bg-green-600 text-white"
                    : "bg-slate-800 text-slate-300"
                }`}
              >
                Mensal
              </button>

              <button
                onClick={() => setPeriod("PREVIOUS_MONTH")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                  period === "PREVIOUS_MONTH"
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-800 text-slate-300"
                }`}
              >
                Mês Passado
              </button>
            </div>
          </div>
        </div>

      <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-lg overflow-x-auto">

        <table className="w-full">

          <thead className="bg-slate-800">

            <tr>

             <th className="text-left p-4">
               Pedido
             </th>

             <th className="text-left p-4">
               Produto
             </th>

             <th className="text-left p-4">
               Marketplace
             </th>

              <th className="text-left p-4">
                Quantidade
              </th>

              <th className="text-left p-4">
                Faturamento
              </th>

              <th className="text-left p-4">
                Custo
              </th>

              <th className="text-left p-4">
                Lucro
              </th>

              <th className="text-left p-4">
                Margem
              </th>

              <th className="text-left p-4">
                Data
              </th>

            </tr>

          </thead>

          <tbody className="text-sm">

            {

              filteredSales

                .sort(
                  (a, b) =>

                    new Date(b.soldAt) -
                    new Date(a.soldAt)
                )

                .map(
                  (sale, index) => {

                    const totalCost =

                      Number(
                        sale.productCost || 0
                      ) *

                      Number(
                        sale.quantity || 0
                      )

                    const margin =

                      totalCost > 0

                        ?

                        (
                          (
                            Number(
                              sale.profit || 0
                            )

                            /

                            totalCost
                          ) * 100
                        ).toFixed(2)

                        :

                        0

                    const skuLinked =

                      sale.sku &&

                      productSkuMap[
                        String(sale.sku).trim()
                      ]

                    return (

                      <tr

                        key={index}

                        className="border-t border-slate-800 hover:bg-slate-800 transition"
                      >
                      <td
                        className="p-4 text-slate-400 text-xs"
                      >
                        <button
                          title="Clique para copiar"
                          onClick={() => navigator.clipboard.writeText(sale.orderId)}
                          className="text-left hover:text-white transition"
                        >
                          <div className="leading-tight">
                            <div>
                              {String(sale.orderId).slice(0, 8)}
                            </div>

                            <div>
                              {String(sale.orderId).slice(-8)}
                            </div>
                          </div>
                        </button>
                      </td>

                        <td className="p-4">

                          <div className="font-semibold">

                            {
                              sale.productName
                            }

                          </div>

                          <div className="text-slate-400 text-xs mt-1 flex flex-wrap gap-1">

                            <span>
                              SKU:{sale.sku || "-"}
                            </span>

                            <span>|</span>

                            <span
                              onClick={() =>
                                navigator.clipboard.writeText(
                                  sale.marketplaceItemId || ""
                                )
                              }
                              className="
                                cursor-pointer
                                hover:text-cyan-400
                                font-mono
                                hover:underline
                              "
                              title="Clique para copiar o ID do anúncio"
                            >
                              {sale.marketplaceItemId || "-"}
                            </span>

                            <span>
                              {skuLinked ? "✅" : "❌"}
                            </span>

                          </div>

                        </td>

                        <td className="p-4">

                          <span className={`px-3 py-1 rounded-full text-xs font-semibold

                            ${sale.marketplace === "MERCADO_LIVRE"

                              ? "bg-yellow-500 text-black"

                              : "bg-orange-500 text-white"
                            }`}>

                            {
                              sale.marketplace
                                ?.replace("_", " ")
                            }

                          </span>

                        </td>

                        <td className="p-4">

                          {
                            sale.quantity
                          }

                        </td>

                        <td className="p-4 text-blue-400 font-semibold">

                          R$ {
                            formatCurrency(
                              sale.netAmount
                            )
                          }

                        </td>

                        <td className="p-4 text-red-400 font-semibold">

                          R$ {
                            formatCurrency(
                              totalCost
                            )
                          }

                        </td>

                        <td className="p-4 text-green-400 font-semibold">

                          R$ {
                            formatCurrency(
                              sale.profit
                            )
                          }

                        </td>

                        <td className="p-4 text-yellow-400 font-semibold">

                          {
                            margin
                          }%

                        </td>

                        <td className="p-4 text-slate-400 text-sm">

                          {

                            sale.soldAt

                              ?

                              new Date(
                                sale.soldAt
                              ).toLocaleDateString(
                                "pt-BR"
                              )

                              :

                              "-"
                          }

                        </td>

                      </tr>
                    )
                  }
                )
            }

          </tbody>

        </table>

      </div>

    </div>
  )
}

export default Sales