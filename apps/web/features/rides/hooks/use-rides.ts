"use client"

import { useState, useEffect, useCallback } from "react"

import { Ride } from "@/types/rides"

const STORAGE_KEY = "delivery-rides"

function getStoredRides(): Ride[] {
  if (typeof window === "undefined") return []
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored ? JSON.parse(stored) : []
}

function storeRides(rides: Ride[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rides))
}

export function useRides() {
  const [rides, setRides] = useState<Ride[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setRides(getStoredRides())
    setIsLoaded(true)
  }, [])

  const addRide = useCallback((clientName: string, value: number, rideDate?: string) => {
    const newRide: Ride = {
      id: crypto.randomUUID(),
      clientName,
      value,
      createdAt: new Date().toISOString(),
      rideDate,
      paid: false,
    }
    setRides((prev) => {
      const updated = [newRide, ...prev]
      storeRides(updated)
      return updated
    })
  }, [])

  const deleteRide = useCallback((id: string) => {
    setRides((prev) => {
      const updated = prev.filter((ride) => ride.id !== id)
      storeRides(updated)
      return updated
    })
  }, [])

  const getTodayTotal = useCallback(() => {
    const today = new Date().toDateString()
    return rides
      .filter((ride) => new Date(ride.createdAt).toDateString() === today)
      .reduce((sum, ride) => sum + ride.value, 0)
  }, [rides])

  const getWeekTotal = useCallback(() => {
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    return rides
      .filter((ride) => new Date(ride.createdAt) >= startOfWeek)
      .reduce((sum, ride) => sum + ride.value, 0)
  }, [rides])

  const getMonthTotal = useCallback(() => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    return rides
      .filter((ride) => new Date(ride.createdAt) >= startOfMonth)
      .reduce((sum, ride) => sum + ride.value, 0)
  }, [rides])

  const getTodayRides = useCallback(() => {
    const today = new Date().toDateString()
    return rides.filter(
      (ride) => new Date(ride.createdAt).toDateString() === today
    )
  }, [rides])

  const getWeekRides = useCallback(() => {
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    return rides.filter((ride) => new Date(ride.createdAt) >= startOfWeek)
  }, [rides])

  const getMonthRides = useCallback(() => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    return rides.filter((ride) => new Date(ride.createdAt) >= startOfMonth)
  }, [rides])

  const getLast7DaysData = useCallback(() => {
    const days = []
    const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const dayTotal = rides
        .filter((ride) => {
          const rideDate = new Date(ride.createdAt)
          return rideDate >= date && rideDate < nextDate
        })
        .reduce((sum, ride) => sum + ride.value, 0)

      const dayRides = rides.filter((ride) => {
        const rideDate = new Date(ride.createdAt)
        return rideDate >= date && rideDate < nextDate
      }).length

      days.push({
        day: dayNames[date.getDay()],
        date: date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        total: dayTotal,
        corridas: dayRides,
      })
    }

    return days
  }, [rides])

  return {
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
  }
}
