"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { Source } from "@/types"

export function useSources() {
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSources = async () => {
    const { data } = await supabase.from("sources").select("*").order("name")
    setSources(data || [])
    setLoading(false)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSources()
  }, [])

  return { sources, loading, refetch: fetchSources }
}
