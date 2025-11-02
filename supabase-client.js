const SUPABASE_URL = "https://oizuywsjsnicfflzlyif.supabase.co"
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9penV5d3Nqc25pY2ZmbHpseWlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwNTE0NjUsImV4cCI6MjA3NzYyNzQ2NX0.HtyBQOAior9dQ9d041DHCdFB1OesZTCdWdJMlMY03oc"

window.SupabaseClient = {
  async saveRegisteredTeam(team) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/registered_teams`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_KEY}`,
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
          Authorization: `Bearer ${SUPABASE_KEY}`,
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
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
        },
      })
      if (!response.ok) throw new Error(await response.text())
      console.log("[v0] Team deleted:", teamId)
    } catch (error) {
      console.error("[v0] Error deleting team:", error)
      throw error
    }
  },

  async updateRegisteredTeam(teamId, updates) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/registered_teams?id=eq.${teamId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(updates),
      })
      if (!response.ok) throw new Error(await response.text())
      const data = await response.json()
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
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
        },
      })
      const existing = await getResponse.json()

      if (existing && existing.length > 0) {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/hero_stats?id=eq.1`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${SUPABASE_KEY}`,
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
            Authorization: `Bearer ${SUPABASE_KEY}`,
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
      const response = await fetch(`${SUPABASE_URL}/rest/v1/hero_stats?id=eq.1`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
        },
      })
      if (!response.ok) return { teams: 16, players: 80, matches: 15 }
      const data = await response.json()
      return data && data.length > 0 ? data[0] : { teams: 16, players: 80, matches: 15 }
    } catch (error) {
      console.error("[v0] Error fetching hero stats:", error)
      return { teams: 16, players: 80, matches: 15 }
    }
  },

  async saveTournamentMatch(match) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/tournament_matches`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(match),
      })
      if (!response.ok) throw new Error(await response.text())
      console.log("[v0] Match saved:", match.id)
      return await response.json()
    } catch (error) {
      console.error("[v0] Error saving match:", error)
      throw error
    }
  },

  async getTournamentMatches() {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/tournament_matches?order=created_at.desc`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
        },
      })
      if (!response.ok) return []
      return (await response.json()) || []
    } catch (error) {
      console.error("[v0] Error fetching matches:", error)
      return []
    }
  },

  async deleteMatch(matchId) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/tournament_matches?id=eq.${matchId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
        },
      })
      if (!response.ok) throw new Error(await response.text())
    } catch (error) {
      console.error("[v0] Error deleting match:", error)
      throw error
    }
  },

  async saveMap(map) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/tournament_maps`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_KEY}`,
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

  async getMaps() {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/tournament_maps?order=created_at.asc`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
        },
      })
      if (!response.ok) return []
      return (await response.json()) || []
    } catch (error) {
      console.error("[v0] Error fetching maps:", error)
      return []
    }
  },

  async deleteMap(mapId) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/tournament_maps?id=eq.${mapId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
        },
      })
      if (!response.ok) throw new Error(await response.text())
    } catch (error) {
      console.error("[v0] Error deleting map:", error)
      throw error
    }
  },

  async saveMapBan(ban) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/map_bans`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_KEY}`,
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
      const response = await fetch(`${SUPABASE_URL}/rest/v1/map_bans?order=timestamp.desc`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
        },
      })
      if (!response.ok) return []
      return (await response.json()) || []
    } catch (error) {
      console.error("[v0] Error fetching map bans:", error)
      return []
    }
  },

  async deleteMapBan(banId) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/map_bans?id=eq.${banId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
        },
      })
      if (!response.ok) throw new Error(await response.text())
    } catch (error) {
      console.error("[v0] Error deleting map ban:", error)
      throw error
    }
  },

  async saveTournamentState(state) {
    try {
      const getResponse = await fetch(`${SUPABASE_URL}/rest/v1/tournament_state?id=eq.1`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
        },
      })
      const existing = await getResponse.json()

      if (existing && existing.length > 0) {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/tournament_state?id=eq.1`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${SUPABASE_KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({ state, updated_at: new Date().toISOString() }),
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      } else {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/tournament_state`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${SUPABASE_KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({ id: 1, state, updated_at: new Date().toISOString() }),
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      }
    } catch (error) {
      console.error("[v0] Error saving tournament state:", error)
      throw error
    }
  },

  async getTournamentState() {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/tournament_state?id=eq.1`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
        },
      })
      if (!response.ok) return { quarterfinals: [], semifinals: [], final: [], champion: null }
      const data = await response.json()
      return data && data.length > 0 ? data[0].state : { quarterfinals: [], semifinals: [], final: [], champion: null }
    } catch (error) {
      console.error("[v0] Error fetching tournament state:", error)
      return { quarterfinals: [], semifinals: [], final: [], champion: null }
    }
  },
}

window.supabase = window.SupabaseClient

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

try {
  module.exports = { supabase: window.SupabaseClient }
} catch (e) {
  // If module.exports doesn't exist, we're in a browser environment with script tags
  // window.SupabaseClient is already available globally
}

// For ES6 module syntax (if needed)
if (typeof exports !== "undefined") {
  exports.supabase = window.SupabaseClient
}
