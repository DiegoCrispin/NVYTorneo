const SUPABASE_URL = "https://oizuywsjsnicfflzlyif.supabase.co"
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9penV5d3Nqc25pY2ZmbHpseWlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwNTE0NjUsImV4cCI6MjA3NzYyNzQ2NX0.HtyBQOAior9dQ9d041DHCdFB1OesZTCdWdJMlMY03oc"

window.SupabaseClient = {
  async saveRegisteredTeam(team) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/registered_teams`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(team),
      })
      if (!response.ok) throw new Error(await response.text())
      const data = await response.json()
      console.log("[v0] Team saved to Supabase:", team.id)
      return data
    } catch (error) {
      console.error("[v0] Error saving team:", error)
      throw error
    }
  },

  async getRegisteredTeams() {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/registered_teams?order=created_at.desc`, {
        method: "GET",
        headers: {
          apikey: SUPABASE_KEY,
          "Content-Type": "application/json",
        },
      })
      if (!response.ok) return []
      const data = await response.json()
      return data || []
    } catch (error) {
      console.error("[v0] Error fetching teams:", error)
      return []
    }
  },

  async deleteRegisteredTeam(teamId) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/registered_teams?id=eq.${teamId}`, {
        method: "DELETE",
        headers: {
          apikey: SUPABASE_KEY,
          "Content-Type": "application/json",
        },
      })
      if (!response.ok) throw new Error(await response.text())
      console.log("[v0] Team deleted:", teamId)
      return true
    } catch (error) {
      console.error("[v0] Error deleting team:", error)
      return false
    }
  },

  async updateRegisteredTeam(teamId, updates) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/registered_teams?id=eq.${teamId}`, {
        method: "PATCH",
        headers: {
          apikey: SUPABASE_KEY,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(updates),
      })
      if (!response.ok) throw new Error(await response.text())
      const data = await response.json()
      console.log("[v0] Team updated:", teamId)
      return data
    } catch (error) {
      console.error("[v0] Error updating team:", error)
      throw error
    }
  },

  async saveHeroStats(stats) {
    try {
      const getResponse = await fetch(`${SUPABASE_URL}/rest/v1/hero_stats?id=eq.1`, {
        method: "GET",
        headers: {
          apikey: SUPABASE_KEY,
          "Content-Type": "application/json",
        },
      })
      const existing = await getResponse.json()

      if (existing && existing.length > 0) {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/hero_stats?id=eq.1`, {
          method: "PATCH",
          headers: {
            apikey: SUPABASE_KEY,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({ ...stats, updated_at: new Date().toISOString() }),
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      } else {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/hero_stats`, {
          method: "POST",
          headers: {
            apikey: SUPABASE_KEY,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({ id: 1, ...stats, updated_at: new Date().toISOString() }),
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      }
    } catch (error) {
      console.error("[v0] Error saving hero stats:", error)
      throw error
    }
  },

  async getHeroStats() {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/hero_stats`, {
        method: "GET",
        headers: {
          apikey: SUPABASE_KEY,
          "Content-Type": "application/json",
        },
      })
      if (!response.ok) return []
      const data = await response.json()
      return data || []
    } catch (error) {
      console.error("[v0] Error fetching hero stats:", error)
      return []
    }
  },

  async updateHeroStats(heroId, stats) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/hero_stats?id=eq.${heroId}`, {
        method: "PATCH",
        headers: {
          apikey: SUPABASE_KEY,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(stats),
      })
      if (!response.ok) throw new Error(await response.text())
      const data = await response.json()
      return data
    } catch (error) {
      console.error("[v0] Error updating hero stats:", error)
      throw error
    }
  },

  async saveTournamentMatch(match) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/tournament_matches`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(match),
      })
      if (!response.ok) throw new Error(await response.text())
      const data = await response.json()
      console.log("[v0] Match saved")
      return data
    } catch (error) {
      console.error("[v0] Error saving match:", error)
      throw error
    }
  },

  async getTournamentMatches() {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/tournament_matches`, {
        method: "GET",
        headers: {
          apikey: SUPABASE_KEY,
          "Content-Type": "application/json",
        },
      })
      if (!response.ok) return []
      const data = await response.json()
      return data || []
    } catch (error) {
      console.error("[v0] Error fetching matches:", error)
      return []
    }
  },

  async updateTournamentMatch(matchId, updates) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/tournament_matches?id=eq.${matchId}`, {
        method: "PATCH",
        headers: {
          apikey: SUPABASE_KEY,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(updates),
      })
      if (!response.ok) throw new Error(await response.text())
      const data = await response.json()
      return data
    } catch (error) {
      console.error("[v0] Error updating match:", error)
      throw error
    }
  },

  async saveTournamentMap(map) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/tournament_maps`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(map),
      })
      if (!response.ok) throw new Error(await response.text())
      return await response.json()
    } catch (error) {
      console.error("[v0] Error saving map:", error)
      throw error
    }
  },

  async getTournamentMaps() {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/tournament_maps`, {
        method: "GET",
        headers: {
          apikey: SUPABASE_KEY,
          "Content-Type": "application/json",
        },
      })
      if (!response.ok) return []
      const data = await response.json()
      return data || []
    } catch (error) {
      console.error("[v0] Error fetching maps:", error)
      return []
    }
  },

  async saveMapBan(ban) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/map_bans`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(ban),
      })
      if (!response.ok) throw new Error(await response.text())
      return await response.json()
    } catch (error) {
      console.error("[v0] Error saving map ban:", error)
      throw error
    }
  },

  async getMapBans() {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/map_bans`, {
        method: "GET",
        headers: {
          apikey: SUPABASE_KEY,
          "Content-Type": "application/json",
        },
      })
      if (!response.ok) return []
      const data = await response.json()
      return data || []
    } catch (error) {
      console.error("[v0] Error fetching map bans:", error)
      return []
    }
  },

  async getTournamentState() {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/tournament_state`, {
        method: "GET",
        headers: {
          apikey: SUPABASE_KEY,
          "Content-Type": "application/json",
        },
      })
      if (!response.ok) return null
      const data = await response.json()
      return data?.[0] || null
    } catch (error) {
      console.error("[v0] Error fetching tournament state:", error)
      return null
    }
  },

  async updateTournamentState(updates) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/tournament_state`, {
        method: "PATCH",
        headers: {
          apikey: SUPABASE_KEY,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(updates),
      })
      if (!response.ok) throw new Error(await response.text())
      const data = await response.json()
      return data
    } catch (error) {
      console.error("[v0] Error updating tournament state:", error)
      throw error
    }
  },
}

setInterval(async () => {
  try {
    const teams = await window.SupabaseClient.getRegisteredTeams()
    window.dispatchEvent(new CustomEvent("teamsUpdated", { detail: teams }))

    const stats = await window.SupabaseClient.getHeroStats()
    window.dispatchEvent(new CustomEvent("statsUpdated", { detail: stats }))

    const matches = await window.SupabaseClient.getTournamentMatches()
    window.dispatchEvent(new CustomEvent("matchesUpdated", { detail: matches }))
  } catch (error) {
    console.log("[v0] Polling error:", error.message)
  }
}, 2000)
