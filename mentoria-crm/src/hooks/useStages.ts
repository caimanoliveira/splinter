"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import type { Stage } from "@/types"

export function useStages() {
  const [stages, setStages] = useState<Stage[]>([])
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    supabase.from("stages").select("*").order("order", { ascending: true })
      .then(({ data }) => {
        if (!cancelled) {
          setStages(data || [])
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [tick])

  const refetch = useCallback(() => setTick((t) => t + 1), [])
  return { stages, loading, refetch }
}
