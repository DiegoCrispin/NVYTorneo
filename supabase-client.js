const SUPABASE_URL = "https://zcvusshnfywwnuoqviah.supabase.co"
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjdnVzc2huZnl3d251b3F2aWFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwNDkyOTAsImV4cCI6MjA3NzYyNTI5MH0.jIsZ82kWcpiwPmVJIqqSvEsnkEQLLW4F2WEtm5SiwVw"

// Generic fetch helper for Supabase REST API
async function supabaseFetch(method, table, options = {}) {
  try {
    const headers = {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    }

    let url = `${SUPABASE_URL}/rest/v1/${table}`
    let query = ""

    if (options.select) {
      query += `select=${options.select}`
    }

    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        if (query) query += "&"
        query += `${key}=eq.${encodeURIComponent(value)}`
      })
    }

    if (options.order) {
      if (query) query += "&"
      query += `order=${options.order}`
    }

    if (options.limit) {
      if (query) query += "&"
      query += `limit=${options.limit}`
    }

    if (query) url += `?${query}`

    const config = {
      method: method,
      headers: headers,
    }

    if (method !== "GET" && options.data) {
      config.body = JSON.stringify(Array.isArray(options.data) ? options.data : [options.data])
    }

    const response = await fetch(url, config)

    if (!response.ok) {
      console.error(`[v0] Supabase error: ${response.status}`)
      return null
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error(`[v0] Supabase fetch error:`, error)
    return null
  }
}

// Registered Teams operations
async function fetchRegisteredTeams() {
  const data = await supabaseFetch("GET", "registered_teams", {
    select: "*",
    order: "created_at.desc",
  })
  return data || []
}

async function saveRegisteredTeam(teamData) {
  const response = await supabaseFetch("POST", "registered_teams", {
    data: teamData,
  })
  return response
}

async function updateRegisteredTeam(teamId, teamData) {
  return await supabaseFetch("PATCH", `registered_teams?id=eq.${teamId}`, {
    data: teamData,
  })
}

async function deleteRegisteredTeam(teamId) {
  return await supabaseFetch("DELETE", `registered_teams?id=eq.${teamId}`)
}

// Teams operations
async function fetchTeams() {
  const data = await supabaseFetch("GET", "teams", {
    select: "*",
    order: "created_at.desc",
  })
  return data || []
}

async function saveTeam(teamData) {
  return await supabaseFetch("POST", "teams", {
    data: teamData,
  })
}

async function updateTeam(teamId, teamData) {
  return await supabaseFetch("PATCH", `teams?id=eq.${teamId}`, {
    data: teamData,
  })
}

async function deleteTeam(teamId) {
  return await supabaseFetch("DELETE", `teams?id=eq.${teamId}`)
}

// Players operations
async function fetchPlayers() {
  const data = await supabaseFetch("GET", "players", {
    select: "*",
    order: "created_at.asc",
  })
  return data || []
}

async function savePlayers(playersData) {
  if (!Array.isArray(playersData)) playersData = [playersData]
  return await supabaseFetch("POST", "players", {
    data: playersData,
  })
}

async function updatePlayer(playerId, playerData) {
  return await supabaseFetch("PATCH", `players?id=eq.${playerId}`, {
    data: playerData,
  })
}

async function deletePlayer(playerId) {
  return await supabaseFetch("DELETE", `players?id=eq.${playerId}`)
}

// Maps operations
async function fetchMaps() {
  const data = await supabaseFetch("GET", "maps", {
    select: "*",
    order: "created_at.asc",
  })
  return data || []
}

async function saveMap(mapData) {
  return await supabaseFetch("POST", "maps", {
    data: mapData,
  })
}

async function deleteMap(mapId) {
  return await supabaseFetch("DELETE", `maps?id=eq.${mapId}`)
}

// Matches operations
async function fetchMatches() {
  const data = await supabaseFetch("GET", "matches", {
    select: "*",
    order: "created_at.desc",
  })
  return data || []
}

async function saveMatch(matchData) {
  return await supabaseFetch("POST", "matches", {
    data: matchData,
  })
}

async function updateMatch(matchId, matchData) {
  return await supabaseFetch("PATCH", `matches?id=eq.${matchId}`, {
    data: matchData,
  })
}

async function deleteMatch(matchId) {
  return await supabaseFetch("DELETE", `matches?id=eq.${matchId}`)
}

// Map Bans operations
async function fetchMapBans() {
  const data = await supabaseFetch("GET", "map_bans", {
    select: "*",
    order: "timestamp.desc",
  })
  return data || []
}

async function saveMapBan(banData) {
  return await supabaseFetch("POST", "map_bans", {
    data: banData,
  })
}

async function deleteMapBan(banId) {
  return await supabaseFetch("DELETE", `map_bans?id=eq.${banId}`)
}

// Hero Stats operations
async function fetchHeroStats() {
  const data = await supabaseFetch("GET", "hero_stats", {
    select: "*",
    limit: 1,
  })
  return data && data.length > 0 ? data[0] : { id: "main", teams: 0, players: 0, matches: 0 }
}

async function updateHeroStats(statsData) {
  return await supabaseFetch("PATCH", `hero_stats?id=eq.main`, {
    data: statsData,
  })
}

// Tournament State operations
async function fetchTournamentState() {
  const data = await supabaseFetch("GET", "tournament_state", {
    select: "*",
    filters: { id: "main" },
  })
  return data && data.length > 0
    ? data[0]
    : { id: "main", quarterfinals: [], semifinals: [], final: [], champion: null }
}

async function updateTournamentState(stateData) {
  return await supabaseFetch("PATCH", `tournament_state?id=eq.main`, {
    data: stateData,
  })
}

// Real-time polling
const subscriptions = {}

function subscribeToChanges(table, callback, interval = 2000) {
  const subscriptionKey = `${table}_subscription`

  const polling = setInterval(async () => {
    let data = []
    if (table === "registered_teams") data = await fetchRegisteredTeams()
    else if (table === "teams") data = await fetchTeams()
    else if (table === "players") data = await fetchPlayers()
    else if (table === "matches") data = await fetchMatches()
    else if (table === "maps") data = await fetchMaps()
    else if (table === "map_bans") data = await fetchMapBans()
    else if (table === "hero_stats") data = [await fetchHeroStats()]
    else if (table === "tournament_state") data = [await fetchTournamentState()]

    callback({ new: data, eventType: "UPDATE" })
  }, interval)

  subscriptions[subscriptionKey] = polling
  return polling
}

function unsubscribe(table) {
  const subscriptionKey = `${table}_subscription`
  if (subscriptions[subscriptionKey]) {
    clearInterval(subscriptions[subscriptionKey])
    delete subscriptions[subscriptionKey]
  }
}

// Export functions globally
window.supabase = {
  fetchRegisteredTeams,
  saveRegisteredTeam,
  updateRegisteredTeam,
  deleteRegisteredTeam,
  fetchTeams,
  saveTeam,
  updateTeam,
  deleteTeam,
  fetchPlayers,
  savePlayers,
  updatePlayer,
  deletePlayer,
  fetchMaps,
  saveMap,
  deleteMap,
  fetchMatches,
  saveMatch,
  updateMatch,
  deleteMatch,
  fetchMapBans,
  saveMapBan,
  deleteMapBan,
  fetchHeroStats,
  updateHeroStats,
  fetchTournamentState,
  updateTournamentState,
  subscribeToChanges,
  unsubscribe,
}
