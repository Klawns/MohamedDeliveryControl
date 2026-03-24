import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { CalendarDays, Search, X, FileText, Trash2, Bike } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { Ride } from "@/types/rides"

interface RideHistoryProps {
    rides: Ride[]
    onDelete: (id: string) => void
    onOpenReport: (clientName: string) => void
}

export function RideHistory({
    rides,
    onDelete,
    onOpenReport,
}: RideHistoryProps) {
    const [searchQuery, setSearchQuery] = useState("")

    const filteredRides = searchQuery
        ? rides.filter((ride) =>
            (ride.clientName || "").toLowerCase().includes(searchQuery.toLowerCase())
        )
        : rides

    if (rides.length === 0) {
        return (
            <Card className="bg-card border-border">
                <CardContent className="p-6">
                    <div className="text-center text-muted-foreground">
                        <Bike className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Nenhuma corrida registrada</p>
                        <p className="text-sm">Adicione sua primeira corrida acima</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="bg-card border-border overflow-hidden">
            <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-primary" />
                    Histórico de Corridas
                </CardTitle>
                <div className="relative mt-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Pesquisar por cliente..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                {searchQuery && filteredRides.length > 0 && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenReport(filteredRides[0].clientName || "")}
                        className="mt-3 w-full border-primary text-primary hover:bg-primary/10"
                    >
                        <FileText className="h-4 w-4 mr-2" />
                        Gerar Relatório de "{filteredRides[0].clientName || "Cliente"}"
                    </Button>
                )}
            </CardHeader>
            <CardContent className="p-0">
                {filteredRides.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground">
                        <Search className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p>Nenhuma corrida encontrada para "{searchQuery}"</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-border hover:bg-transparent">
                                    <TableHead className="text-muted-foreground font-medium">
                                        Cliente
                                    </TableHead>
                                    <TableHead className="text-muted-foreground font-medium">
                                        Valor
                                    </TableHead>
                                    <TableHead className="text-muted-foreground font-medium">
                                        Data
                                    </TableHead>
                                    <TableHead className="text-muted-foreground font-medium w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredRides.map((ride) => (
                                    <TableRow
                                        key={ride.id}
                                        className="border-border hover:bg-secondary/50 cursor-pointer"
                                        onClick={() => onOpenReport(ride.clientName || "")}
                                    >
                                        <TableCell className="font-medium text-foreground">
                                            {ride.clientName}
                                        </TableCell>
                                        <TableCell className="text-primary font-semibold">
                                            {formatCurrency(ride.value)}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {formatDate(ride.createdAt)}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    onDelete(ride.id)
                                                }}
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
