"use client"

import { useState, useEffect, useCallback, startTransition } from "react"
import { supabase } from "@/lib/supabase"
import type { Stage } from "@/types"

export function useStages() {
  const [stages, setStages] = useState<Stage[]>([])
  const [loading, setLoading] = useState(true)

  const fetchStages = useCallback(() => {
    startTransition(async () => {
      const { data } = await supabase
        .from("stages")
        .select("*")
        .order("order", { ascending: true })
      setStages(data || [])
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    fetchStages()
  }, [fetchStages])

  return { stages, loading, refetch: fetchStages }
}
