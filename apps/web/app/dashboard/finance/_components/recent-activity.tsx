"use client";

import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ShoppingCart, CheckCircle2, Clock } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { RecentRide } from "@/services/finance-service";

interface RecentActivityProps {
  rides: RecentRide[];
  isLoading: boolean;
}

export function RecentActivity({ rides, isLoading }: RecentActivityProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-muted/50 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!rides?.length) {
    return (
      <div className="py-12 text-center text-text-muted font-medium bg-muted/20 rounded-3xl border border-dashed border-border-subtle">
        Nenhuma atividade recente registrada
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rides.map((ride, index) => (
        <motion.div
          key={ride.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="group flex items-center justify-between p-4 rounded-2xl bg-muted/50 border border-border-subtle hover:bg-hover-accent hover:border-primary/20 transition-all cursor-pointer shadow-sm"
        >
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className={cn(
              "p-3 rounded-xl flex-shrink-0",
              ride.paymentStatus === 'PAID' ? "bg-icon-success/10 text-icon-success" : "bg-icon-warning/10 text-icon-warning"
            )}>
              {ride.paymentStatus === 'PAID' ? <CheckCircle2 size={20} /> : <Clock size={20} />}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-text-primary font-display font-bold group-hover:text-primary transition-colors truncate">
                {ride.clientName || 'Cliente'}
              </h4>
              <p className="text-xs text-text-muted font-medium truncate">
                {format(parseISO(ride.rideDate), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>
          <div className="text-right flex-shrink-0 ml-4">
            <p className="text-text-primary font-display font-extrabold tracking-tighter text-lg">{formatCurrency(ride.value)}</p>
            <span className={cn(
              "text-[10px] font-bold uppercase tracking-wider py-0.5 px-2 rounded-full border",
              ride.paymentStatus === 'PAID' ? "bg-icon-success/10 text-icon-success border-icon-success/10" : "bg-icon-warning/10 text-icon-warning border-icon-warning/10"
            )}>
              {ride.paymentStatus === 'PAID' ? 'Pago' : 'Pendente'}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
