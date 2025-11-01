const supabase = window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey)

// Funciones helper para interactuar con Supabase
const db = {
  // Teams
  async getTeams() {
    const { data, error } = await supabase.from("teams").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching teams:", error)
      return []
    }
    return data || []
  },

  async saveTeam(team) {
    const { data, error } = await supabase
      .from("teams")
      .upsert({
        id: team.id,
        name: team.name,
        abbreviation: team.abbreviation,
        group: team.group,
        logo: team.logo,
        points: team.points || 0,
      })
      .select()

    if (error) {
      console.error("[v0] Error saving team:", error)
      throw error
    }
    return data[0]
  },

  async deleteTeam(teamId) {
    const { error } = await supabase.from("teams").delete().eq("id", teamId)

    if (error) {
      console.error("[v0] Error deleting team:", error)
      throw error
    }
  },

  // Players
  async getPlayers() {
    const { data, error } = await supabase.from("players").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching players:", error)
      return []
    }
    return data || []
  },

  async savePlayer(player) {
    const { data, error } = await supabase
      .from("players")
      .upsert({
        id: player.id,
        team_id: player.teamId,
        name: player.name,
        uid: player.uid,
        country: player.country,
        country_code: player.countryCode,
        phone: player.phone,
        role: player.role,
        kills: player.stats?.kills || 0,
        assists: player.stats?.assists || 0,
        revives: player.stats?.revives || 0,
        vehicle_damage: player.stats?.vehicleDamage || 0,
      })
      .select()

    if (error) {
      console.error("[v0] Error saving player:", error)
      throw error
    }
    return data[0]
  },

  async deletePlayer(playerId) {
    const { error } = await supabase.from("players").delete().eq("id", playerId)

    if (error) {
      console.error("[v0] Error deleting player:", error)
      throw error
    }
  },

  // Matches
  async getMatches() {
    const { data, error } = await supabase.from("matches").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching matches:", error)
      return []
    }
    return data || []
  },

  async saveMatch(match) {
    const { data, error } = await supabase
      .from("matches")
      .insert({
        id: match.id,
        team1_id: match.team1,
        team2_id: match.team2,
        phase: match.phase,
        games_data: match.gamesData,
        winner_id: match.winner,
        score: match.score,
      })
      .select()

    if (error) {
      console.error("[v0] Error saving match:", error)
      throw error
    }
    return data[0]
  },

  async deleteMatch(matchId) {
    const { error } = await supabase.from("matches").delete().eq("id", matchId)

    if (error) {
      console.error("[v0] Error deleting match:", error)
      throw error
    }
  },

  // Maps
  async getMaps() {
    const { data, error } = await supabase.from("maps").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching maps:", error)
      return []
    }
    return data || []
  },

  async saveMap(map) {
    const { data, error } = await supabase
      .from("maps")
      .insert({
        id: map.id,
        name: map.name,
        image: map.image,
      })
      .select()

    if (error) {
      console.error("[v0] Error saving map:", error)
      throw error
    }
    return data[0]
  },

  async deleteMap(mapId) {
    const { error } = await supabase.from("maps").delete().eq("id", mapId)

    if (error) {
      console.error("[v0] Error deleting map:", error)
      throw error
    }
  },

  // Map Bans
  async getMapBans() {
    const { data, error } = await supabase.from("map_bans").select("*").order("timestamp", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching map bans:", error)
      return []
    }
    return data || []
  },

  async saveMapBan(ban) {
    const { data, error } = await supabase
      .from("map_bans")
      .insert({
        id: ban.id,
        team_id: ban.teamId,
        map_id: ban.mapId,
        timestamp: ban.timestamp,
      })
      .select()

    if (error) {
      console.error("[v0] Error saving map ban:", error)
      throw error
    }
    return data[0]
  },

  async deleteMapBan(banId) {
    const { error } = await supabase.from("map_bans").delete().eq("id", banId)

    if (error) {
      console.error("[v0] Error deleting map ban:", error)
      throw error
    }
  },

  // Hero Stats
  async getHeroStats() {
    const { data, error } = await supabase.from("hero_stats").select("*").single()

    if (error && error.code !== "PGRST116") {
      console.error("[v0] Error fetching hero stats:", error)
    }

    return data || { teams: 16, players: 80, matches: 15 }
  },

  async saveHeroStats(stats) {
    const { data, error } = await supabase
      .from("hero_stats")
      .upsert({
        id: 1,
        teams: stats.teams,
        players: stats.players,
        matches: stats.matches,
      })
      .select()

    if (error) {
      console.error("[v0] Error saving hero stats:", error)
      throw error
    }
    return data[0]
  },

  // Tournament State
  async getTournamentState() {
    const { data, error } = await supabase.from("tournament_state").select("*").single()

    if (error && error.code !== "PGRST116") {
      console.error("[v0] Error fetching tournament state:", error)
    }

    return (
      data || {
        quarterfinals: [],
        semifinals: [],
        final: [],
        champion: null,
      }
    )
  },

  async saveTournamentState(state) {
    const { data, error } = await supabase
      .from("tournament_state")
      .upsert({
        id: 1,
        quarterfinals: state.quarterfinals,
        semifinals: state.semifinals,
        final: state.final,
        champion: state.champion,
      })
      .select()

    if (error) {
      console.error("[v0] Error saving tournament state:", error)
      throw error
    }
    return data[0]
  },
}

// Exportar para uso global
window.db = db
window.supabaseClient = supabase

console.log("[v0] Supabase client initialized")
