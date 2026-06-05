import { useEffect, useState } from "react"
import {
  Pencil,
  Save,
  X
} from "lucide-react"
import { api } from "../services/api";

function Products() {

  const [products, setProducts] =
    useState([])

  const [search, setSearch] =
    useState("")

  const [editing, setEditing] =
    useState(null)

  const [saving, setSaving] =
    useState(null)

  useEffect(() => {

    loadProducts()

  }, [])

  async function loadProducts() {

    try {

      const [
        salesResponse,
        productsResponse
      ] =
        await Promise.all([
          api.get("/api/sales"),
          api
            .get("/api/produtos")
            .catch(() => ({ data: [] }))
        ])

      const groupedProducts =
        new Map()

      ;(salesResponse.data || []).forEach(
        (sale, index) => {

          const key =
            sale.sku
            || sale.productName
            || `produto-${index}`

          if (!groupedProducts.has(key)) {

            groupedProducts.set(
              key,
              {
                sku: sale.sku,
                name: sale.productName,
                marketplace: sale.marketplace,
                mlItemId: "",
                stockQuantity: 0,
                quantitySold: 0,
                revenue: 0,
                cost: 0,
                costPrice: Number(sale.productCost || 0),
                profit: 0,
                registered: false
              }
            )
          }

          const product =
            groupedProducts.get(key)

          product.quantitySold +=
            Number(sale.quantity || 0)

          product.revenue +=
            Number(sale.grossAmount || 0)

          product.cost +=
            Number(sale.productCost || 0)
            * Number(sale.quantity || 0)

          product.profit +=
            Number(sale.profit || 0)
        }
      )

      ;(productsResponse.data || []).forEach(
        product => {

          const key =
            product.sku
            || product.name

          const existing =
            groupedProducts.get(key) || {
              sku: product.sku,
              name: product.name,
              marketplace: "",
              quantitySold: 0,
              revenue: 0,
              cost: 0,
              profit: 0
            }

          groupedProducts.set(
            key,
            {
              ...existing,
              sku: product.sku,
              name: product.name || existing.name,
              mlItemId: product.mlItemId || "",
              stockQuantity: Number(product.stockQuantity || 0),
              costPrice: Number(product.costPrice || 0),
              registered: true
            }
          )
        }
      )

      setProducts(
        Array.from(
          groupedProducts.values()
        )
      )

    } catch (error) {

      console.error(error)

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

  const parseCurrency = (value) => {

    const cleaned =
      String(value || "")
        .trim()
        .replace(/\s/g, "")
        .replace("R$", "")

    const normalized =
      cleaned.includes(",")
        ? cleaned.replace(/\./g, "").replace(",", ".")
        : cleaned

    const parsed =
      Number(normalized)

    return Number.isFinite(parsed)
      ? parsed
      : null
  }

  const buildProductPayload = (
    product,
    updates
  ) => ({
    sku: product.sku,
    mlItemId: product.mlItemId || "",
    name: updates.name ?? product.name ?? product.sku,
    costPrice: updates.costPrice ?? product.costPrice ?? 0,
    stockQuantity: updates.stockQuantity ?? product.stockQuantity ?? 0
  })

  const startEditing = (
    product,
    field
  ) => {

    setEditing({
      sku: product.sku,
      field,
      value: field === "costPrice"
        ? String(product.costPrice || 0).replace(".", ",")
        : product.name || ""
    })
  }

  const updateEditingValue = (value) => {

    setEditing(current => ({
      ...current,
      value
    }))
  }

  const cancelEditing = () => {

    setEditing(null)
  }

  const saveEditing = async (product) => {

    if (!editing || !product.sku) {

      return
    }

    const updates = {}

    if (editing.field === "name") {

      const name =
        editing.value.trim()

      if (!name) {

        alert("Informe o nome do produto")

        return
      }

      updates.name =
        name
    }

    if (editing.field === "costPrice") {

      const costPrice =
        parseCurrency(editing.value)

      if (costPrice === null) {

        alert("Informe um custo valido")

        return
      }

      updates.costPrice =
        costPrice
    }

    const editKey =
      `${product.sku}-${editing.field}`

    try {

      setSaving(editKey)

      const payload =
        buildProductPayload(
          product,
          updates
        )

      if (product.registered) {

        await api.put(
          `/api/produtos/${encodeURIComponent(product.sku)}`,
          payload
        )

      } else {

        await api.post(
          "/api/produtos",
          payload
        )
      }

      setEditing(null)

      await loadProducts()

    } catch (error) {

      console.error(error)

      alert("Nao foi possivel salvar o produto")

    } finally {

      setSaving(null)
    }
  }

  const filteredProducts =

    products.filter(
      product =>

        product.name
          ?.toLowerCase()

          .includes(
            search.toLowerCase()
          )
        || product.sku
          ?.toLowerCase()

          .includes(
            search.toLowerCase()
          )
    )

  const marketplaceClass = (marketplace) =>
    marketplace === "MERCADO_LIVRE"

      ?

      "bg-yellow-500 text-black"

      :

      marketplace === "SHOPEE"

        ?

        "bg-orange-500 text-white"

        :

        "bg-slate-700 text-slate-200"

  const marketplaceName = (marketplace) =>
    marketplace
      ? marketplace.replace("_", " ")
      : "CADASTRO"

  const isEditing = (
    product,
    field
  ) =>
    editing?.sku === product.sku
    && editing?.field === field

  const displayCost = (product) => {

    if (
      product.costPrice
      && product.quantitySold
    ) {

      return Number(product.costPrice)
        * Number(product.quantitySold)
    }

    return product.cost
  }

  return (

    <div>

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
                Estoque
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
                    b.quantitySold - a.quantitySold
                )

                .map(
                  (product, index) => {

                    const totalCost =
                      displayCost(product)

                    const profit =
                      product.costPrice
                        ? product.revenue - totalCost
                        : product.profit

                    const margin =

                      totalCost > 0

                        ?

                        (
                          (
                            profit
                            / totalCost
                          ) * 100
                        ).toFixed(2)

                        :

                        0

                    const costEditKey =
                      `${product.sku}-costPrice`

                    const nameEditKey =
                      `${product.sku}-name`

                    return (

                      <tr

                        key={product.sku || `${product.name}-${index}`}

                        className="border-t border-slate-800 hover:bg-slate-800 transition"
                      >

                        <td className="p-4 min-w-[420px]">

                          {
                            isEditing(product, "name")

                              ?

                              <div className="flex items-center gap-2">

                                <input
                                  value={editing.value}
                                  onChange={(event) =>
                                    updateEditingValue(
                                      event.target.value
                                    )
                                  }
                                  className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 w-full"
                                  autoFocus
                                />

                                <button
                                  title="Salvar nome"
                                  onClick={() =>
                                    saveEditing(product)
                                  }
                                  disabled={saving === nameEditKey}
                                  className="p-2 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-60"
                                >
                                  <Save size={16} />
                                </button>

                                <button
                                  title="Cancelar"
                                  onClick={cancelEditing}
                                  className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600"
                                >
                                  <X size={16} />
                                </button>

                              </div>

                              :

                              <div className="flex items-start gap-2">

                                <div>

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

                                </div>

                                <button
                                  title="Editar nome"
                                  onClick={() =>
                                    startEditing(
                                      product,
                                      "name"
                                    )
                                  }
                                  disabled={!product.sku}
                                  className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-40"
                                >
                                  <Pencil size={15} />
                                </button>

                              </div>
                          }

                        </td>

                        <td className="p-4">

                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${marketplaceClass(product.marketplace)}`}>

                            {
                              marketplaceName(product.marketplace)
                            }

                          </span>

                        </td>

                        <td className="p-4 font-semibold">

                          {
                            product.stockQuantity
                          }

                        </td>

                        <td className="p-4 text-blue-400 font-semibold">

                          R$ {
                            formatCurrency(
                              product.revenue
                            )
                          }

                        </td>

                        <td className="p-4 text-red-400 font-semibold min-w-[160px]">

                          {
                            isEditing(product, "costPrice")

                              ?

                              <div className="flex items-center gap-2">

                                <input
                                  value={editing.value}
                                  onChange={(event) =>
                                    updateEditingValue(
                                      event.target.value
                                    )
                                  }
                                  className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 w-28 text-white"
                                  autoFocus
                                />

                                <button
                                  title="Salvar custo"
                                  onClick={() =>
                                    saveEditing(product)
                                  }
                                  disabled={saving === costEditKey}
                                  className="p-2 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-60"
                                >
                                  <Save size={16} />
                                </button>

                                <button
                                  title="Cancelar"
                                  onClick={cancelEditing}
                                  className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600"
                                >
                                  <X size={16} />
                                </button>

                              </div>

                              :

                              <button
                                title="Editar custo"
                                onClick={() =>
                                  startEditing(
                                    product,
                                    "costPrice"
                                  )
                                }
                                disabled={!product.sku}
                                className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-red-400 hover:bg-slate-700 hover:text-red-300 disabled:opacity-40"
                              >

                                <span>

                                  R$ {
                                    formatCurrency(
                                      totalCost
                                    )
                                  }

                                </span>

                                <Pencil size={15} />

                              </button>
                          }

                        </td>

                        <td className="p-4 text-green-400 font-semibold">

                          R$ {
                            formatCurrency(
                              profit
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
