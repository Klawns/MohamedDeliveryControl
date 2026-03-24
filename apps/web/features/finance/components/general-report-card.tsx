import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Calendar, CalendarDays, DollarSign } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import type { Ride } from "@/types/rides"

interface GeneralReportCardProps {
    todayTotal: number
    weekTotal: number
    monthTotal: number
    todayRides: Ride[]
    weekRides: Ride[]
    monthRides: Ride[]
    onGenerateGeneralPDF: (period: "day" | "week" | "month", rides: Ride[], total: number) => void
}

export function GeneralReportCard({
    todayTotal,
    weekTotal,
    monthTotal,
    todayRides,
    weekRides,
    monthRides,
    onGenerateGeneralPDF,
}: GeneralReportCardProps) {
    return (
        <Card className="bg-card border-border">
            <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Gerar Relatório de Ganhos
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <Button
                    variant="outline"
                    onClick={() => onGenerateGeneralPDF("day", todayRides, todayTotal)}
                    disabled={todayRides.length === 0}
                    className="w-full h-12 justify-between border-border text-foreground hover:bg-secondary disabled:opacity-50"
                >
                    <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        Hoje
                    </span>
                    <span className="text-primary font-bold">{formatCurrency(todayTotal)}</span>
                </Button>

                <Button
                    variant="outline"
                    onClick={() => onGenerateGeneralPDF("week", weekRides, weekTotal)}
                    disabled={weekRides.length === 0}
                    className="w-full h-12 justify-between border-border text-foreground hover:bg-secondary disabled:opacity-50"
                >
                    <span className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-primary" />
                        Esta Semana
                    </span>
                    <span className="text-primary font-bold">{formatCurrency(weekTotal)}</span>
                </Button>

                <Button
                    variant="outline"
                    onClick={() => onGenerateGeneralPDF("month", monthRides, monthTotal)}
                    disabled={monthRides.length === 0}
                    className="w-full h-12 justify-between border-border text-foreground hover:bg-secondary disabled:opacity-50"
                >
                    <span className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-primary" />
                        Este Mês
                    </span>
                    <span className="text-primary font-bold">{formatCurrency(monthTotal)}</span>
                </Button>
            </CardContent>
        </Card>
    )
}
