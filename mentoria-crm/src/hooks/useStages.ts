"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { Stage } from "@/types"

export function useStages() {
  const [stages, setStages] = useState<Stage[]>([])
  const [loading, setLoading] = useState(true)
  const [rev, setRev] = useState(0)

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase
        .from("stages")
        .select("*")
        .order("order", { ascending: true })
      setStages(data || [])
      setLoading(false)
    })()
  }, [rev])

  return { stages, loading, refetch: () => setRev(r => r + 1) }
}
