import { useEffect, useState } from "react";
import { Pencil, Save, X } from "lucide-react";
import { api } from "../services/api";

function Products() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(null);
  const [showNewProductModal, setShowNewProductModal] = useState(false)
  const [newProduct, setNewProduct] =
    useState({
      name: "",
      sku: ""
    });

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      const response = await api.get("/api/produtos");
      const products = (response.data || []).map((product) => ({
        sku: product.sku,
        name: product.name,
        mlItemId: product.mlItemId || "",
        stockQuantity: Number(product.stockQuantity || 0),
        costPrice: Number(product.costPrice || 0),
        oldCostPrice: Number(product.oldCostPrice || 0),
        marketplace: product.marketplace || "CADASTRO",
        quantitySold: 0,
        revenue: 0,
        cost: 0,
        profit: 0,
        registered: true,
      }));
      setProducts(products);
    } catch (error) {
      console.error(error);
    }
  }

  const formatCurrency = (value) => {
    return Number(value || 0).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const parseCurrency = (value) => {
    const cleaned = String(value || "")
      .trim()
      .replace(/\s/g, "")
      .replace("R$", "");

    const normalized = cleaned.includes(",")
      ? cleaned.replace(/\./g, "").replace(",", ".")
      : cleaned;

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  };

 const buildProductPayload = (product, updates) => ({
   sku: updates.sku ?? product.sku,
   mlItemId: product.mlItemId || null,
   name: updates.name ?? product.name ?? product.sku,
   costPrice: updates.costPrice ?? product.costPrice ?? 0,
   oldCostPrice: updates.oldCostPrice ?? product.oldCostPrice ?? 0,
   stockQuantity: updates.stockQuantity ?? product.stockQuantity ?? 0,
 });

  const startEditing = (product, field) => {
    let value = "";

    if (field === "costPrice" || field === "oldCostPrice") {
      value = String(
        field === "costPrice" ? product.costPrice || 0 : product.oldCostPrice || 0
      ).replace(".", ",");
     } else if (field === "stockQuantity") {

       value = String(product.stockQuantity || 0);

     } else if (field === "sku") {

       value = product.sku || "";

     } else if (field === "name") {

       value = product.name || "";
     }

    setEditing({
      sku: product.sku,
      field,
      value,
    });
  };

  const updateEditingValue = (value) => {
    setEditing((current) => ({
      ...current,
      value,
    }));
  };

  const cancelEditing = () => {
    setEditing(null);
  };

  const saveEditing = async (product) => {
    if (!editing || !product.sku) {
      return;
    }

    const updates = {};

    if (editing.field === "name") {
      const name = editing.value.trim();
      if (!name) {
        alert("Informe o nome do produto");
        return;
      }
      updates.name = name;
    }
    if (editing.field === "sku") {

      const sku =
        editing.value.trim()

      if (!sku) {

        alert("Informe o SKU")

        return
      }

      updates.sku =
        sku
    }

    if (editing.field === "costPrice") {
      const costPrice = parseCurrency(editing.value);
      if (costPrice === null) {
        alert("Informe um custo valido");
        return;
      }
      updates.costPrice = costPrice;
    }

    if (editing.field === "oldCostPrice") {
      const oldCostPrice = parseCurrency(editing.value);
      if (oldCostPrice === null) {
        alert("Informe um custo valido");
        return;
      }
      updates.oldCostPrice = oldCostPrice;
    }

    if (editing.field === "stockQuantity") {
      const stockQuantity = Number(editing.value);
      if (Number.isNaN(stockQuantity)) {
        alert("Informe um estoque valido");
        return;
      }
      updates.stockQuantity = stockQuantity;
    }

    const editKey = `${product.sku}-${editing.field}`;

    try {
      setSaving(editKey);
      const payload = buildProductPayload(product, updates);

      if (product.registered) {
        await api.put(`/api/produtos/${encodeURIComponent(product.sku)}`, payload);
      } else {
        await api.post("/api/produtos", payload);
      }

      setEditing(null);
      await loadProducts();
    } catch (error) {
      console.error(error);
      alert("Nao foi possivel salvar o produto");
    } finally {
      setSaving(null);
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name?.toLowerCase().includes(search.toLowerCase()) ||
      product.sku?.toLowerCase().includes(search.toLowerCase())
  );

  const isEditing = (product, field) =>
    editing?.sku === product.sku && editing?.field === field;

  const displayCost = (product) => {
    if (product.costPrice && product.quantitySold) {
      return Number(product.costPrice) * Number(product.quantitySold);
    }
    return product.cost;
  };
  const createProduct = async () => {

    if (!newProduct.name.trim()) {

      alert("Informe o nome")

      return
    }

    if (!newProduct.sku.trim()) {

      alert("Informe o SKU")

      return
    }

    try {

      await api.post(
        "/api/produtos",
        {
          name: newProduct.name,
          sku: newProduct.sku,
          mlItemId: null,
          stockQuantity: 0,
          costPrice: 0
        }
      )

      setShowNewProductModal(false)

      setNewProduct({
        name: "",
        sku: ""
      })

      await loadProducts()

    } catch (error) {

      console.error(error)

      alert("Erro ao criar produto")
    }
  }

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold">Produtos</h1>
          <p className="text-slate-400 mt-2">Gestão e performance dos produtos</p>
        </div>

        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Buscar produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 w-72"
          />

          <button
            onClick={() => setShowNewProductModal(true)}
            className="bg-green-600 hover:bg-green-500 px-4 py-3 rounded-xl font-semibold"
          >
            + Novo Produto
          </button>
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-lg overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-800">
            <tr>
              <th className="text-left p-4">Produto</th>
              <th className="text-left p-4">SKU</th>
              <th className="text-left p-4">Anúncio ID</th>
              <th className="text-left p-4">Estoque</th>
              <th className="text-left p-4">Custo Antigo</th>
              <th className="text-left p-4">Custo Atual</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {filteredProducts
              .sort((a, b) => b.quantitySold - a.quantitySold)
              .map((product, index) => {
                const totalCost = displayCost(product);
                const profit = product.costPrice
                  ? product.revenue - totalCost
                  : product.profit;
                const margin =
                  totalCost > 0 ? ((profit / totalCost) * 100).toFixed(2) : 0;

                const costEditKey = `${product.sku}-costPrice`;
                const nameEditKey = `${product.sku}-name`;

                return (
                  <tr
                    key={product.sku || `${product.name}-${index}`}
                    className="border-t border-slate-800 hover:bg-slate-800 transition"
                  >
                    <td className="p-4 min-w-[420px]">
                      {isEditing(product, "name") ? (
                        <div className="flex items-center gap-2">
                          <input
                            value={editing.value}
                            onChange={(event) => updateEditingValue(event.target.value)}
                            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 w-full"
                            autoFocus
                          />
                          <button
                            title="Salvar nome"
                            onClick={() => saveEditing(product)}
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
                      ) : (
                        <div className="flex items-start gap-2">
                          <div>
                            <div className="font-semibold">{product.name}</div>
                            <div className="text-slate-400 text-xs mt-1">
                              SKU: {product.sku}
                            </div>
                          </div>
                          <button
                            title="Editar nome"
                            onClick={() => startEditing(product, "name")}
                            disabled={!product.sku}
                            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-40"
                          >
                            <Pencil size={15} />
                          </button>
                        </div>
                      )}
                    </td>

                    <td className="p-4">

                      {
                        isEditing(product, "sku")

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
                              onClick={() =>
                                saveEditing(product)
                              }
                              className="p-2 rounded-lg bg-green-600 hover:bg-green-500"
                            >
                              <Save size={16} />
                            </button>

                            <button
                              onClick={cancelEditing}
                              className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600"
                            >
                              <X size={16} />
                            </button>

                          </div>

                          :

                          <div className="flex items-center gap-2">

                            <span className="font-mono text-sm">

                              {product.sku}

                            </span>

                            <button
                              onClick={() =>
                                startEditing(
                                  product,
                                  "sku"
                                )
                              }
                              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700"
                            >
                              <Pencil size={15} />
                            </button>

                          </div>
                      }

                    </td>

                    <td className="p-4 font-mono text-sm">{product.mlItemId || "-"}</td>

                    <td className="p-4">
                      {isEditing(product, "stockQuantity") ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={editing.value}
                            onChange={(event) => updateEditingValue(event.target.value)}
                            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 w-24"
                            autoFocus
                          />
                          <button
                            onClick={() => saveEditing(product)}
                            className="p-2 rounded-lg bg-green-600 hover:bg-green-500"
                          >
                            <Save size={16} />
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditing(product, "stockQuantity")}
                          className="inline-flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-slate-700"
                        >
                          <span>{product.stockQuantity}</span>
                          <Pencil size={15} />
                        </button>
                      )}
                    </td>

                    <td className="p-4 text-blue-400 font-semibold min-w-[160px]">
                      {isEditing(product, "oldCostPrice") ? (
                        <div className="flex items-center gap-2">
                          <input
                            value={editing.value}
                            onChange={(event) => updateEditingValue(event.target.value)}
                            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 w-28 text-white"
                            autoFocus
                          />
                          <button
                            onClick={() => saveEditing(product)}
                            className="p-2 rounded-lg bg-green-600 hover:bg-green-500"
                          >
                            <Save size={16} />
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditing(product, "oldCostPrice")}
                          className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-blue-400 hover:bg-slate-700"
                        >
                          <span>R$ {formatCurrency(product.oldCostPrice || 0)}</span>
                          <Pencil size={15} />
                        </button>
                      )}
                    </td>

                    <td className="p-4 text-red-400 font-semibold min-w-[160px]">
                      {isEditing(product, "costPrice") ? (
                        <div className="flex items-center gap-2">
                          <input
                            value={editing.value}
                            onChange={(event) => updateEditingValue(event.target.value)}
                            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 w-28 text-white"
                            autoFocus
                          />
                          <button
                            title="Salvar custo"
                            onClick={() => saveEditing(product)}
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
                      ) : (
                        <button
                          title="Editar custo"
                          onClick={() => startEditing(product, "costPrice")}
                          disabled={!product.sku}
                          className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-red-400 hover:bg-slate-700 hover:text-red-300 disabled:opacity-40"
                        >
                          <span>R$ {formatCurrency(product.costPrice || 0)}</span>
                          <Pencil size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>

          </div>

          {
            showNewProductModal && (

              <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

                <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-md">

                  <h2 className="text-2xl font-bold mb-6">

                    Novo Produto

                  </h2>

                  <div className="space-y-4">

                    <input
                      placeholder="Nome"
                      value={newProduct.name}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          name: e.target.value
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3"
                    />

                    <input
                      placeholder="SKU"
                      value={newProduct.sku}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          sku: e.target.value
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3"
                    />

                  </div>

                  <div className="flex justify-end gap-3 mt-6">

                    <button
                      onClick={() =>
                        setShowNewProductModal(false)
                      }
                      className="px-4 py-2 rounded-xl bg-slate-700"
                    >
                      Cancelar
                    </button>

                    <button
                      onClick={createProduct}
                      className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500"
                    >
                      Salvar
                    </button>

                  </div>

                </div>

              </div>
            )
          }

        </div>
      )
}

export default Products;