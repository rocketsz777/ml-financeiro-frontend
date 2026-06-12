import { useEffect, useState } from "react"
import { api } from "../services/api";

function Sales() {

  const [sales, setSales] =
    useState([])

  const [search, setSearch] =
    useState("")

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

  const filteredSales =

    sales.filter(
      sale =>

        sale.productName
          ?.toLowerCase()

          .includes(
            search.toLowerCase()
          )
    )

  return (

    <div>

      {/* TOPO */}

      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">

        <div>

          <h1 className="text-4xl font-bold">

            Vendas

          </h1>

          <p className="text-slate-400 mt-2">

            Histórico operacional de vendas

          </p>

        </div>

        <input

          type="text"

          placeholder="Buscar produto..."

          value={search}

          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }

          className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 w-72"
        />

      </div>

      {/* TABELA */}

      <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-lg overflow-x-auto">

        <table className="w-full">

          <thead className="bg-slate-800">

            <tr>

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

                    return (

                      <tr

                        key={index}

                        className="border-t border-slate-800 hover:bg-slate-800 transition"
                      >

                        <td className="p-4">

                          <div className="font-semibold">

                            {
                              sale.productName
                            }

                          </div>

                          <div className="text-slate-400 text-xs mt-1">

                            SKU:
                            {
                              sale.sku
                            }

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