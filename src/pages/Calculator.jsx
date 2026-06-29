import { useState, useMemo, useEffect } from "react";

export default function Calculator() {
  // Estado para escolher a plataforma
  const [platform, setPlatform] = useState("MERCADO_LIVRE"); // "MERCADO_LIVRE" ou "SHOPEE"

  // Estados comuns
  const [sellingPrice, setSellingPrice] = useState("");
  const [productCost, setProductCost] = useState("");
  const [taxPercent, setTaxPercent] = useState("0");
  const [desiredProfit, setDesiredProfit] = useState(""); // <-- Novo estado para o lucro desejado

  // Estados específicos do Mercado Livre
  const [mlListingType, setMlListingType] = useState("CLASSICO"); // CLASSICO ou PREMIUM
  const [mlIsFreeShipping, setMlIsFreeShipping] = useState(false);
  const [mlShippingCost, setMlShippingCost] = useState("25");

  // Estados específicos da Shopee
  const [shopeeHasFreeShippingProgram, setShopeeHasFreeShippingProgram] = useState(true); // Participa do programa de frete grátis (+6%)?
  const [shopeeExtraCost, setShopeeExtraCost] = useState("0"); // Custos extras (embalagem, etc)

  // FUNÇÃO PARA LIMPAR TODOS OS DADOS MANUALMENTE
  const handleClear = () => {
    setSellingPrice("");
    setProductCost("");
    setTaxPercent("0");
    setDesiredProfit("");
    setMlIsFreeShipping(false);
    setMlShippingCost("25");
    setShopeeExtraCost("0");
  };

  // CÁLCULO UNIFICADO REATIVO
  const results = useMemo(() => {
    const price = Number(sellingPrice) || 0;
    const cost = Number(productCost) || 0;
    const taxRate = Number(taxPercent) || 0;

    if (price === 0) return null;

    let commission = 0;
    let commissionPercent = 0;
    let fixedFee = 0;
    let shippingFee = 0;
    const taxAmount = price * (taxRate / 100);

    // LÓGICA MERCADO LIVRE
    if (platform === "MERCADO_LIVRE") {
      commissionPercent = mlListingType === "PREMIUM" ? 0.17 : 0.12;
      commission = price * commissionPercent;
      fixedFee = price < 79 ? 6.50 : 0;

      const requiresFreeShipping = price >= 79 || mlIsFreeShipping;
      shippingFee = requiresFreeShipping ? (Number(mlShippingCost) || 0) : 0;
    }

    // LÓGICA SHOPEE
    else if (platform === "SHOPEE") {
      commissionPercent = shopeeHasFreeShippingProgram ? 0.20 : 0.14;

      const calculatedCommission = price * commissionPercent;
      commission = Math.min(calculatedCommission, 100); // Teto de R$100 da Shopee
      fixedFee = 4.00;
      shippingFee = Number(shopeeExtraCost) || 0;
    }

    // Totais, Lucro e Margem corrigida (Sobre o Custo do Produto)
    const totalExpenses = commission + fixedFee + shippingFee + taxAmount;
    const profit = price - cost - totalExpenses;
    const margin = cost > 0 ? (profit / cost) * 100 : 0; // <-- Ajustado para ser em relação ao custo

    return {
      commission,
      commissionPercent: commissionPercent * 100,
      fixedFee,
      shippingFee,
      taxAmount,
      totalExpenses,
      profit,
      margin,
    };
  }, [
    platform, sellingPrice, productCost, taxPercent,
    mlListingType, mlIsFreeShipping, mlShippingCost,
    shopeeHasFreeShippingProgram, shopeeExtraCost
  ]);

  // Sincroniza o campo de "Lucro Desejado" sempre que o lucro calculado mudar,
  // mas apenas se o usuário não estiver digitando diretamente no próprio campo de lucro desejado.
  useEffect(() => {
    if (document.activeElement?.id !== "desiredProfitInput" && results) {
      setDesiredProfit(results.profit > 0 ? results.profit.toFixed(2) : "");
    }
  }, [results]);

  // FUNÇÃO DE CÁLCULO REVERSO (Lucro Desejado -> Preço de Venda)
  const handleDesiredProfitChange = (val) => {
    setDesiredProfit(val);
    const targetProfit = Number(val) || 0;
    const cost = Number(productCost) || 0;
    const taxRate = (Number(taxPercent) || 0) / 100;

    if (targetProfit <= 0 && val === "") return;

    let calculatedPrice = 0;

    if (platform === "MERCADO_LIVRE") {
      const commRate = mlListingType === "PREMIUM" ? 0.17 : 0.12;

      // Cenário A: Se o preço final for >= 79 (Frete grátis obrigatório, sem taxa fixa de 6.50)
      const mlShipping = Number(mlShippingCost) || 0;
      const priceHigh = (cost + mlShipping + targetProfit) / (1 - commRate - taxRate);

      // Cenário B: Se o preço final for < 79 (Taxa fixa de 6.50, frete opcional)
      const shippingLow = mlIsFreeShipping ? (Number(mlShippingCost) || 0) : 0;
      const priceLow = (cost + 6.50 + shippingLow + targetProfit) / (1 - commRate - taxRate);

      if (priceHigh >= 79) {
        calculatedPrice = priceHigh;
      } else if (priceLow < 79) {
        calculatedPrice = priceLow;
      } else {
        calculatedPrice = priceHigh;
      }
    }

    else if (platform === "SHOPEE") {
      const commRate = shopeeHasFreeShippingProgram ? 0.20 : 0.14;
      const extraCost = Number(shopeeExtraCost) || 0;

      // Testa primeiro sem o teto de R$ 100 de comissão da Shopee
      const priceNoCap = (cost + 4.00 + extraCost + targetProfit) / (1 - commRate - taxRate);

      if (priceNoCap * commRate <= 100) {
        calculatedPrice = priceNoCap;
      } else {
        // Se a comissão estourar R$ 100, recalculamos fixando a comissão em R$ 100
        calculatedPrice = (cost + 104.00 + extraCost + targetProfit) / (1 - taxRate);
      }
    }

    if (calculatedPrice > 0) {
      setSellingPrice(calculatedPrice.toFixed(2));
    } else {
      setSellingPrice("");
    }
  };

  const formatCurrency = (value) => {
    return Number(value || 0).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      {/* SELETOR DE PLATAFORMA + BOTÃO LIMPAR - Layout adaptável para Mobile */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex flex-1 gap-2">
          <button
            onClick={() => setPlatform("MERCADO_LIVRE")}
            className={`flex-1 py-3 rounded-xl font-bold border text-center text-sm sm:text-base transition ${
              platform === "MERCADO_LIVRE"
                ? "bg-yellow-500 text-black border-yellow-500"
                : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700"
            }`}
          >
            Mercado Livre
          </button>
          <button
            onClick={() => setPlatform("SHOPEE")}
            className={`flex-1 py-3 rounded-xl font-bold border text-center text-sm sm:text-base transition ${
              platform === "SHOPEE"
                ? "bg-orange-600 text-white border-orange-600"
                : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700"
            }`}
          >
            Shopee
          </button>
        </div>

        {/* NOVO: Botão Limpar posicionado convenientemente para uso mobile */}
        <button
          onClick={handleClear}
          className="py-3 px-5 rounded-xl font-bold border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm sm:text-base transition text-center"
        >
          Limpar Dados
        </button>
      </div>

      {/* GRID PRINCIPAL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">

        {/* FORMULÁRIO DE ENTRADA */}
        <div className="bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-800 flex flex-col gap-4 sm:gap-5">

          {/* Custo do Produto */}
          <div>
            <label className="text-xs sm:text-sm font-semibold text-slate-300 block mb-1.5">Custo do Produto (R$)</label>
            <input
              type="number"
              placeholder="Ex: 30.00"
              value={productCost}
              onChange={(e) => setProductCost(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 sm:py-3 w-full text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Preço de Venda Pretendido */}
          <div>
            <label className="text-xs sm:text-sm font-semibold text-slate-300 block mb-1.5">Preço de Venda Pretendido (R$)</label>
            <input
              type="number"
              placeholder="Ex: 120.00"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 sm:py-3 w-full text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* ================= CONFIGURAÇÕES DO MERCADO LIVRE ================= */}
          {platform === "MERCADO_LIVRE" && (
            <>
              <div>
                <label className="text-xs sm:text-sm font-semibold text-slate-300 block mb-1.5">Tipo de Anúncio</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMlListingType("CLASSICO")}
                    className={`py-2.5 rounded-xl font-semibold text-[11px] sm:text-xs px-1 text-center transition-colors ${
                      mlListingType === "CLASSICO" ? "bg-yellow-500 text-black" : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    Clássico (~12%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMlListingType("PREMIUM")}
                    className={`py-2.5 rounded-xl font-semibold text-[11px] sm:text-xs px-1 text-center transition-colors ${
                      mlListingType === "PREMIUM" ? "bg-orange-500 text-white" : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    Premium (~17%)
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-800/80 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs sm:text-sm font-semibold text-slate-300">Oferecer Frete Grátis?</label>
                  <input
                    type="checkbox"
                    disabled={Number(sellingPrice) >= 79}
                    checked={Number(sellingPrice) >= 79 || mlIsFreeShipping}
                    onChange={(e) => {
                      if (typeof setMlIsFreeShipping === "function") {
                        setMlIsFreeShipping(e.target.checked);
                      } else {
                        mlIsFreeShipping(e.target.checked);
                      }
                    }}
                    className="w-5 h-5 accent-blue-500 cursor-pointer disabled:opacity-50"
                  />
                </div>
                {Number(sellingPrice) >= 79 && (
                  <p className="text-[11px] text-yellow-400 font-medium mb-2">⚠️ Grátis obrigatório pelo M.L. (A partir de R$ 79)</p>
                )}

                {(mlIsFreeShipping || Number(sellingPrice) >= 79) && (
                  <div className="mt-1">
                    <span className="text-xs text-slate-400 block mb-1">Custo do envio (Tabela Mercado Envios):</span>
                    <input
                      type="number"
                      value={mlShippingCost}
                      onChange={(e) => setMlShippingCost(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 w-full text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {/* ================= CONFIGURAÇÕES DA SHOPEE ================= */}
          {platform === "SHOPEE" && (
            <>
              <div className="border-t border-slate-800 pt-4">
                <div className="flex items-center justify-between gap-4 mb-2">
                  <div>
                    <label className="text-xs sm:text-sm font-semibold text-slate-300 block">Programa de Frete Grátis Extra?</label>
                    <span className="text-[11px] text-slate-400 block leading-tight mt-0.5">Adiciona +6% na comissão da Shopee</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={shopeeHasFreeShippingProgram}
                    onChange={(e) => setShopeeHasFreeShippingProgram(e.target.checked)}
                    className="w-5 h-5 flex-shrink-0 accent-orange-500 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Custos extras por envio / embalagem (R$ - Opcional)</label>
                <input
                  type="number"
                  placeholder="Ex: 2.00"
                  value={shopeeExtraCost}
                  onChange={(e) => setShopeeExtraCost(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 w-full text-white text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
            </>
          )}

          {/* Imposto */}
          <div className="border-t border-slate-800 pt-4">
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Porcentagem de Imposto/Nota Fiscal (% - Opcional)</label>
            <input
              type="number"
              placeholder="Ex: 4"
              value={taxPercent}
              onChange={(e) => setTaxPercent(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 w-28 text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

        </div>

        {/* PAINEL DE RESULTADOS (DIREITA) */}
        <div className="bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
          {!results ? (
            <div className="h-full min-h-[200px] flex items-center justify-center text-slate-500 text-center text-sm p-4">
              Digite o custo e o preço de venda para simular os resultados.
            </div>
          ) : (
            <div className="flex flex-col h-full justify-between gap-5">

              {/* BLOCO PRINCIPAL DO LUCRO + CAMPO DE LUCRO DESEJADO AO LADO */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm text-slate-400 font-medium">Lucro Líquido Estimado ({platform === "SHOPEE" ? "Shopee" : "M.L."})</p>
                  <h2 className={`text-3xl sm:text-4xl font-black tracking-tight ${results.profit >= 0 ? "text-green-400" : "text-red-400"}`}>
                    R$ {formatCurrency(results.profit)}
                  </h2>
                  <span className={`text-[11px] font-bold inline-block mt-1 px-2 py-0.5 rounded tracking-wide ${
                    results.margin >= 50 ? "bg-green-950 text-green-400" : results.margin > 0 ? "bg-yellow-950 text-yellow-400" : "bg-red-950 text-red-400"
                  }`}>
                    Margem: {results.margin.toFixed(2)}%
                  </span>
                </div>

                {/* Input de Lucro Desejado */}
                <div className="w-full sm:w-auto min-w-[140px] bg-slate-950/40 p-3 sm:p-0 rounded-xl border border-slate-800 sm:border-none">
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Definir Lucro Alvo (R$)</label>
                  <input
                    id="desiredProfitInput"
                    type="number"
                    placeholder="Ex: 50.00"
                    value={desiredProfit}
                    onChange={(e) => handleDesiredProfitChange(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 w-full text-white text-sm font-bold text-green-400 focus:outline-none focus:border-green-500"
                  />
                </div>
              </div>

              {/* DETALHAMENTO DAS DESPESAS */}
              <div className="space-y-3 border-t border-b border-slate-800 py-4 text-xs sm:text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400">Preço de Venda:</span>
                  <span className="text-white font-semibold whitespace-nowrap">R$ {formatCurrency(sellingPrice)}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400">(-) Custo do Produto:</span>
                  <span className="text-slate-300 whitespace-nowrap">R$ {formatCurrency(productCost)}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400 text-[11px] sm:text-xs">
                    (-) Comissão {platform === "SHOPEE" ? "Shopee" : "M.L."} ({results.commissionPercent.toFixed(0)}%):
                    {platform === "SHOPEE" && results.commission === 100 && " (Teto Máx.)"}
                  </span>
                  <span className="text-red-400 font-medium whitespace-nowrap">R$ {formatCurrency(results.commission)}</span>
                </div>
                {results.fixedFee > 0 && (
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-400 text-[11px] sm:text-xs">
                      (-) Taxa Fixa por Item:
                    </span>
                    <span className="text-red-400 font-medium whitespace-nowrap">R$ {formatCurrency(results.fixedFee)}</span>
                  </div>
                )}
                {results.shippingFee > 0 && (
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-400 text-[11px] sm:text-xs">
                      {platform === "SHOPEE" ? "(-) Custos Extras:" : "(-) Frete Grátis:"}
                    </span>
                    <span className="text-red-400 font-medium whitespace-nowrap">R$ {formatCurrency(results.shippingFee)}</span>
                  </div>
                )}
                {results.taxAmount > 0 && (
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-400">(-) Imposto / NF-e:</span>
                    <span className="text-red-400 font-medium whitespace-nowrap">R$ {formatCurrency(results.taxAmount)}</span>
                  </div>
                )}
              </div>

              {/* TOTAL A RECEBER DA PLATAFORMA */}
              <div className="bg-slate-950 p-3.5 rounded-xl flex justify-between items-center gap-4">
                <div>
                  <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Repasse Líquido</p>
                  <p className="text-base text-blue-400 font-bold mt-0.5">
                    R$ {formatCurrency(Number(sellingPrice) - results.totalExpenses)}
                  </p>
                </div>
                <span className="text-[10px] text-slate-500 text-right leading-tight max-w-[90px]">
                  Líquido sem o custo do produto
                </span>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}