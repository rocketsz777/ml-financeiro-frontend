import { useState } from "react"
import axios from "axios"

function Reports() {

  const [loadingMonthly, setLoadingMonthly] =
    useState(false)

  const [loadingWeekly, setLoadingWeekly] =
    useState(false)

  const downloadExcel = async (
    month
  ) => {

    try {

      const response = await axios.get(

        `http://localhost:8080/api/reports/excel?month=${month}`,

        {
          responseType: "blob"
        }
      )

      const url =
        window.URL.createObjectURL(
          new Blob([response.data])
        )

      const link =
        document.createElement("a")

      link.href = url

      link.setAttribute(
        "download",
        `relatorio-${month}.xlsx`
      )

      document.body.appendChild(link)

      link.click()

    } catch (error) {

      console.error(error)

      alert(
        "Erro ao baixar relatório"
      )
    }
  }

  const downloadMonthly = async () => {

    try {

      setLoadingMonthly(true)

      await downloadExcel(
        "2026-05"
      )

    } finally {

      setLoadingMonthly(false)
    }
  }

  const downloadWeekly = async () => {

    try {

      setLoadingWeekly(true)

      await downloadExcel(
        "2026-05"
      )

    } finally {

      setLoadingWeekly(false)
    }
  }

  return (

    <div>

      <div className="mb-8">

        <h1 className="text-4xl font-bold">

          Relatórios

        </h1>

        <p className="text-slate-400 mt-2">

          Exportação financeira e relatórios Excel

        </p>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* RELATÓRIO MENSAL */}

        <div className="bg-slate-900 p-6 rounded-2xl shadow-lg">

          <h2 className="text-2xl font-bold mb-4">

            Relatório Mensal

          </h2>

          <p className="text-slate-400 mb-6">

            Exporta fechamento financeiro mensal em Excel.

          </p>

          <button

            onClick={downloadMonthly}

            className="bg-green-600 hover:bg-green-700 px-5 py-3 rounded-xl font-semibold transition"
          >

            {

              loadingMonthly

                ?

                "Baixando..."

                :

                "Baixar Excel Mensal"
            }

          </button>

        </div>

        {/* RELATÓRIO SEMANAL */}

        <div className="bg-slate-900 p-6 rounded-2xl shadow-lg">

          <h2 className="text-2xl font-bold mb-4">

            Relatório Semanal

          </h2>

          <p className="text-slate-400 mb-6">

            Exporta resumo financeiro semanal em Excel.

          </p>

          <button

            onClick={downloadWeekly}

            className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl font-semibold transition"
          >

            {

              loadingWeekly

                ?

                "Baixando..."

                :

                "Baixar Excel Semanal"
            }

          </button>

        </div>

      </div>

    </div>
  )
}

export default Reports