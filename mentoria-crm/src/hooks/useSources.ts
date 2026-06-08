"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import type { Source } from "@/types"

export function useSources() {
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    supabase.from("sources").select("*").order("name")
      .then(({ data }) => {
        if (!cancelled) {
          setSources(data || [])
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [tick])

  const refetch = useCallback(() => setTick((t) => t + 1), [])
  return { sources, loading, refetch }
}
