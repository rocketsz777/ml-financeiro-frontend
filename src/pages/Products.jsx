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

  // FILTRO DE VENDAS POR PERÍRODO
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
    <div className="w-full px-2 sm:px-4 py-4 max-w-full overflow-hidden">
      {/* SEÇÃO DO TOPO - Totalmente responsiva para Mobile */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6 mb-8">

        {/* ESQUERDA - Título e Log de datas */}
        <div className="w-full lg:w-auto">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Produtos</h1>
          <p className="text-slate-400 mt-1 text-sm">Gestão e performance dos produtos</p>
          <p className="text-[11px] sm:text-xs font-semibold text-cyan-400 mt-3 bg-slate-900/60 inline-block px-3 py-1.5 rounded-lg border border-slate-800 tracking-wide break-words max-w-full">
            {getPeriodLabel()}
          </p>
        </div>

        {/* CENTRO - Cards de Indicadores convertidos para Grid fluido */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto">
          <div className="bg-slate-900 p-4 rounded-xl shadow-lg border border-slate-800/50">
            <p className="text-xs text-slate-400">Unidades Vendidas</p>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">{totalUnitsSold}</h2>
          </div>

          <div className="bg-slate-900 p-4 rounded-xl shadow-lg border border-slate-800/50">
            <p className="text-xs text-slate-400">Custo Total</p>
            <h2 className="text-xl sm:text-2xl font-bold text-red-400 mt-1">
              R$ {formatCurrency(totalCostSummary)}
            </h2>
          </div>

          <div className="bg-slate-900 p-4 rounded-xl shadow-lg border border-slate-800/50">
            <p className="text-xs text-slate-400">Lucro Total</p>
            <h2 className="text-xl sm:text-2xl font-bold text-green-400 mt-1">
              R$ {formatCurrency(totalProfitSummary)}
            </h2>
          </div>
        </div>

        {/* DIREITA - Filtros e Busca adaptados para Android */}
        <div className="flex flex-col items-stretch sm:items-stretch lg:items-end gap-3 w-full lg:w-auto">
          <div className="flex flex-col sm:flex-row gap-2.5 w-full">
            <input
              type="text"
              placeholder="Buscar produto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm w-full lg:w-72 focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={() => setShowNewProductModal(true)}
              className="bg-green-600 hover:bg-green-500 px-5 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap text-center"
            >
              + Novo Produto
            </button>
          </div>

          <div className="flex gap-1.5 flex-wrap w-full justify-start lg:justify-end">
            <button
              onClick={() => setPeriod("DAY")}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex-1 sm:flex-none text-center ${
                period === "DAY" ? "bg-cyan-600 text-white" : "bg-slate-800 text-slate-300"
              }`}
            >
              Diário
            </button>
            <button
              onClick={() => setPeriod("WEEK")}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex-1 sm:flex-none text-center ${
                period === "WEEK" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300"
              }`}
            >
              Semanal
            </button>
            <button
              onClick={() => setPeriod("PREVIOUS_WEEK")}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex-1 sm:flex-none text-center ${
                period === "PREVIOUS_WEEK" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300"
              }`}
            >
              Semana Passada
            </button>
            <button
              onClick={() => setPeriod("MONTH")}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex-1 sm:flex-none text-center ${
                period === "MONTH" ? "bg-green-600 text-white" : "bg-slate-800 text-slate-300"
              }`}
            >
              Mensal
            </button>
          </div>
        </div>
      </div>

      {/* TABELA DE PRODUTOS - Com rolagem horizontal nativa para visualização em tabelas grandes */}
      <div className="bg-slate-900 rounded-2xl shadow-lg border border-slate-800 overflow-x-auto w-full custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-800 text-xs sm:text-sm text-slate-300">
            <tr>
              <th className="py-3 px-4 font-semibold">Produto</th>
              <th className="py-3 px-4 font-semibold">SKU</th>
              <th className="py-3 px-4 font-semibold">Anúncios</th>
              <th className="py-3 px-4 font-semibold text-center">Estoque</th>
              <th className="py-3 px-4 font-semibold text-center">Vendidas</th>
              <th className="py-3 px-4 font-semibold text-center">Custo Antigo</th>
              <th className="py-3 px-4 font-semibold text-center">Custo Atual</th>
              <th className="py-3 px-4 font-semibold">Custo Total</th>
              <th className="py-3 px-4 font-semibold">Lucro</th>
            </tr>
          </thead>
          <tbody className="text-xs sm:text-sm divide-y divide-slate-800/60">
            {currentItems.map((product, index) => {
              const costEditKey = `${product.sku}-costPrice`;
              const nameEditKey = `${product.sku}-name`;

              return (
                <tr
                  key={product.sku || `${product.name}-${index}`}
                  className="hover:bg-slate-800/40 transition-colors"
                >
                  {/* Nome do Produto */}
                  <td className="py-3 px-4 min-w-[340px] sm:min-w-[420px]">
                    {isEditing(product, "name") ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          value={editing.value}
                          onChange={(event) => updateEditingValue(event.target.value)}
                          className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 w-full text-sm"
                          autoFocus
                        />
                        <button
                          title="Salvar nome"
                          onClick={() => saveEditing(product)}
                          disabled={saving === nameEditKey}
                          className="p-2 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-60 flex-shrink-0"
                        >
                          <Save size={14} />
                        </button>
                        <button
                          title="Cancelar"
                          onClick={cancelEditing}
                          className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 flex-shrink-0"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-start gap-1.5 group">
                        <div className="max-w-[280px] sm:max-w-md">
                          <div className="font-semibold text-slate-100 line-clamp-2">{product.name}</div>
                          <div className="text-slate-500 text-[11px] mt-0.5 font-mono">
                            SKU: {product.sku}
                          </div>
                        </div>
                        <button
                          title="Editar nome"
                          onClick={() => startEditing(product, "name")}
                          disabled={!product.sku}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-40"
                        >
                          <Pencil size={13} />
                        </button>
                      </div>
                    )}
                  </td>

                  {/* SKU */}
                  <td className="py-3 px-4 font-mono text-xs whitespace-nowrap">
                    {isEditing(product, "sku") ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          value={editing.value}
                          onChange={(event) => updateEditingValue(event.target.value)}
                          className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 w-full text-xs font-mono"
                          autoFocus
                        />
                        <button
                          onClick={() => saveEditing(product)}
                          className="p-1.5 rounded-lg bg-green-600 hover:bg-green-500"
                        >
                          <Save size={14} />
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <span className="text-slate-300">{product.sku}</span>
                        <button
                          onClick={() => startEditing(product, "sku")}
                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                          <Pencil size={13} />
                        </button>
                      </div>
                    )}
                  </td>

                  {/* Anúncios */}
                  <td className="py-3 px-4 text-xs whitespace-nowrap">
                    {product.adIds.length === 0 ? (
                      <span className="text-slate-600">-</span>
                    ) : (
                      <details className="cursor-pointer">
                        <summary className="text-cyan-400 hover:text-cyan-300 font-medium">
                          {product.adIds.length} anúncio(s)
                        </summary>
                        <div className="mt-1.5 bg-slate-950/60 p-2 rounded-lg border border-slate-800/60 space-y-1 max-h-24 overflow-y-auto">
                          {product.adIds.map(id => (
                            <div
                              key={id}
                              onClick={() => {
                                navigator.clipboard.writeText(id);
                                alert("ID copiado!");
                              }}
                              className="cursor-pointer text-[10px] font-mono text-slate-400 hover:text-cyan-400 p-0.5 rounded transition-colors"
                            >
                              {id}
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </td>

                  {/* Estoque */}
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    {isEditing(product, "stockQuantity") ? (
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          value={editing.value}
                          onChange={(event) => updateEditingValue(event.target.value)}
                          className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 w-16 text-center text-sm"
                          autoFocus
                        />
                        <button
                          onClick={() => saveEditing(product)}
                          className="p-1.5 rounded-lg bg-green-600 hover:bg-green-500"
                        >
                          <Save size={14} />
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEditing(product, "stockQuantity")}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 hover:bg-slate-800 text-slate-200"
                      >
                        <span className="font-semibold">{product.stockQuantity}</span>
                        <Pencil size={13} className="text-slate-500" />
                      </button>
                    )}
                  </td>

                  {/* Vendidas */}
                  <td className="py-3 px-4 text-center text-green-400 font-bold whitespace-nowrap">
                    {product.unitsSold}
                  </td>

                  {/* Custo Antigo */}
                  <td className="py-3 px-4 text-center min-w-[140px] whitespace-nowrap">
                    {isEditing(product, "oldCostPrice") ? (
                      <div className="flex items-center justify-center gap-1">
                        <input
                          value={editing.value}
                          onChange={(event) => updateEditingValue(event.target.value)}
                          className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 w-20 text-sm text-center text-white"
                          autoFocus
                        />
                        <button
                          onClick={() => saveEditing(product)}
                          className="p-1.5 rounded-lg bg-green-600 hover:bg-green-500"
                        >
                          <Save size={14} />
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEditing(product, "oldCostPrice")}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-blue-400 font-semibold hover:bg-slate-800"
                      >
                        <span>R$ {formatCurrency(product.oldCostPrice || 0)}</span>
                        <Pencil size={13} className="text-slate-600" />
                      </button>
                    )}
                  </td>

                  {/* Custo Atual */}
                  <td className="py-3 px-4 text-center min-w-[140px] whitespace-nowrap">
                    {isEditing(product, "costPrice") ? (
                      <div className="flex items-center justify-center gap-1">
                        <input
                          value={editing.value}
                          onChange={(event) => updateEditingValue(event.target.value)}
                          className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 w-20 text-sm text-center text-white"
                          autoFocus
                        />
                        <button
                          title="Salvar custo"
                          onClick={() => saveEditing(product)}
                          disabled={saving === costEditKey}
                          className="p-1.5 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-60"
                        >
                          <Save size={14} />
                        </button>
                        <button
                          title="Cancelar"
                          onClick={cancelEditing}
                          className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        title="Editar custo"
                        onClick={() => startEditing(product, "costPrice")}
                        disabled={!product.sku}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-red-400 font-semibold hover:bg-slate-800 hover:text-red-300 disabled:opacity-40"
                      >
                        <span>R$ {formatCurrency(product.costPrice || 0)}</span>
                        <Pencil size={13} className="text-slate-600" />
                      </button>
                    )}
                  </td>

                  {/* Custo Total */}
                  <td className="py-3 px-4 font-semibold text-slate-300 whitespace-nowrap">
                    R$ {formatCurrency(product.totalCostSold)}
                  </td>

                  {/* Lucro */}
                  <td className="py-3 px-4 font-bold text-green-400 whitespace-nowrap">
                    R$ {formatCurrency(product.totalProfit)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* RODAPÉ DINÂMICO COM PAGINAÇÃO RESTRUTURADA PARA MOBILE */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-800/40 border-t border-slate-800 px-4 sm:px-6 py-4 sm:py-3">
            <span className="text-xs text-slate-400">
              Página <span className="text-white font-medium">{currentPage}</span> de <span className="text-white font-medium">{totalPages}</span>
            </span>
            <div className="flex gap-1.5 items-center overflow-x-auto max-w-full py-1 snap-x scroll-smooth">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40 transition-colors flex-shrink-0"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex-shrink-0 snap-center ${
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
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40 transition-colors flex-shrink-0"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE NOVO PRODUTO - Adicionado margem e padding inteligente para celulares */}
      {showNewProductModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-slate-900 rounded-2xl p-5 sm:p-6 w-full max-w-md border border-slate-800 shadow-2xl">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-5">Novo Produto</h2>
            <div className="space-y-3.5">
              <input
                placeholder="Nome do Produto"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
              <input
                placeholder="SKU"
                value={newProduct.sku}
                onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
            <div className="flex justify-end gap-2.5 mt-6">
              <button
                onClick={() => setShowNewProductModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={createProduct}
                className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-colors"
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