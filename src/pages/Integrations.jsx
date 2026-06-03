import { useEffect, useState } from "react";
import { api } from "../services/api";

export default function Integrations() {

  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  async function loadStatus() {

    try {

      const response =
        await api.get(
          "/api/system/status"
        );

      setStatus(
        response.data
      );

    } catch (error) {

      console.error(error);
    }
  }

  async function importSales() {

    try {

      setLoading(true);

      const response =
        await api.post(
          "/api/import/sales"
        );

      alert(
        `Importadas ${response.data.totalImported} vendas`
      );

      loadStatus();

    } catch (error) {

      console.error(error);

      alert(
        "Erro ao importar vendas"
      );

    } finally {

      setLoading(false);
    }
  }

  useEffect(() => {

    loadStatus();

  }, []);

  if (!status) {

    return (
      <div className="p-6">
        Carregando...
      </div>
    );
  }

  return (
    <div className="p-6">

      <h1 className="text-2xl font-bold mb-6">
        Integrações
      </h1>

      <div className="space-y-3">

        <div>
          Aplicação:
          {" "}
          {status.application}
        </div>

        <div>
          Banco:
          {" "}
          {status.database}
        </div>

        <div>
          Mercado Livre:
          {" "}
          {status.mercadoLivre}
        </div>

        <div>
          Shopee:
          {" "}
          {status.shopee}
        </div>

      </div>

      <button
        onClick={importSales}
        disabled={loading}
        className="mt-6 px-4 py-2 bg-blue-600 text-white rounded"
      >
        {loading
          ? "Importando..."
          : "Importar Vendas"}
      </button>

    </div>
  );
}