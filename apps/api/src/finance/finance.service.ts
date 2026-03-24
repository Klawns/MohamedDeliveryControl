import { Injectable, Inject } from '@nestjs/common';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
import { eq, and, gte, lte, sql, desc, or } from 'drizzle-orm';
import * as schema from '@mdc/database';
import { DRIZZLE } from '../database/database.provider';
import { getDatesFromPeriod, getDaysArray } from '../common/utils/date.util';
import { GetFinanceStatsDto } from './dto/finance.dto';

@Injectable()
export class FinanceService {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: LibSQLDatabase<typeof schema>,
  ) {}

  async getDashboard(userId: string, query: GetFinanceStatsDto) {
    const { startDate, endDate } = getDatesFromPeriod(query.period, query.start, query.end);
    const clientId = query.clientId && query.clientId !== 'all' ? query.clientId : undefined;

    // 1. Resumo (Total, Count, etc.)
    const summary = await this.getSummary(userId, startDate, endDate, query.period, clientId);

    // 2. Tendências (Evolução Diária)
    const trends = await this.getTrends(userId, startDate, endDate, clientId);

    // 3. Distribuição por Cliente
    const byClient = await this.getByClient(userId, startDate, endDate);

    // 4. Status de Pagamento
    const byStatus = await this.getByStatus(userId, startDate, endDate, clientId);

    // 5. Corridas Recentes (Últimas 5 para o feed)
    const recentRides = await this.getRecentRides(userId, startDate, endDate, clientId);

    return {
      summary,
      trends,
      byClient,
      byStatus,
      recentRides,
    };
  }

  private async getSummary(userId: string, start: Date, end: Date, period: string, clientId?: string) {
    const conditions = [
      eq(schema.rides.userId, userId),
      gte(schema.rides.rideDate, start),
      lte(schema.rides.rideDate, end),
    ];
    if (clientId) conditions.push(eq(schema.rides.clientId, clientId));

    const stats = await this.db
      .select({
        count: sql<number>`count(*)`,
        total: sql<number>`coalesce(sum(${schema.rides.value}), 0)`,
      })
      .from(schema.rides)
      .where(and(...conditions));

    const currentTotal = Number(stats[0]?.total || 0);
    const currentCount = Number(stats[0]?.count || 0);
    const ticketMedio = currentCount > 0 ? currentTotal / currentCount : 0;

    // Comparação com período anterior
    const previousComparison = await this.getPreviousPeriodComparison(userId, start, end, period, clientId);

    // Projeção (apenas se for mês atual)
    const projection = this.calculateProjection(currentTotal, start, end, period);

    return {
      totalValue: currentTotal,
      count: currentCount,
      ticketMedio,
      previousPeriodComparison: previousComparison,
      projection,
    };
  }

  private async getTrends(userId: string, start: Date, end: Date, clientId?: string) {
    const conditions = [
      eq(schema.rides.userId, userId),
      gte(schema.rides.rideDate, start),
      lte(schema.rides.rideDate, end),
    ];
    if (clientId) conditions.push(eq(schema.rides.clientId, clientId));

    const rides = await this.db
      .select({
        rideDate: schema.rides.rideDate,
        value: schema.rides.value,
      })
      .from(schema.rides)
      .where(and(...conditions));

    // Agrupar por data local (YYYY-MM-DD)
    const trendMap = new Map<string, number>();
    
    rides.forEach(ride => {
      if (!ride.rideDate) return;
      const d = new Date(ride.rideDate);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      trendMap.set(dateKey, (trendMap.get(dateKey) || 0) + Number(ride.value || 0));
    });

    // Preencher lacunas com zero usando a mesma lógica de chave
    const allDays = getDaysArray(start, end);
    
    return allDays.map(date => ({
      date,
      value: trendMap.get(date) || 0,
    }));
  }

  private async getByClient(userId: string, start: Date, end: Date) {
    const results = await this.db
      .select({
        clientId: schema.rides.clientId,
        clientName: schema.clients.name,
        value: sql<number>`sum(${schema.rides.value})`,
      })
      .from(schema.rides)
      .leftJoin(schema.clients, eq(schema.rides.clientId, schema.clients.id))
      .where(
        and(
          eq(schema.rides.userId, userId),
          gte(schema.rides.rideDate, start),
          lte(schema.rides.rideDate, end),
        )
      )
      .groupBy(schema.rides.clientId, schema.clients.name)
      .orderBy(desc(sql`sum(${schema.rides.value})`))
      .limit(5);

    return results.map(r => ({
      clientId: r.clientId,
      clientName: r.clientName || 'Cliente Removido',
      value: Number(r.value || 0),
    }));
  }

  private async getByStatus(userId: string, start: Date, end: Date, clientId?: string) {
    const conditions = [
      eq(schema.rides.userId, userId),
      gte(schema.rides.rideDate, start),
      lte(schema.rides.rideDate, end),
    ];
    if (clientId) conditions.push(eq(schema.rides.clientId, clientId));

    const results = await this.db
      .select({
        status: schema.rides.paymentStatus,
        value: sql<number>`sum(${schema.rides.value})`,
      })
      .from(schema.rides)
      .where(and(...conditions))
      .groupBy(schema.rides.paymentStatus);

    return results.map(r => ({
      status: r.status as 'PAID' | 'PENDING',
      value: Number(r.value || 0),
    }));
  }

  private async getRecentRides(userId: string, start: Date, end: Date, clientId?: string) {
    const conditions = [
      eq(schema.rides.userId, userId),
      gte(schema.rides.rideDate, start),
      lte(schema.rides.rideDate, end),
    ];
    if (clientId) conditions.push(eq(schema.rides.clientId, clientId));

    return this.db
      .select({
        id: schema.rides.id,
        value: schema.rides.value,
        rideDate: schema.rides.rideDate,
        paymentStatus: schema.rides.paymentStatus,
        location: schema.rides.location,
        clientName: schema.clients.name,
      })
      .from(schema.rides)
      .leftJoin(schema.clients, eq(schema.rides.clientId, schema.clients.id))
      .where(and(...conditions))
      .orderBy(desc(schema.rides.rideDate))
      .limit(10);
  }

  private async getPreviousPeriodComparison(userId: string, start: Date, end: Date, period: string, clientId?: string) {
    if (period === 'custom') return 0; // Difícil comparar custom sem contexto

    const diff = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - diff - 1);
    const prevEnd = new Date(start.getTime() - 1);

    const conditions = [
      eq(schema.rides.userId, userId),
      gte(schema.rides.rideDate, prevStart),
      lte(schema.rides.rideDate, prevEnd),
    ];
    if (clientId) conditions.push(eq(schema.rides.clientId, clientId));

    const stats = await this.db
      .select({
        total: sql<number>`coalesce(sum(${schema.rides.value}), 0)`,
      })
      .from(schema.rides)
      .where(and(...conditions));

    const prevTotal = Number(stats[0]?.total || 0);
    const currTotal = await this.getCurrentTotal(userId, start, end, clientId);

    if (prevTotal === 0) return currTotal > 0 ? 100 : 0;
    return ((currTotal - prevTotal) / prevTotal) * 100;
  }

  private async getCurrentTotal(userId: string, start: Date, end: Date, clientId?: string) {
    const conditions = [
      eq(schema.rides.userId, userId),
      gte(schema.rides.rideDate, start),
      lte(schema.rides.rideDate, end),
    ];
    if (clientId) conditions.push(eq(schema.rides.clientId, clientId));

    const stats = await this.db
      .select({
        total: sql<number>`coalesce(sum(${schema.rides.value}), 0)`,
      })
      .from(schema.rides)
      .where(and(...conditions));

    return Number(stats[0]?.total || 0);
  }

  private calculateProjection(currentTotal: number, start: Date, end: Date, period: string) {
    if (period !== 'month') return 0;

    const today = new Date();
    if (today > end || today < start) return 0;

    const daysPassed = today.getDate();
    const totalDays = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

    if (daysPassed === 0) return 0;
    const dailyAverage = currentTotal / daysPassed;
    return dailyAverage * totalDays;
  }
}
