"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import type { Lead } from "@/types"

export function useLeads(filters?: { stageId?: string; sourceId?: string; search?: string }) {
  const { stageId, sourceId, search } = filters ?? {}
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLeads = useCallback(async () => {
    try {
      let query = supabase
        .from("leads")
        .select(`
          *,
          stage:stages(*),
          source:sources(*),
          product:products(*),
          next_meeting:meetings(*)
        `)
        .order("created_at", { ascending: false })

      if (stageId) query = query.eq("stage_id", stageId)
      if (sourceId) query = query.eq("source_id", sourceId)
      if (search) {
        query = query.or(
          `name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`
        )
      }

      const { data, error } = await query
      if (error) throw error

      // Get next meeting for each lead (the closest future meeting)
      const leadsWithNextMeeting = (data || []).map((lead) => {
        const futureMeetings = (lead.next_meeting || [])
          .filter((m: { date: string }) => new Date(m.date) >= new Date())
          .sort((a: { date: string }, b: { date: string }) => new Date(a.date).getTime() - new Date(b.date).getTime())
        return { ...lead, next_meeting: futureMeetings[0] || null }
      })

      setLeads(leadsWithNextMeeting)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar leads")
    } finally {
      setLoading(false)
    }
  }, [stageId, sourceId, search])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setError(null)
    fetchLeads()
  }, [fetchLeads])

  return { leads, loading, error, refetch: fetchLeads }
}
