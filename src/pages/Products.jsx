import { useEffect, useState } from "react"
import { api } from "../services/api";

function Products() {

  const [products, setProducts] =
    useState([])

  const [search, setSearch] =
    useState("")

  useEffect(() => {

    api.get(
      "/api/sales"
    )

      .then(response => {

        const groupedProducts = {}

        response.data.forEach(sale => {

          const key =
            sale.sku

          if (!groupedProducts[key]) {

            groupedProducts[key] = {

              sku:
                sale.sku,

              name:
                sale.productName,

              marketplace:
                sale.marketplace,

              quantity:
                0,

              revenue:
                0,

              cost:
                0,

              profit:
                0
            }
          }

          groupedProducts[key].quantity +=
            Number(
              sale.quantity || 0
            )

          groupedProducts[key].revenue +=
            Number(
              sale.grossAmount || 0
            )

          groupedProducts[key].cost +=

            Number(
              sale.productCost || 0
            ) *

            Number(
              sale.quantity || 0
            )

          groupedProducts[key].profit +=
            Number(
              sale.profit || 0
            )
        })

        setProducts(
          Object.values(
            groupedProducts
          )
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

  const filteredProducts =

    products.filter(
      product =>

        product.name
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

            Produtos

          </h1>

          <p className="text-slate-400 mt-2">

            Gestão e performance dos produtos

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
                Custos
              </th>

              <th className="text-left p-4">
                Lucro
              </th>

              <th className="text-left p-4">
                Margem
              </th>

            </tr>

          </thead>

          <tbody className="text-sm">

            {

              filteredProducts

                .sort(
                  (a, b) =>
                    b.quantity - a.quantity
                )

                .map(
                  (product, index) => {

                    const margin =

                      product.cost > 0

                        ?

                        (
                          (
                            product.profit
                            / product.cost
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
                              product.name
                            }

                          </div>

                          <div className="text-slate-400 text-xs mt-1">

                            SKU:
                            {
                              product.sku
                            }

                          </div>

                        </td>

                        <td className="p-4">

                          <span className={`px-3 py-1 rounded-full text-xs font-semibold

                            ${product.marketplace === "MERCADO_LIVRE"

                              ? "bg-yellow-500 text-black"

                              : "bg-orange-500 text-white"
                            }`}>

                            {
                              product.marketplace
                                ?.replace("_", " ")
                            }

                          </span>

                        </td>

                        <td className="p-4 font-semibold">

                          {
                            product.quantity
                          }

                        </td>

                        <td className="p-4 text-blue-400 font-semibold">

                          R$ {
                            formatCurrency(
                              product.revenue
                            )
                          }

                        </td>

                        <td className="p-4 text-red-400 font-semibold">

                          R$ {
                            formatCurrency(
                              product.cost
                            )
                          }

                        </td>

                        <td className="p-4 text-green-400 font-semibold">

                          R$ {
                            formatCurrency(
                              product.profit
                            )
                          }

                        </td>

                        <td className="p-4 text-yellow-400 font-semibold">

                          {
                            margin
                          }%

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

export default Products