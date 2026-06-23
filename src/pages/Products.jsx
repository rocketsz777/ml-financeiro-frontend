import { useEffect, useState } from "react";
import { Pencil, Save, X, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "../services/api";

function Products() {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [period, setPeriod] = useState("WEEK"); // Padrão semanal inicial
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(null);
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    sku: ""
  });

  // Estado para controle de paginação (Mantido 12 itens por página)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    loadProducts();
    api.get("/api/sales")
      .then(response => {
        setSales(response.data || [])
      })
      .catch(console.error)
  }, []);

  // Reseta para a primeira página ao filtrar ou buscar
  useEffect(() => {
    setCurrentPage(1);
  }, [search, period]);

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

  const now = new Date();

  // FILTRO DE VENDAS POR PERÍODO
  const filteredSales = sales.filter(sale => {
    const targetDate = new Date(sale.soldAt)
    let matchesPeriod = true

    if (period === "DAY") {
      matchesPeriod = targetDate.toDateString() === now.toDateString()
    }

    if (period === "WEEK") {
      const startOfWeek = new Date(now)
      const day = startOfWeek.getDay() === 0 ? 7 : startOfWeek.getDay()
      startOfWeek.setDate(startOfWeek.getDate() - day + 1)
      startOfWeek.setHours(0,0,0,0)
      matchesPeriod = targetDate >= startOfWeek && targetDate <= now
    }

    if (period === "PREVIOUS_WEEK") {
      const startCurrent = new Date(now)
      const day = startCurrent.getDay() === 0 ? 7 : startCurrent.getDay()
      startCurrent.setDate(startCurrent.getDate() - day + 1)
      startCurrent.setHours(0,0,0,0)

      const startPrevious = new Date(startCurrent)
      startPrevious.setDate(startPrevious.getDate() - 7)
      matchesPeriod = targetDate >= startPrevious && targetDate < startCurrent
    }

    if (period === "MONTH") {
      matchesPeriod =
        targetDate.getMonth() === now.getMonth() &&
        targetDate.getFullYear() === now.getFullYear()
    }

    return matchesPeriod
  });

  // LÓGICA DO LOG DE DATAS DINÂMICO (IGUAL AO DASHBOARD)
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
    if (!editing || !product.sku) return;

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
      const sku = editing.value.trim()
      if (!sku) {
        alert("Informe o SKU")
        return
      }
      updates.sku = sku
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

  const productsWithMetrics = filteredProducts.map((product) => {
    const productSales = filteredSales.filter(
      sale => String(sale.sku || "").trim() === String(product.sku || "").trim()
    );

    const unitsSold = productSales.reduce((acc, sale) => acc + Number(sale.quantity || 0), 0);
    const totalProfit = productSales.reduce((acc, sale) => acc + Number(sale.profit || 0), 0);
    const totalCostSold = unitsSold * Number(product.costPrice || 0);

    const adIds = [
      ...new Set(
        productSales.map(sale => sale.marketplaceItemId).filter(Boolean)
      )
    ];

    return {
      ...product,
      unitsSold,
      totalProfit,
      totalCostSold,
      adIds
    };
  });

  const sortedProducts = productsWithMetrics.sort((a, b) => b.unitsSold - a.unitsSold);

  // Paginação dos itens ordenados (12 elementos)
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedProducts.slice(indexOfFirstItem, indexOfLastItem);

  const totalUnitsSold = sortedProducts.reduce((acc, p) => acc + p.unitsSold, 0);
  const totalCostSummary = sortedProducts.reduce((acc, p) => acc + p.totalCostSold, 0);
  const totalProfitSummary = sortedProducts.reduce((acc, p) => acc + p.totalProfit, 0);

  const isEditing = (product, field) =>
    editing?.sku === product.sku && editing?.field === field;

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
      setNewProduct({ name: "", sku: "" })
      await loadProducts()
    } catch (error) {
      console.error(error)
      alert("Erro ao criar produto")
    }
  }

  return (
    <div>
      {/* SEÇÃO DO TOPO */}
      <div className="flex justify-between items-start mb-8">
        {/* ESQUERDA - COM O NOVO LOG DE DATAS DINÂMICO */}
        <div>
          <h1 className="text-4xl font-bold">Produtos</h1>
          <p className="text-slate-400 mt-2">Gestão e performance dos produtos</p>
          <p className="text-xs font-semibold text-cyan-400 mt-3 bg-slate-900/60 inline-block px-3 py-1.5 rounded-lg border border-slate-800 tracking-wide">
            {getPeriodLabel()}
          </p>
        </div>

        {/* CENTRO */}
        <div className="flex gap-4">
          <div className="bg-slate-900 p-4 rounded-xl shadow-lg min-w-[150px]">
            <p className="text-xs text-slate-400">Unidades Vendidas</p>
            <h2 className="text-2xl font-bold text-white mt-1">{totalUnitsSold}</h2>
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

        {/* DIREITA - BOTÃO MÊS PASSADO REMOVIDO */}
        <div className="flex flex-col items-end gap-3">
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
              className="bg-green-600 hover:bg-green-500 px-5 py-3 rounded-xl font-semibold"
            >
              + Novo Produto
            </button>
          </div>

          <div className="flex gap-2 flex-wrap justify-end">
            <button
              onClick={() => setPeriod("DAY")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                period === "DAY" ? "bg-cyan-600 text-white" : "bg-slate-800 text-slate-300"
              }`}
            >
              Diário
            </button>
            <button
              onClick={() => setPeriod("WEEK")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                period === "WEEK" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300"
              }`}
            >
              Semanal
            </button>
            <button
              onClick={() => setPeriod("PREVIOUS_WEEK")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                period === "PREVIOUS_WEEK" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300"
              }`}
            >
              Semana Passada
            </button>
            <button
              onClick={() => setPeriod("MONTH")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                period === "MONTH" ? "bg-green-600 text-white" : "bg-slate-800 text-slate-300"
              }`}
            >
              Mensal
            </button>
          </div>
        </div>
      </div>

      {/* TABELA DE PRODUTOS */}
      <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-lg overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-800">
            <tr>
              <th className="text-left py-2.5 px-4">Produto</th>
              <th className="text-left py-2.5 px-4">SKU</th>
              <th className="text-left py-2.5 px-4">Anúncios</th>
              <th className="text-left py-2.5 px-4">Estoque</th>
              <th className="text-center py-2.5 px-4">Vendidas</th>
              <th className="text-center py-2.5 px-4">Custo Antigo</th>
              <th className="text-center py-2.5 px-4">Custo Atual</th>
              <th className="text-left py-2.5 px-4">Custo Total</th>
              <th className="text-left py-2.5 px-4">Lucro</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {currentItems.map((product, index) => {
              const costEditKey = `${product.sku}-costPrice`;
              const nameEditKey = `${product.sku}-name`;

              return (
                <tr
                  key={product.sku || `${product.name}-${index}`}
                  className="border-t border-slate-800 hover:bg-slate-800 transition"
                >
                  {/* Nome do Produto */}
                  <td className="py-2 px-4 min-w-[420px]">
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

                  {/* SKU */}
                  <td className="py-2 px-4 text-left">
                    {isEditing(product, "sku") ? (
                      <div className="flex items-center gap-2">
                        <input
                          value={editing.value}
                          onChange={(event) => updateEditingValue(event.target.value)}
                          className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 w-full"
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
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{product.sku}</span>
                        <button
                          onClick={() => startEditing(product, "sku")}
                          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700"
                        >
                          <Pencil size={15} />
                        </button>
                      </div>
                    )}
                  </td>

                  {/* Anúncios */}
                  <td className="py-2 px-4">
                    {product.adIds.length === 0 ? (
                      "-"
                    ) : (
                      <details>
                        <summary className="cursor-pointer text-cyan-400 hover:text-cyan-300">
                          {product.adIds.length} anúncio(s)
                        </summary>
                        <div className="mt-2 space-y-1">
                          {product.adIds.map(id => (
                            <div
                              key={id}
                              onClick={() => navigator.clipboard.writeText(id)}
                              className="cursor-pointer text-xs font-mono hover:text-cyan-400"
                            >
                              {id}
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </td>

                  {/* Estoque */}
                  <td className="py-2 px-4 text-center">
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

                  {/* Vendidas */}
                  <td className="py-2 px-4 text-center text-green-400 font-semibold">
                    {product.unitsSold}
                  </td>

                  {/* Custo Antigo */}
                  <td className="py-2 px-4 text-center text-blue-400 font-semibold min-w-[160px]">
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

                  {/* Custo Atual */}
                  <td className="py-2 px-4 text-center text-red-400 font-semibold min-w-[160px]">
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

                  {/* Custo Total */}
                  <td className="py-2 px-4 text-left font-semibold text-slate-300">
                    R$ {formatCurrency(product.totalCostSold)}
                  </td>

                  {/* Lucro */}
                  <td className="py-2 px-4 text-left font-semibold text-green-400">
                    R$ {formatCurrency(product.totalProfit)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* RODAPÉ DINÂMICO COM PAGINAÇÃO */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center bg-slate-800/40 border-t border-slate-800 px-6 py-3">
            <span className="text-xs text-slate-400">
              Página <span className="text-white font-medium">{currentPage}</span> de <span className="text-white font-medium">{totalPages}</span>
            </span>
            <div className="flex gap-1.5 items-center">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40 transition"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    currentPage === i + 1
                      ? "bg-cyan-600 text-white"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40 transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE NOVO PRODUTO */}
      {showNewProductModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6">Novo Produto</h2>
            <div className="space-y-4">
              <input
                placeholder="Nome"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3"
              />
              <input
                placeholder="SKU"
                value={newProduct.sku}
                onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3"
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowNewProductModal(false)}
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
      )}
    </div>
  );
}

export default Products;