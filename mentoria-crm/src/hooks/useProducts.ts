"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { Product } from "@/types"

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [rev, setRev] = useState(0)

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .order("name")
      setProducts(data || [])
      setLoading(false)
    })()
  }, [rev])

  return { products, loading, refetch: () => setRev(r => r + 1) }
}
