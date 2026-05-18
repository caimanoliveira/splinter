"use client"

import { useState, useEffect, useCallback, startTransition } from "react"
import { supabase } from "@/lib/supabase"
import type { Product } from "@/types"

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProducts = useCallback(() => {
    startTransition(async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .order("name")
      setProducts(data || [])
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  return { products, loading, refetch: fetchProducts }
}
