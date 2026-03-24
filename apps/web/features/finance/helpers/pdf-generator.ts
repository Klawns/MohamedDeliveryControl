import { formatCurrency, formatDate } from "@/lib/utils"
import type { Ride } from "@/types/rides"

export function generatePDF(clientName: string, rides: Ride[], partialPayments: Array<{ amount: number, paymentDate: string }> = []) {
    const totalDebt = rides.reduce((sum, ride) => sum + ride.value, 0)
    const totalPaid = partialPayments.reduce((sum, payment) => sum + payment.amount, 0)
    const remainingBalance = Math.max(0, totalDebt - totalPaid)

    const today = new Date().toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    })

    const ridesHTML = rides.map(ride => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e5e5e5;">${formatDate(ride.createdAt)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e5e5; text-align: right; font-weight: 600; color: #22c55e;">${formatCurrency(ride.value)}</td>
    </tr>
  `).join("")

    const paymentsHTML = partialPayments.length > 0 ? `
    <h3 style="margin-top: 20px; font-size: 16px; margin-bottom: 10px;">Pagamentos Parciais</h3>
    <table>
      <thead>
        <tr>
          <th>Data</th>
          <th>Valor Pago</th>
        </tr>
      </thead>
      <tbody>
        ${partialPayments.map(payment => `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e5e5;">${formatDate(payment.paymentDate)}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e5e5; text-align: right; font-weight: 600; color: #3b82f6;">- ${formatCurrency(payment.amount)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
    ` : '';

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Relatório de Corridas - ${clientName}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; background: #fff; color: #1a1a1a; }
        .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #22c55e; }
        .header h1 { font-size: 24px; color: #1a1a1a; margin-bottom: 5px; }
        .header p { color: #666; font-size: 14px; }
        .client-info { background: #f8f8f8; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .client-info h2 { font-size: 18px; color: #1a1a1a; margin-bottom: 5px; }
        .client-info p { color: #666; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background: #22c55e; color: white; padding: 12px 8px; text-align: left; font-weight: 600; }
        th:last-child { text-align: right; }
        .total { background: #f0fdf4; padding: 15px; border-radius: 8px; text-align: right; }
        .total span { font-size: 14px; color: #666; }
        .total strong { font-size: 24px; color: #22c55e; display: block; margin-top: 5px; }
        .footer { margin-top: 30px; text-align: center; color: #999; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Relatório de Corridas</h1>
        <p>Gerado em ${today}</p>
      </div>
      <div class="client-info">
        <h2>${clientName}</h2>
        <p>${rides.length} corrida${rides.length !== 1 ? 's' : ''} registrada${rides.length !== 1 ? 's' : ''}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>Data/Hora</th>
            <th>Valor</th>
          </tr>
        </thead>
        <tbody>
          ${ridesHTML}
        </tbody>
      </table>
      ${paymentsHTML}
      <div class="summary-box" style="margin-top: 20px; padding: 15px; border-radius: 8px; background: #f8f8f8;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span>Total de Corridas</span>
          <strong>${formatCurrency(totalDebt)}</strong>
        </div>
        ${partialPayments.length > 0 ? `
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #3b82f6;">
          <span>Total Pago Antecipado</span>
          <strong>- ${formatCurrency(totalPaid)}</strong>
        </div>
        ` : ''}
        <div style="display: flex; justify-content: space-between; margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e5e5; font-size: 18px;">
          <span>Saldo Restante a Pagar</span>
          <strong style="color: #22c55e;">${formatCurrency(remainingBalance)}</strong>
        </div>
      </div>
      <div class="footer">
        <p>Controle de Corridas - Entregador</p>
      </div>
    </body>
    </html>
  `

    const printWindow = window.open("", "_blank")
    if (printWindow) {
        printWindow.document.write(html)
        printWindow.document.close()
        printWindow.focus()
        setTimeout(() => {
            printWindow.print()
        }, 250)
    }
}

export function generateGeneralPDF(
    period: "day" | "week" | "month",
    rides: Ride[],
    total: number
) {
    const periodNames = {
        day: "Hoje",
        week: "Esta Semana",
        month: "Este Mês",
    }

    const today = new Date().toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    })

    const groupedByClient: Record<string, { rides: Ride[]; total: number }> = {}
    rides.forEach((ride) => {
        const name = ride.clientName || "Cliente Desconhecido";
        if (!groupedByClient[name]) {
            groupedByClient[name] = { rides: [], total: 0 }
        }
        groupedByClient[name].rides.push(ride)
        groupedByClient[name].total += ride.value
    })

    const clientRows = Object.entries(groupedByClient)
        .sort((a, b) => b[1].total - a[1].total)
        .map(
            ([clientName, data]) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e5e5;">${clientName}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e5e5; text-align: center;">${data.rides.length}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e5e5; text-align: right; font-weight: 600; color: #22c55e;">${formatCurrency(data.total)}</td>
      </tr>
    `
        )
        .join("")

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Relatório de Ganhos - ${periodNames[period]}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; background: #fff; color: #1a1a1a; }
        .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #22c55e; }
        .header h1 { font-size: 24px; color: #1a1a1a; margin-bottom: 5px; }
        .header p { color: #666; font-size: 14px; }
        .period-badge { display: inline-block; background: #22c55e; color: white; padding: 5px 15px; border-radius: 20px; font-size: 14px; font-weight: 600; margin-top: 10px; }
        .summary { display: flex; justify-content: space-around; margin-bottom: 25px; padding: 20px; background: #f0fdf4; border-radius: 12px; }
        .summary-item { text-align: center; }
        .summary-item span { font-size: 14px; color: #666; display: block; margin-bottom: 5px; }
        .summary-item strong { font-size: 28px; color: #22c55e; }
        .summary-item.total strong { font-size: 32px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background: #22c55e; color: white; padding: 12px 10px; text-align: left; font-weight: 600; }
        th:nth-child(2) { text-align: center; }
        th:last-child { text-align: right; }
        .footer { margin-top: 30px; text-align: center; color: #999; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Relatório de Ganhos</h1>
        <p>Gerado em ${today}</p>
        <span class="period-badge">${periodNames[period]}</span>
      </div>
      <div class="summary">
        <div class="summary-item">
          <span>Total de Corridas</span>
          <strong>${rides.length}</strong>
        </div>
        <div class="summary-item">
          <span>Clientes Atendidos</span>
          <strong>${Object.keys(groupedByClient).length}</strong>
        </div>
        <div class="summary-item total">
          <span>Ganho Total</span>
          <strong>${formatCurrency(total)}</strong>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Corridas</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${clientRows}
        </tbody>
      </table>
      <div class="footer">
        <p>Controle de Corridas - Entregador</p>
      </div>
    </body>
    </html>
  `

    const printWindow = window.open("", "_blank")
    if (printWindow) {
        printWindow.document.write(html)
        printWindow.document.close()
        printWindow.focus()
        setTimeout(() => {
            printWindow.print()
        }, 250)
    }
}
