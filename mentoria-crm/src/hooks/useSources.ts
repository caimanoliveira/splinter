"use client"

import { useState, useEffect, useCallback, startTransition } from "react"
import { supabase } from "@/lib/supabase"
import type { Source } from "@/types"

export function useSources() {
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSources = useCallback(() => {
    startTransition(async () => {
      const { data } = await supabase.from("sources").select("*").order("name")
      setSources(data || [])
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    fetchSources()
  }, [fetchSources])

  return { sources, loading, refetch: fetchSources }
}
