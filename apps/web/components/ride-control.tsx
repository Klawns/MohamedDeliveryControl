"use client"

import { useState } from "react"
import { useRides } from "@/features/rides/hooks/use-rides"
import { useClients, type Client } from "@/features/clients/hooks/use-clients"
import { Bike } from "lucide-react"

// Componentes extraídos
import { ClientSelector } from "@/features/clients/components/client-selector"
import { AddRideForm } from "@/features/rides/components/add-ride-form"
import { GeneralReportCard } from "@/features/finance/components/general-report-card"
import { EarningsChart } from "@/features/dashboard/components/earnings-chart"
import { RideHistory } from "@/features/rides/components/ride-history"
import { ClientReportModal } from "@/features/clients/components/client-report-modal"

// Helpers
import { generatePDF, generateGeneralPDF } from "@/features/finance/helpers/pdf-generator"

export function RideControl() {
  const {
    rides,
    isLoaded,
    addRide,
    deleteRide,
    getTodayTotal,
    getWeekTotal,
    getMonthTotal,
    getTodayRides,
    getWeekRides,
    getMonthRides,
    getLast7DaysData,
  } = useRides()

  const {
    clients,
    isLoaded: clientsLoaded,
    addClient,
    deleteClient,
  } = useClients()

  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [selectedClientReport, setSelectedClientReport] = useState<string | null>(null)

  const chartData = getLast7DaysData()
  const todayTotal = getTodayTotal()
  const weekTotal = getWeekTotal()
  const monthTotal = getMonthTotal()
  const todayRides = getTodayRides()
  const weekRides = getWeekRides()
  const monthRides = getMonthRides()

  const handleAddClient = (name: string) => {
    return addClient(name)
  }

  const clientRidesForReport = selectedClientReport
    ? rides.filter((ride) => ride.clientName === selectedClientReport)
    : []

  if (!isLoaded || !clientsLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b border-border px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="rounded-xl bg-primary p-2">
            <Bike className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">
              Controle de Corridas
            </h1>
            <p className="text-xs text-muted-foreground">
              Gerencie suas entregas
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-4 pb-8">
        {/* Client Selector */}
        <ClientSelector
          clients={clients}
          selectedClientId={selectedClient?.id || null}
          onSelectClient={setSelectedClient}
          onAddClient={handleAddClient}
          onDeleteClient={deleteClient}
        />

        {/* Add Ride Form */}
        <AddRideForm
          selectedClient={selectedClient}
          onAdd={(name, value, rideDate) => addRide(name, value, rideDate)}
          onClearSelection={() => setSelectedClient(null)}
        />

        {/* General Report */}
        <GeneralReportCard
          todayTotal={todayTotal}
          weekTotal={weekTotal}
          monthTotal={monthTotal}
          todayRides={todayRides}
          weekRides={weekRides}
          monthRides={monthRides}
          onGenerateGeneralPDF={generateGeneralPDF}
        />

        {/* Earnings Chart */}
        <EarningsChart data={chartData} />

        {/* Ride History */}
        <RideHistory
          rides={rides}
          onDelete={deleteRide}
          onOpenReport={setSelectedClientReport}
        />
      </main>

      <ClientReportModal
        isOpen={!!selectedClientReport}
        onClose={() => setSelectedClientReport(null)}
        clientId={clients.find(c => c.name === selectedClientReport)?.id}
        clientName={selectedClientReport || ""}
        rides={clientRidesForReport}
        onGeneratePDF={generatePDF}
      />
    </div>
  )
}
