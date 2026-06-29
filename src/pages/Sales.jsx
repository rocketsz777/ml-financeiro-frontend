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
          startCurrent.setDate() - day + 1
        )

        startCurrent.setHours(
          0, 0, 0, 0
        )

        const startPrevious =
          new Date(startCurrent)

        startPrevious.setDate(
          startPrevious.setDate() - 7
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
      <div className="space-y-6">
        {/* TOPO RESPONSIVO - SE ADAPTA EM COLUNA NO IPHONE E EM LINHA EM TELAS GRANDES */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-6 mb-4">

          {/* ESQUERDA - TÍTULO E PERÍODO LOG */}
          <div className="w-full lg:w-auto">
            <h1 className="text-3xl md:text-4xl font-bold">Vendas</h1>
            <p className="text-slate-400 mt-1 text-sm md:text-base">Histórico operacional de vendas</p>
            <p className="text-[11px] md:text-xs font-semibold text-cyan-400 mt-3 bg-slate-900/60 inline-block px-3 py-1.5 rounded-lg border border-slate-800 tracking-wide max-w-full overflow-x-auto whitespace-nowrap">
              {getPeriodLabel()}
            </p>
          </div>

          {/* CENTRO - CARDS DE RESUMO EM GRID ACESSÍVEL PARA TELAS PEQUENAS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto">
            <div className="bg-slate-900 p-4 rounded-xl shadow-lg">
              <p className="text-xs text-slate-400">Vendas Encontradas</p>
              <h2 className="text-xl md:text-2xl font-bold text-white mt-1">
                {totalSales}
              </h2>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl shadow-lg">
              <p className="text-xs text-slate-400">Custo Total</p>
              <h2 className="text-xl md:text-2xl font-bold text-red-400 mt-1">
                R${formatCurrency(totalCostSummary)}
              </h2>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl shadow-lg">
              <p className="text-xs text-slate-400">Lucro Total</p>
              <h2 className="text-xl md:text-2xl font-bold text-green-400 mt-1">
                R${formatCurrency(totalProfitSummary)}
              </h2>
            </div>
          </div>

          {/* DIREITA - INPUT DE BUSCA, FILTROS COM ROLAGEM SUAVE NO IPHONE SE HOUVER OVERFLOW */}
          <div className="flex flex-col items-stretch sm:items-end gap-4 w-full lg:w-auto">
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <input
                type="text"
                placeholder="Buscar produto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 w-full sm:w-72 text-sm focus:outline-none focus:border-blue-500"
              />

              {/* FILTROS DE MARKETPLACE COM ROLAGEM LATERAL CASO O ESPAÇO SEJA CURTO */}
              <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none snap-x">
                <button
                  onClick={() => setMarketplaceFilter("TODOS")}
                  className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap snap-aria ${
                    marketplaceFilter === "TODOS"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 text-slate-300"
                  }`}
                >
                  Todos
                </button>

                <button
                  onClick={() => setMarketplaceFilter("MERCADO_LIVRE")}
                  className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap snap-aria ${
                    marketplaceFilter === "MERCADO_LIVRE"
                      ? "bg-yellow-500 text-black"
                      : "bg-slate-800 text-slate-300"
                }`}
                >
                  Mercado Livre
                </button>

                <button
                  onClick={() => setMarketplaceFilter("SHOPEE")}
                  className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap snap-aria ${
                    marketplaceFilter === "SHOPEE"
                      ? "bg-orange-500 text-white"
                      : "bg-slate-800 text-slate-300"
                  }`}
                >
                  Shopee
                </button>
              </div>
            </div>

            {/* FILTROS DE PERÍODO COM SUPORTE A TOUCH-SCROLL LATERAL NO IPHONE */}
            <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 justify-start sm:justify-end scrollbar-none snap-x">
              <button
                onClick={() => setPeriod("DAY")}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap snap-aria ${
                  period === "DAY"
                    ? "bg-cyan-600 text-white"
                    : "bg-slate-800 text-slate-300"
                }`}
              >
                Diário
              </button>

              <button
                onClick={() => setPeriod("WEEK")}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap snap-aria ${
                  period === "WEEK"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-300"
                }`}
              >
                Semanal
              </button>

              <button
                onClick={() => setPeriod("PREVIOUS_WEEK")}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap snap-aria ${
                  period === "PREVIOUS_WEEK"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-300"
                }`}
              >
                Semana Passada
              </button>

              <button
                onClick={() => setPeriod("MONTH")}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap snap-aria ${
                  period === "MONTH"
                    ? "bg-green-600 text-white"
                    : "bg-slate-800 text-slate-300"
                }`}
              >
                Mensal
              </button>

              <button
                onClick={() => setPeriod("PREVIOUS_MONTH")}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap snap-aria ${
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

      {/* TABELA - ADICIONADO MIN-WIDTH PARA EVITAR QUE AS COLUNAS AMASSAM NO IPHONE E PERMITIR ROLAGEM LIMPA */}
      <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-lg overflow-x-auto custom-scrollbar">

        <table className="w-full text-left border-collapse min-w-[1000px]">

          <thead className="bg-slate-800 text-slate-300 text-xs uppercase tracking-wider">

            <tr>

             <th className="p-4 font-semibold">
               Pedido
             </th>

             <th className="p-4 font-semibold">
               Produto
             </th>

             <th className="p-4 font-semibold">
               Marketplace
             </th>

              <th className="p-4 font-semibold">
                Quantidade
              </th>

              <th className="p-4 font-semibold">
                Faturamento
              </th>

              <th className="p-4 font-semibold">
                Custo
              </th>

              <th className="p-4 font-semibold">
                Lucro
              </th>

              <th className="p-4 font-semibold">
                Margem
              </th>

              <th className="p-4 font-semibold">
                Data
              </th>

            </tr>

          </thead>

          <tbody className="text-sm divide-y divide-slate-800/50">

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

                        className="hover:bg-slate-800/40 transition-colors"
                      >
                      <td
                        className="p-4 text-slate-400 text-xs font-mono"
                      >
                        <button
                          title="Clique para copiar"
                          onClick={() => navigator.clipboard.writeText(sale.orderId)}
                          className="text-left hover:text-cyan-400 transition select-none"
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

                        <td className="p-4 max-w-[280px]">

                          <div className="font-semibold text-slate-200 truncate" title={sale.productName}>

                            {
                              sale.productName
                            }

                          </div>

                          <div className="text-slate-400 text-xs mt-1 flex flex-wrap items-center gap-1">

                            <span>
                              SKU: {sale.sku || "-"}
                            </span>

                            <span className="text-slate-600">|</span>

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

                            <span className="ml-1 select-none">
                              {skuLinked ? "✅" : "❌"}
                            </span>

                          </div>

                        </td>

                        <td className="p-4">

                          <span className={`px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide

                            ${sale.marketplace === "MERCADO_LIVRE"

                              ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"

                              : "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                            }`}>

                            {
                              sale.marketplace
                                ?.replace("_", " ")
                            }

                          </span>

                        </td>

                        <td className="p-4 font-medium text-slate-300">

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

                        <td className="p-4 text-slate-400 text-xs">

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