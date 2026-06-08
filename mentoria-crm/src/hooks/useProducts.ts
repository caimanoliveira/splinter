"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import type { Product } from "@/types"

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    supabase.from("products").select("*").eq("active", true).order("name")
      .then(({ data }) => {
        if (!cancelled) {
          setProducts(data || [])
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [tick])

  const refetch = useCallback(() => setTick((t) => t + 1), [])
  return { products, loading, refetch }
}
