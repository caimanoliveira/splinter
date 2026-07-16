"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { Source } from "@/types"

export function useSources() {
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(true)
  const [rev, setRev] = useState(0)

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.from("sources").select("*").order("name")
      setSources(data || [])
      setLoading(false)
    })()
  }, [rev])

  return { sources, loading, refetch: () => setRev(r => r + 1) }
}
