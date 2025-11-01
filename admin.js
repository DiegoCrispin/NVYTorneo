// Variables globales
let registeredTeams = []
const XLSX = window.XLSX || null

// Data Storage (torneo principal)
let teams = []
let players = []
let matches = []
let maps = []
let mapBans = []
let heroStats = {
  teams: 16,
  players: 80,
  matches: 15,
}
let tournamentState = {
  quarterfinals: [],
  semifinals: [],
  final: [],
  champion: null,
}

function waitForDB() {
  return new Promise((resolve) => {
    if (window.db && window.supabaseClient) {
      resolve()
    } else {
      const checkDB = setInterval(() => {
        if (window.db && window.supabaseClient) {
          clearInterval(checkDB)
          resolve()
        }
      }, 100)
    }
  })
}

async function loadAllData() {
  try {
    console.log("[v0] Loading all data from Supabase...")

    const [teamsData, playersData, matchesData, mapsData, mapBansData, heroStatsData, tournamentStateData] =
      await Promise.all([
        window.db.getTeams(),
        window.db.getPlayers(),
        window.db.getMatches(),
        window.db.getMaps(),
        window.db.getMapBans(),
        window.db.getHeroStats(),
        window.db.getTournamentState(),
      ])

    console.log("[v0] Datos cargados:", {
      teams: teamsData.length,
      players: playersData.length,
      matches: matchesData.length,
      maps: mapsData.length,
    })

    registeredTeams = teamsData.map((team) => ({
      id: team.id,
      name: team.name,
      abbreviation: team.abbreviation,
      group: team.group,
      logo: team.logo,
      points: team.points || 0,
      createdAt: team.created_at,
      players: [],
    }))

    playersData.forEach((player) => {
      const team = registeredTeams.find((t) => t.id === player.team_id)
      if (team) {
        team.players.push({
          id: player.id,
          name: player.name,
          uid: player.uid,
          country: player.country,
          countryCode: player.country_code,
          phone: player.phone,
          role: player.role,
          stats: {
            kills: player.kills || 0,
            assists: player.assists || 0,
            revives: player.revives || 0,
            vehicleDamage: player.vehicle_damage || 0,
          },
        })
      }
    })

    teams = registeredTeams
    players = playersData.map((p) => ({
      id: p.id,
      teamId: p.team_id,
      name: p.name,
      uid: p.uid,
      role: p.role,
      stats: {
        kills: p.kills || 0,
        assists: p.assists || 0,
        revives: p.revives || 0,
        vehicleDamage: p.vehicle_damage || 0,
      },
    }))

    matches = matchesData.map((m) => ({
      id: m.id,
      team1: m.team1_id,
      team2: m.team2_id,
      phase: m.phase,
      gamesData: m.games_data,
      winner: m.winner_id,
      score: m.score,
    }))

    maps = mapsData
    mapBans = mapBansData.map((b) => ({
      id: b.id,
      teamId: b.team_id,
      mapId: b.map_id,
      timestamp: b.timestamp,
    }))

    heroStats = {
      teams: heroStatsData.teams || 16,
      players: heroStatsData.players || 80,
      matches: heroStatsData.matches || 15,
    }

    tournamentState = {
      quarterfinals: tournamentStateData.quarterfinals || [],
      semifinals: tournamentStateData.semifinals || [],
      final: tournamentStateData.final || [],
      champion: tournamentStateData.champion,
    }

    console.log("[v0] Data loaded successfully")
  } catch (error) {
    console.error("[v0] Error loading data:", error)
    alert("Error al cargar los datos. Por favor recarga la página.")
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  console.log("[v0] DOMContentLoaded - Esperando DB")
  await waitForDB()
  console.log("[v0] DB disponible, cargando datos")

  await loadAllData()

  console.log("[v0] Inicializando navegación")
  initAdminNavigation()

  console.log("[v0] Cargando secciones")
  loadHeroStats()
  loadTeams()
  loadPlayers()
  loadMatches()
  loadMaps()
  initForms()
  renderRegisteredTeams()
  initEditTeamsSection()

  const exportBtn = document.getElementById("exportAllBtn")
  if (exportBtn) {
    exportBtn.addEventListener("click", exportAllTeamsToExcel)
  }

  subscribeToRealtimeChanges()
  console.log("[v0] Admin panel inicializado completamente")
})

function subscribeToRealtimeChanges() {
  window.supabaseClient
    .channel("teams-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "teams" }, async () => {
      console.log("[v0] Teams changed, reloading...")
      await loadAllData()
      loadTeams()
      renderRegisteredTeams()
    })
    .subscribe()

  window.supabaseClient
    .channel("players-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "players" }, async () => {
      console.log("[v0] Players changed, reloading...")
      await loadAllData()
      loadPlayers()
    })
    .subscribe()

  window.supabaseClient
    .channel("matches-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, async () => {
      console.log("[v0] Matches changed, reloading...")
      await loadAllData()
      loadMatches()
    })
    .subscribe()

  window.supabaseClient
    .channel("maps-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "maps" }, async () => {
      console.log("[v0] Maps changed, reloading...")
      await loadAllData()
      loadMaps()
    })
    .subscribe()
}

function initAdminNavigation() {
  const navLinks = document.querySelectorAll(".admin-nav-link")
  console.log("[v0] Inicializando navegación, enlaces encontrados:", navLinks.length)

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault()
      console.log("[v0] Click en navegación:", link.dataset.section)

      // Remover active de todos los links
      navLinks.forEach((l) => l.classList.remove("active"))
      link.classList.add("active")

      // Obtener la sección a mostrar
      const sectionId = link.dataset.section

      // Ocultar todas las secciones
      document.querySelectorAll(".admin-section").forEach((section) => {
        section.classList.remove("active")
      })

      // Mostrar la sección seleccionada
      const target = document.getElementById(sectionId)
      if (target) {
        target.classList.add("active")
        console.log("[v0] Mostrando sección:", sectionId)
      } else {
        console.error("[v0] Sección no encontrada:", sectionId)
      }

      // Cargar datos de la sección
      loadAdminSection(sectionId)
    })
  })
}

function loadAdminSection(sectionName) {
  if (sectionName === "hero-stats") {
    loadHeroStats()
  } else if (sectionName === "teams") {
    loadTeams()
  } else if (sectionName === "registered-teams") {
    renderRegisteredTeams()
  } else if (sectionName === "players") {
    loadPlayers()
  } else if (sectionName === "player-stats") {
    loadPlayerStats()
  } else if (sectionName === "matches") {
    loadMatches()
    updateMatchTeamSelects()
  } else if (sectionName === "maps") {
    loadMaps()
    updateBanTeamSelect()
  }
}

function loadHeroStats() {
  const elTeams = document.getElementById("heroTeams")
  const elPlayers = document.getElementById("heroPlayers")
  const elMatches = document.getElementById("heroMatches")
  if (elTeams) elTeams.value = heroStats.teams
  if (elPlayers) elPlayers.value = heroStats.players
  if (elMatches) elMatches.value = heroStats.matches
}

function initForms() {
  const heroStatsForm = document.getElementById("heroStatsForm")
  if (heroStatsForm) {
    heroStatsForm.addEventListener("submit", async (e) => {
      e.preventDefault()
      heroStats = {
        teams: Number.parseInt(document.getElementById("heroTeams").value) || 0,
        players: Number.parseInt(document.getElementById("heroPlayers").value) || 0,
        matches: Number.parseInt(document.getElementById("heroMatches").value) || 0,
      }
      try {
        await window.db.saveHeroStats(heroStats)
        alert("Estadísticas del hero actualizadas")
      } catch (error) {
        alert("Error al actualizar estadísticas")
      }
    })
  }

  const teamForm = document.getElementById("teamForm")
  if (teamForm)
    teamForm.addEventListener("submit", (e) => {
      e.preventDefault()
      saveTeam()
    })

  const playerForm = document.getElementById("playerForm")
  if (playerForm)
    playerForm.addEventListener("submit", (e) => {
      e.preventDefault()
      savePlayer()
    })

  const statsForm = document.getElementById("statsForm")
  if (statsForm)
    statsForm.addEventListener("submit", (e) => {
      e.preventDefault()
      updatePlayerStatsFromRegistered()
    })

  const matchForm = document.getElementById("matchForm")
  if (matchForm)
    matchForm.addEventListener("submit", (e) => {
      e.preventDefault()
      saveMatch()
    })

  const mapForm = document.getElementById("mapForm")
  if (mapForm)
    mapForm.addEventListener("submit", (e) => {
      e.preventDefault()
      saveMap()
    })

  const mapBanForm = document.getElementById("mapBanForm")
  if (mapBanForm)
    mapBanForm.addEventListener("submit", (e) => {
      e.preventDefault()
      saveMapBan()
    })

  const matchTeam1 = document.getElementById("matchTeam1")
  const matchTeam2 = document.getElementById("matchTeam2")
  if (matchTeam1) matchTeam1.addEventListener("change", updateGameWinners)
  if (matchTeam2) matchTeam2.addEventListener("change", updateGameWinners)

  document.querySelectorAll(".game-winner").forEach((select) => {
    select.addEventListener("change", calculateSeriesWinner)
  })
}

function renderRegisteredTeams() {
  const container = document.getElementById("registeredTeamsList")
  if (!container) return

  if (!registeredTeams || registeredTeams.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>No hay equipos registrados aún</p>
      </div>
    `
    return
  }

  container.innerHTML = registeredTeams
    .map((team) => {
      return `
    <div class="registered-team-card">
      <div class="team-card-header">
        <div class="team-card-logo-section">
          <img src="${team.logo || ""}" alt="${team.name}" class="team-card-logo" onerror="this.style.display='none'">
          <div class="team-card-info">
            <h3>${team.name}</h3>
            <p class="team-abbreviation">${team.abbreviation || ""} | Grupo ${team.group || ""}</p>
            <p class="team-date">Registrado: ${team.createdAt ? new Date(team.createdAt).toLocaleDateString("es-ES") : ""}</p>
          </div>
        </div>
        <div class="team-card-actions">
          <button class="btn-secondary" onclick="exportTeamToExcel('${team.id}')">Exportar Excel</button>
          <button class="btn-danger" onclick="deleteRegisteredTeam('${team.id}')">Eliminar</button>
        </div>
      </div>

      <div class="team-card-details">
        <div class="team-players-info">
          <span class="info-badge">${team.players ? team.players.length : 0} Jugadores</span>
          <span class="info-badge leader-badge">1 Líder</span>
          <span class="info-badge suplentes-badge">${team.players ? team.players.filter((p) => p.role === "substitute").length : 0} Suplentes</span>
        </div>

        <div class="team-players-list">
          ${(team.players || [])
            .map(
              (player) => `
            <div class="player-list-item ${player.role || ""}">
              <div class="player-role-indicator" title="${player.role || ""}">
                ${player.role === "leader" ? "★" : player.role === "substitute" ? "S" : ""}
              </div>
              <div class="player-list-info">
                <span class="player-list-name">${player.name || ""}</span>
                <span class="player-list-uid">${player.uid || ""}</span>
              </div>
              <div class="player-list-country">
                <span class="flag-icon">${getCountryFlag(player.country)}</span>
              </div>
            </div>
          `,
            )
            .join("")}
        </div>
      </div>
    </div>
  `
    })
    .join("")
}

function getCountryFlag(countryKey) {
  if (!countryKey) return "🌍"
  const flags = {
    argentina: "🇦🇷",
    bolivia: "🇧🇴",
    chile: "🇨🇱",
    colombia: "🇨🇴",
    costarica: "🇨🇷",
    cuba: "🇨🇺",
    ecuador: "🇪🇨",
    elsalvador: "🇸🇻",
    guatemala: "🇬🇹",
    honduras: "🇭🇳",
    mexico: "🇲🇽",
    nicaragua: "🇳🇮",
    panama: "🇵🇦",
    paraguay: "🇵🇾",
    peru: "🇵🇪",
    republicadominicana: "🇩🇴",
    uruguay: "🇺🇾",
    venezuela: "🇻🇪",
  }
  return flags[countryKey] || "🌍"
}

function saveTeam() {
  const id = document.getElementById("teamId").value || Date.now().toString()
  const name = document.getElementById("teamName").value
  const group = document.getElementById("teamGroup").value
  const logoFileEl = document.getElementById("teamLogoFile")
  const logoFile = logoFileEl ? logoFileEl.files[0] : null
  const logoUrl = document.getElementById("teamLogo").value
  const points = Number.parseInt(document.getElementById("teamPoints").value) || 0

  const teamIndex = teams.findIndex((t) => t.id === id)

  if (logoFile) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const team = { id, name, group, logo: e.target.result, points }
      saveTeamData(team, teamIndex)
    }
    reader.readAsDataURL(logoFile)
  } else {
    const team = { id, name, group, logo: logoUrl, points }
    saveTeamData(team, teamIndex)
  }
}

async function saveTeamData(team, teamIndex) {
  try {
    await window.db.saveTeam(team)

    if (teamIndex >= 0) {
      teams[teamIndex] = team
      registeredTeams[teamIndex] = team
    } else {
      teams.push(team)
      registeredTeams.push(team)
    }

    loadTeams()
    const form = document.getElementById("teamForm")
    if (form) form.reset()
    document.getElementById("teamId").value = ""
    alert("Equipo guardado")
  } catch (error) {
    console.error("[v0] Error saving team:", error)
    alert("Error al guardar el equipo")
  }
}

function loadTeams() {
  const container = document.getElementById("teamsList")
  if (!container) return
  container.innerHTML = teams
    .map(
      (team) => `
        <div class="admin-item">
            <div class="admin-item-info">
                <h4>${team.name}</h4>
                <p>Grupo ${team.group} - ${team.points || 0} puntos</p>
            </div>
            <div class="admin-item-actions">
                <button class="btn-edit" onclick="editTeam('${team.id}')">Editar</button>
                <button class="btn-delete" onclick="deleteTeam('${team.id}')">Eliminar</button>
            </div>
        </div>
    `,
    )
    .join("")
  updateTeamSelects()
}

function editTeam(id) {
  const team = teams.find((t) => t.id === id)
  if (!team) return
  document.getElementById("teamId").value = team.id
  document.getElementById("teamName").value = team.name
  document.getElementById("teamGroup").value = team.group
  document.getElementById("teamLogo").value = team.logo || ""
  document.getElementById("teamPoints").value = team.points || 0
  const sectionBtn = document.querySelector('[data-section="teams"]')
  if (sectionBtn) sectionBtn.click()
}

async function deleteTeam(id) {
  if (!confirm("¿Eliminar este equipo?")) return

  try {
    await window.db.deleteTeam(id)
    teams = teams.filter((t) => t.id !== id)
    registeredTeams = registeredTeams.filter((t) => t.id !== id)
    loadTeams()
  } catch (error) {
    console.error("[v0] Error deleting team:", error)
    alert("Error al eliminar el equipo")
  }
}

async function savePlayer() {
  const id = document.getElementById("playerId").value || Date.now().toString()
  const name = document.getElementById("playerName").value
  const uid = document.getElementById("playerUID").value
  const teamId = document.getElementById("playerTeam").value
  const role = document.getElementById("playerRole").value

  if (!/^\d{20}$/.test(uid)) {
    alert("La UID debe tener exactamente 20 dígitos")
    return
  }

  const playerIndex = players.findIndex((p) => p.id === id)
  const player = {
    id,
    name,
    uid,
    teamId,
    role,
    stats:
      playerIndex >= 0
        ? players[playerIndex].stats
        : {
            kills: 0,
            assists: 0,
            revives: 0,
            vehicleDamage: 0,
          },
  }

  try {
    await window.db.savePlayer(player)

    if (playerIndex >= 0) {
      players[playerIndex] = player
    } else {
      players.push(player)
    }

    loadPlayers()
    const form = document.getElementById("playerForm")
    if (form) form.reset()
    document.getElementById("playerId").value = ""
    alert("Jugador guardado")
  } catch (error) {
    console.error("[v0] Error saving player:", error)
    alert("Error al guardar el jugador")
  }
}

function loadPlayers() {
  const container = document.getElementById("playersList")
  if (!container) return
  container.innerHTML = players
    .map((player) => {
      const team = teams.find((t) => t.id === player.teamId)
      return `
            <div class="admin-item">
                <div class="admin-item-info">
                    <h4>${player.name}</h4>
                    <p>${team ? team.name : "Sin equipo"} - ${player.role}</p>
                    <p><small>UID: ${player.uid || "No registrada"}</small></p>
                </div>
                <div class="admin-item-actions">
                    <button class="btn-edit" onclick="editPlayer('${player.id}')">Editar</button>
                    <button class="btn-delete" onclick="deletePlayer('${player.id}')">Eliminar</button>
                </div>
            </div>
        `
    })
    .join("")
  updateTeamSelects()
}

function editPlayer(id) {
  const player = players.find((p) => p.id === id)
  if (!player) return
  document.getElementById("playerId").value = player.id
  document.getElementById("playerName").value = player.name
  document.getElementById("playerUID").value = player.uid || ""
  document.getElementById("playerTeam").value = player.teamId || ""
  document.getElementById("playerRole").value = player.role || ""
  const sectionBtn = document.querySelector('[data-section="players"]')
  if (sectionBtn) sectionBtn.click()
}

async function deletePlayer(id) {
  if (!confirm("¿Eliminar este jugador?")) return

  try {
    await window.db.deletePlayer(id)
    players = players.filter((p) => p.id !== id)
    loadPlayers()
  } catch (error) {
    console.error("[v0] Error deleting player:", error)
    alert("Error al eliminar el jugador")
  }
}

function loadPlayerStats() {
  const statsTeam = document.getElementById("statsTeam")

  if (!statsTeam) return

  statsTeam.innerHTML =
    '<option value="">Seleccionar equipo registrado</option>' +
    registeredTeams.map((team) => `<option value="${team.id}">${team.name} (${team.abbreviation})</option>`).join("")

  statsTeam.addEventListener("change", function () {
    const teamId = this.value
    const statsPlayerSelect = document.getElementById("statsPlayer")
    const mapBanContainer = document.getElementById("mapBansContainer")

    if (!teamId) {
      if (statsPlayerSelect) statsPlayerSelect.innerHTML = '<option value="">Selecciona un equipo primero</option>'
      return
    }

    const team = registeredTeams.find((t) => t.id === teamId)
    if (!team || !team.players) {
      if (statsPlayerSelect) statsPlayerSelect.innerHTML = '<option value="">Sin jugadores</option>'
      return
    }

    if (statsPlayerSelect) {
      statsPlayerSelect.innerHTML =
        '<option value="">Seleccionar jugador</option>' +
        team.players
          .map(
            (player, idx) =>
              `<option value="${team.id}_${idx}">${player.name} - ${player.role} (${player.uid})</option>`,
          )
          .join("")
    }

    if (mapBanContainer) {
      mapBanContainer.innerHTML = `
        <div class="team-stats-banner">
          <div class="team-info-display">
            <img src="${team.logo || ""}" alt="${team.name}" class="team-logo-display" onerror="this.style.display='none'">
            <div class="team-details">
              <h3>${team.name}</h3>
              <p><strong>Abreviación:</strong> ${team.abbreviation}</p>
              <p><strong>Grupo:</strong> ${team.group}</p>
              <p><strong>Total Jugadores:</strong> ${team.players.length}</p>
            </div>
          </div>
        </div>

        <div class="team-roster-display">
          <h4>Roster del Equipo</h4>
          <div class="roster-grid">
            ${team.players
              .map(
                (player) => `
              <div class="roster-player-card">
                <div class="player-role-badge ${player.role}">${player.role === "leader" ? "★ Líder" : player.role === "substitute" ? "S Suplente" : "Miembro"}</div>
                <h5>${player.name}</h5>
                <p class="player-uid">${player.uid}</p>
                <p class="player-country">${getCountryFlag(player.country)} ${player.country || "N/A"}</p>
                <div class="player-stats-summary">
                  <span>Bajas: ${(player.stats && player.stats.kills) || 0}</span>
                  <span>Asistencias: ${(player.stats && player.stats.assists) || 0}</span>
                </div>
              </div>
            `,
              )
              .join("")}
          </div>
        </div>
      `
    }
  })
}

async function updatePlayerStatsFromRegistered() {
  const statsTeamSelect = document.getElementById("statsTeam")
  const statsPlayerSelect = document.getElementById("statsPlayer")

  if (!statsTeamSelect.value || !statsPlayerSelect.value) {
    alert("Selecciona un equipo y un jugador")
    return
  }

  const [teamId, playerIdx] = statsPlayerSelect.value.split("_")
  const team = registeredTeams.find((t) => t.id === teamId)
  const playerIndex = Number.parseInt(playerIdx)

  if (!team || !team.players || !team.players[playerIndex]) {
    alert("Jugador no encontrado")
    return
  }

  const player = team.players[playerIndex]
  const kills = Number.parseInt(document.getElementById("statsKills").value) || 0
  const assists = Number.parseInt(document.getElementById("statsAssists").value) || 0
  const revives = Number.parseInt(document.getElementById("statsRevives").value) || 0
  const vehicleDamage = Number.parseInt(document.getElementById("statsVehicleDamage").value) || 0

  if (!player.stats) {
    player.stats = { kills: 0, assists: 0, revives: 0, vehicleDamage: 0 }
  }

  player.stats.kills += kills
  player.stats.assists += assists
  player.stats.revives += revives
  player.stats.vehicleDamage += vehicleDamage

  try {
    await window.db.savePlayer({
      id: player.id,
      teamId: teamId,
      name: player.name,
      uid: player.uid,
      country: player.country,
      countryCode: player.countryCode,
      phone: player.phone,
      role: player.role,
      stats: player.stats,
    })

    const statsForm = document.getElementById("statsForm")
    if (statsForm) statsForm.reset()

    alert(
      `Estadísticas actualizadas para ${player.name}!\nBalas: +${kills} | Asistencias: +${assists} | Revividas: +${revives} | Daño: +${vehicleDamage}`,
    )
  } catch (error) {
    console.error("[v0] Error updating player stats:", error)
    alert("Error al actualizar estadísticas")
  }
}

function updateGameWinners() {
  const team1IdEl = document.getElementById("matchTeam1")
  const team2IdEl = document.getElementById("matchTeam2")
  const team1Id = team1IdEl ? team1IdEl.value : ""
  const team2Id = team2IdEl ? team2IdEl.value : ""

  if (!team1Id || !team2Id) return

  const team1 = teams.find((t) => t.id === team1Id)
  const team2 = teams.find((t) => t.id === team2Id)

  document.querySelectorAll(".game-winner").forEach((select) => {
    select.innerHTML = `
            <option value="">Ganador</option>
            <option value="${team1Id}">${team1 ? team1.name : "Equipo 1"}</option>
            <option value="${team2Id}">${team2 ? team2.name : "Equipo 2"}</option>
        `
  })

  document.querySelectorAll(".game-map").forEach((select) => {
    select.innerHTML =
      '<option value="">No jugado</option>' + maps.map((m) => `<option value="${m.id}">${m.name}</option>`).join("")
  })
}

function calculateSeriesWinner() {
  const team1Id = document.getElementById("matchTeam1").value
  const team2Id = document.getElementById("matchTeam2").value
  if (!team1Id || !team2Id) return
  let team1Wins = 0
  let team2Wins = 0
  document.querySelectorAll(".game-winner").forEach((select) => {
    if (select.value === team1Id) team1Wins++
    if (select.value === team2Id) team2Wins++
  })
  const team1 = teams.find((t) => t.id === team1Id)
  const team2 = teams.find((t) => t.id === team2Id)
  const winnerSpan = document.getElementById("seriesWinner")
  if (!winnerSpan) return
  if (team1Wins >= 3) {
    winnerSpan.textContent = `${team1.name} (${team1Wins}-${team2Wins})`
  } else if (team2Wins >= 3) {
    winnerSpan.textContent = `${team2.name} (${team2Wins}-${team1Wins})`
  } else if (team1Wins > 0 || team2Wins > 0) {
    winnerSpan.textContent = `En progreso (${team1Wins}-${team2Wins})`
  } else {
    winnerSpan.textContent = "-"
  }
}

async function saveMatch() {
  const phase = document.getElementById("matchPhase").value
  const team1 = document.getElementById("matchTeam1").value
  const team2 = document.getElementById("matchTeam2").value

  const gamesData = []
  document.querySelectorAll(".game-map").forEach((mapSelect, index) => {
    const mapId = mapSelect.value
    const winnerSelect = document.querySelectorAll(".game-winner")[index]
    const winnerId = winnerSelect ? winnerSelect.value : ""
    if (mapId && winnerId) {
      gamesData.push({
        mapId: mapId,
        winner: winnerId,
      })
    }
  })

  if (gamesData.length === 0) {
    alert("Debes agregar al menos un mapa jugado con su ganador")
    return
  }

  let winner = null
  const team1Wins = gamesData.filter((g) => g.winner === team1).length
  const team2Wins = gamesData.filter((g) => g.winner === team2).length

  if (team1Wins >= 3) winner = team1
  if (team2Wins >= 3) winner = team2

  const match = {
    id: Date.now().toString(),
    phase,
    team1,
    team2,
    gamesData,
    winner,
    score: `${team1Wins}-${team2Wins}`,
  }

  try {
    await window.db.saveMatch(match)
    matches.push(match)

    if (phase === "groups" && winner) {
      const winnerTeam = registeredTeams.find((t) => t.id === winner)

      if (winnerTeam) {
        winnerTeam.points = (winnerTeam.points || 0) + 1
        await window.db.saveTeam(winnerTeam)
      }

      checkAndQualifyTeams()
    }

    if (winner && phase !== "groups") {
      updateTournamentState(phase, winner)
    }

    loadMatches()
    const matchForm = document.getElementById("matchForm")
    if (matchForm) matchForm.reset()
    const seriesWinner = document.getElementById("seriesWinner")
    if (seriesWinner) seriesWinner.textContent = "-"
    alert("Partida guardada y puntos actualizados")
  } catch (error) {
    console.error("[v0] Error saving match:", error)
    alert("Error al guardar la partida")
  }
}

async function checkAndQualifyTeams() {
  const groups = ["A", "B", "C", "D"]
  const groupMatches = matches.filter((m) => m.phase === "groups")

  groups.forEach(async (groupName) => {
    const groupTeams = teams.filter((t) => t.group === groupName)
    const groupTeamIds = groupTeams.map((t) => t.id)
    const matchesInGroup = groupMatches.filter((m) => groupTeamIds.includes(m.team1) && groupTeamIds.includes(m.team2))
    if (matchesInGroup.length >= 6) {
      const sortedTeams = groupTeams.sort((a, b) => (b.points || 0) - (a.points || 0)).slice(0, 2)
      sortedTeams.forEach((team) => {
        if (!tournamentState.quarterfinals.includes(team.id)) {
          tournamentState.quarterfinals.push(team.id)
        }
      })
    }
  })

  await window.db.saveTournamentState(tournamentState)
}

async function updateTournamentState(phase, winnerId) {
  if (phase === "quarterfinals") {
    if (!tournamentState.semifinals.includes(winnerId)) {
      tournamentState.semifinals.push(winnerId)
    }
  } else if (phase === "semifinals") {
    if (!tournamentState.final.includes(winnerId)) {
      tournamentState.final.push(winnerId)
    }
  } else if (phase === "final") {
    tournamentState.champion = winnerId
  }

  await window.db.saveTournamentState(tournamentState)
}

function loadMatches() {
  const container = document.getElementById("matchesList")
  if (!container) return
  container.innerHTML = matches
    .map((match) => {
      const team1 = teams.find((t) => t.id === match.team1)
      const team2 = teams.find((t) => t.id === match.team2)
      const winner = teams.find((t) => t.id === match.winner)
      const mapsPlayed = match.gamesData
        ? match.gamesData.map((game) => {
            const map = maps.find((m) => m.id === game.mapId)
            return map ? map.name : "Desconocido"
          })
        : []
      return `
            <div class="admin-item">
                <div class="admin-item-info">
                    <h4>${team1 ? team1.name : "TBD"} vs ${team2 ? team2.name : "TBD"}</h4>
                    <p>${match.phase} - Ganador: ${winner ? winner.name : "Pendiente"}</p>
                    ${mapsPlayed.length > 0 ? `<p><small>Mapas: ${mapsPlayed.join(", ")}</small></p>` : ""}
                </div>
                <div class="admin-item-actions">
                    <button class="btn-delete" onclick="deleteMatch('${match.id}')">Eliminar</button>
                </div>
            </div>
        `
    })
    .join("")
}

async function deleteMatch(id) {
  if (!confirm("¿Eliminar esta partida?")) return

  try {
    await window.db.deleteMatch(id)
    matches = matches.filter((m) => m.id !== id)
    loadMatches()
  } catch (error) {
    console.error("[v0] Error deleting match:", error)
    alert("Error al eliminar la partida")
  }
}

function saveMap() {
  const name = document.getElementById("mapName").value
  const imageFileEl = document.getElementById("mapImageFile")
  const imageFile = imageFileEl ? imageFileEl.files[0] : null
  const imageUrl = document.getElementById("mapImage").value

  if (imageFile) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const map = { id: Date.now().toString(), name, image: e.target.result }
      saveMapData(map)
    }
    reader.readAsDataURL(imageFile)
  } else {
    const map = { id: Date.now().toString(), name, image: imageUrl }
    saveMapData(map)
  }
}

async function saveMapData(map) {
  try {
    await window.db.saveMap(map)
    maps.push(map)
    loadMaps()
    alert("Mapa agregado")
  } catch (error) {
    console.error("[v0] Error saving map:", error)
    alert("Error al guardar el mapa")
  }
}

function loadMaps() {
  const container = document.getElementById("mapsList")
  if (!container) return
  container.innerHTML = maps
    .map(
      (map) => `
        <div class="admin-item">
            <div class="admin-item-info">
                <h4>${map.name}</h4>
            </div>
            <div class="admin-item-actions">
                <button class="btn-delete" onclick="deleteMap('${map.id}')">Eliminar</button>
            </div>
        </div>
    `,
    )
    .join("")

  const mapSelect = document.getElementById("banMap")
  if (mapSelect) {
    mapSelect.innerHTML =
      '<option value="">Seleccionar mapa</option>' +
      maps.map((m) => `<option value="${m.id}">${m.name}</option>`).join("")
  }

  const matchMapSelect = document.getElementById("matchMap")
  if (matchMapSelect) {
    matchMapSelect.innerHTML =
      '<option value="">Seleccionar mapa</option>' +
      maps.map((m) => `<option value="${m.id}">${m.name}</option>`).join("")
  }

  loadMapBans()
}

async function deleteMap(id) {
  if (!confirm("¿Eliminar este mapa?")) return

  try {
    await window.db.deleteMap(id)
    maps = maps.filter((m) => m.id !== id)
    loadMaps()
  } catch (error) {
    console.error("[v0] Error deleting map:", error)
    alert("Error al eliminar el mapa")
  }
}

async function saveMapBan() {
  const teamId = document.getElementById("banTeam").value
  const mapId = document.getElementById("banMap").value

  if (!teamId || !mapId) {
    alert("Selecciona un equipo (líder) y un mapa para banear")
    return
  }

  const team = registeredTeams.find((t) => t.id === teamId)
  const hasLeader = team && team.players && team.players.some((p) => p.role === "leader")

  if (!hasLeader) {
    alert("El equipo debe tener un líder para registrar baneos")
    return
  }

  const ban = { id: Date.now().toString(), teamId, mapId, timestamp: new Date().toISOString() }

  try {
    await window.db.saveMapBan(ban)
    mapBans.push(ban)
    loadMapBans()
    const form = document.getElementById("mapBanForm")
    if (form) form.reset()
    alert(`Baneo registrado: ${team.name} ha baneado un mapa`)
  } catch (error) {
    console.error("[v0] Error saving map ban:", error)
    alert("Error al guardar el baneo")
  }
}

function loadMapBans() {
  const container = document.getElementById("mapBansList")
  if (!container) return

  if (!mapBans || mapBans.length === 0) {
    container.innerHTML = '<p class="empty-state">Sin baneos registrados</p>'
    return
  }

  container.innerHTML = mapBans
    .map((ban) => {
      const team = registeredTeams.find((t) => t.id === ban.teamId)
      const map = maps.find((m) => m.id === ban.mapId)
      return `
        <div class="admin-item ban-item">
          <div class="admin-item-info">
            <h4>${team ? team.name : "Equipo Desconocido"}</h4>
            <p>Mapa Baneado: <strong>${map ? map.name : "Desconocido"}</strong></p>
            <p class="ban-timestamp">${ban.timestamp ? new Date(ban.timestamp).toLocaleString("es-ES") : ""}</p>
          </div>
          <div class="admin-item-actions">
            <button class="btn-delete" onclick="deleteMapBan('${ban.id}')">Eliminar</button>
          </div>
        </div>
      `
    })
    .join("")
}

async function deleteMapBan(id) {
  if (!confirm("¿Eliminar este baneo?")) return

  try {
    await window.db.deleteMapBan(id)
    mapBans = mapBans.filter((b) => b.id !== id)
    loadMapBans()
  } catch (error) {
    console.error("[v0] Error deleting map ban:", error)
    alert("Error al eliminar el baneo")
  }
}

function updateTeamSelects() {
  const selects = ["playerTeam", "statsTeam", "matchTeam1", "matchTeam2", "banTeam"]
  selects.forEach((selectId) => {
    const select = document.getElementById(selectId)
    if (!select) return
    select.innerHTML =
      '<option value="">Seleccionar equipo</option>' +
      teams.map((t) => `<option value="${t.id}">${t.name}</option>`).join("")
  })

  const statsTeamSelect = document.getElementById("statsTeam")
  if (statsTeamSelect) {
    const newSelect = statsTeamSelect.cloneNode(true)
    statsTeamSelect.parentNode.replaceChild(newSelect, statsTeamSelect)
    newSelect.addEventListener("change", function () {
      const teamId = this.value
      const statsPlayerSelect = document.getElementById("statsPlayer")
      if (!teamId) {
        if (statsPlayerSelect) statsPlayerSelect.innerHTML = '<option value="">Primero selecciona un equipo</option>'
        return
      }
      const teamPlayers = players.filter((p) => p.teamId === teamId)
      if (statsPlayerSelect) {
        statsPlayerSelect.innerHTML =
          '<option value="">Seleccionar jugador</option>' +
          teamPlayers.map((p) => `<option value="${p.id}">${p.name} (${p.role})</option>`).join("")
      }
    })
  }
}

function updateMatchTeamSelects() {
  const matchTeam1 = document.getElementById("matchTeam1")
  const matchTeam2 = document.getElementById("matchTeam2")

  const teamOptions = registeredTeams
    .map((t) => `<option value="${t.id}">${t.name} (${t.abbreviation})</option>`)
    .join("")

  if (matchTeam1) {
    matchTeam1.innerHTML = '<option value="">Equipo 1</option>' + teamOptions
  }
  if (matchTeam2) {
    matchTeam2.innerHTML = '<option value="">Equipo 2</option>' + teamOptions
  }
}

function updateBanTeamSelect() {
  const banTeam = document.getElementById("banTeam")
  if (!banTeam) return

  banTeam.innerHTML =
    '<option value="">Seleccionar equipo (Líder)</option>' +
    registeredTeams
      .map((t) => {
        const leader = t.players && t.players.find((p) => p.role === "leader")
        const leaderName = leader ? ` - ${leader.name}` : ""
        return `<option value="${t.id}">${t.name} (${t.abbreviation})${leaderName}</option>`
      })
      .join("")
}

function initEditTeamsSection() {
  const editTeamSelect = document.getElementById("editTeamSelect")
  const editTeamGroupForm = document.getElementById("editTeamGroupForm")
  const editPlayerForm = document.getElementById("editPlayerForm")
  const editPlayerSelect = document.getElementById("editPlayerSelect")

  if (editTeamSelect) {
    editTeamSelect.addEventListener("change", function () {
      loadTeamForEditing(this.value)
    })
    updateEditTeamSelect()
  }

  if (editTeamGroupForm) {
    editTeamGroupForm.addEventListener("submit", (e) => {
      e.preventDefault()
      updateTeamGroup()
    })
  }

  if (editPlayerSelect) {
    editPlayerSelect.addEventListener("change", function () {
      loadPlayerForEditing(this.value)
    })
  }

  if (editPlayerForm) {
    editPlayerForm.addEventListener("submit", (e) => {
      e.preventDefault()
      updatePlayerData()
    })
  }
}

function updateEditTeamSelect() {
  const select = document.getElementById("editTeamSelect")
  if (!select) return
  select.innerHTML =
    '<option value="">Seleccionar equipo</option>' +
    registeredTeams
      .map((t) => `<option value="${t.id}">${t.name} (${t.abbreviation}) - Grupo ${t.group})</option>`)
      .join("")
}

function loadTeamForEditing(teamId) {
  const team = registeredTeams.find((t) => t.id === teamId)
  if (!team) return

  const editTeamGroup = document.getElementById("editTeamGroup")
  const editTeamPoints = document.getElementById("editTeamPoints")
  const editTeamPlayersList = document.getElementById("editTeamPlayersList")
  const editPlayerSelect = document.getElementById("editPlayerSelect")

  if (editTeamGroup) {
    editTeamGroup.value = team.group || "A"
  }

  if (editTeamPoints) {
    editTeamPoints.value = team.points || 0
  }

  if (editPlayerSelect) {
    editPlayerSelect.innerHTML =
      '<option value="">Seleccionar jugador</option>' +
      (team.players || [])
        .map((p, idx) => `<option value="${idx}">${p.name} (${p.role}) - UID: ${p.uid}</option>`)
        .join("")
  }

  if (editTeamPlayersList) {
    editTeamPlayersList.innerHTML = `
      <h4>Jugadores del ${team.name}</h4>
      <div class="players-list-compact">
        ${(team.players || [])
          .map(
            (p, idx) => `
          <div class="player-list-compact-item">
            <div class="player-compact-info">
              <strong>${p.name}</strong>
              <p>Rol: ${p.role} | UID: ${p.uid}</p>
              <p>País: ${p.country} | Tel: ${p.countryCode || ""} ${p.phone || ""}</p>
            </div>
          </div>
        `,
          )
          .join("")}
      </div>
    `
  }

  document.getElementById("editPlayerTeamId").value = teamId
}

function loadPlayerForEditing(playerIndex) {
  const teamId = document.getElementById("editPlayerTeamId").value
  const team = registeredTeams.find((t) => t.id === teamId)
  if (!team || !team.players || !team.players[playerIndex]) return

  const player = team.players[playerIndex]

  document.getElementById("editPlayerName").value = player.name || ""
  document.getElementById("editPlayerUID").value = player.uid || ""
  document.getElementById("editPlayerCountry").value = player.country || ""
  document.getElementById("editPlayerCountryCode").value = player.countryCode || ""
  document.getElementById("editPlayerPhone").value = player.phone || ""
  document.getElementById("editPlayerIndex").value = playerIndex
}

async function updateTeamGroup() {
  const teamId = document.getElementById("editTeamSelect").value
  const newGroup = document.getElementById("editTeamGroup").value
  const newPoints = Number.parseInt(document.getElementById("editTeamPoints").value) || 0

  if (!teamId) {
    alert("Selecciona un equipo primero")
    return
  }

  const teamIndex = registeredTeams.findIndex((t) => t.id === teamId)
  if (teamIndex === -1) {
    alert("Equipo no encontrado")
    return
  }

  registeredTeams[teamIndex].group = newGroup
  registeredTeams[teamIndex].points = newPoints

  try {
    await window.db.saveTeam(registeredTeams[teamIndex])
    renderRegisteredTeams()
    alert(`Grupo actualizado a ${newGroup} con ${newPoints} puntos`)
  } catch (error) {
    console.error("[v0] Error updating team:", error)
    alert("Error al actualizar el equipo")
  }
}

async function updatePlayerData() {
  const teamId = document.getElementById("editPlayerTeamId").value
  const playerIndex = Number.parseInt(document.getElementById("editPlayerIndex").value)

  const name = document.getElementById("editPlayerName").value
  const uid = document.getElementById("editPlayerUID").value
  const country = document.getElementById("editPlayerCountry").value
  const countryCode = document.getElementById("editPlayerCountryCode").value
  const phone = document.getElementById("editPlayerPhone").value

  if (!/^\d{20}$/.test(uid)) {
    alert("La UID debe tener exactamente 20 dígitos")
    return
  }

  if (!name || !uid) {
    alert("El nombre y UID son requeridos")
    return
  }

  const team = registeredTeams.find((t) => t.id === teamId)
  if (!team || !team.players || !team.players[playerIndex]) {
    alert("Jugador no encontrado")
    return
  }

  team.players[playerIndex].name = name
  team.players[playerIndex].uid = uid
  team.players[playerIndex].country = country
  team.players[playerIndex].countryCode = countryCode
  team.players[playerIndex].phone = phone

  try {
    await window.db.savePlayer({
      id: team.players[playerIndex].id,
      teamId: teamId,
      name: name,
      uid: uid,
      country: country,
      countryCode: countryCode,
      phone: phone,
      role: team.players[playerIndex].role,
      stats: team.players[playerIndex].stats,
    })

    loadTeamForEditing(teamId)
    alert(`Jugador ${name} actualizado correctamente`)
  } catch (error) {
    console.error("[v0] Error updating player:", error)
    alert("Error al actualizar el jugador")
  }
}

async function deleteRegisteredTeam(teamId) {
  if (!confirm("¿Estás seguro de que deseas eliminar este equipo?")) return

  try {
    await window.db.deleteTeam(teamId)
    registeredTeams = registeredTeams.filter((t) => t.id !== teamId)
    renderRegisteredTeams()
  } catch (error) {
    console.error("[v0] Error deleting team:", error)
    alert("Error al eliminar el equipo")
  }
}

function exportTeamToExcel(teamId) {
  const team = registeredTeams.find((t) => t.id === teamId)
  if (!team) {
    alert("Equipo no encontrado")
    return
  }

  if (window.XLSX && window.XLSX.utils) {
    exportTeamToXLSX(team)
    return
  }

  exportTeamToCSV(team)
}

function exportTeamToXLSX(team) {
  const workbook = window.XLSX.utils.book_new()

  const teamInfoData = [
    ["INFORMACIÓN DEL EQUIPO"],
    [],
    ["Nombre", team.name || ""],
    ["Abreviación", team.abbreviation || ""],
    ["Grupo", team.group || ""],
    ["Fecha de Registro", team.createdAt ? new Date(team.createdAt).toLocaleDateString("es-ES") : ""],
    ["Total de Jugadores", team.players ? team.players.length : 0],
  ]
  const teamSheet = window.XLSX.utils.aoa_to_sheet(teamInfoData)
  window.XLSX.utils.book_append_sheet(workbook, teamSheet, "Información")

  const playersData = [
    ["Nombre", "UID", "País", "Teléfono", "Rol", "Bajas", "Asistencias", "Revividas", "Daño a Vehículos"],
  ]
  ;(team.players || []).forEach((player) => {
    playersData.push([
      player.name || "",
      player.uid || "",
      player.country || "",
      player.phone || "",
      player.role || "",
      (player.stats && player.stats.kills) || 0,
      (player.stats && player.stats.assists) || 0,
      (player.stats && player.stats.revives) || 0,
      (player.stats && player.stats.vehicleDamage) || 0,
    ])
  })

  const playersSheet = window.XLSX.utils.aoa_to_sheet(playersData)
  playersSheet["!cols"] = [
    { wch: 20 },
    { wch: 25 },
    { wch: 15 },
    { wch: 15 },
    { wch: 12 },
    { wch: 10 },
    { wch: 12 },
    { wch: 12 },
    { wch: 15 },
  ]
  window.XLSX.utils.book_append_sheet(workbook, playersSheet, "Jugadores")

  window.XLSX.writeFile(workbook, `${team.name || "Equipo"}_Roster.xlsx`)
}

function exportTeamToCSV(team) {
  let csv = "INFORMACIÓN DEL EQUIPO\n\n"
  csv += `Nombre,${team.name || ""}\n`
  csv += `Abreviación,${team.abbreviation || ""}\n`
  csv += `Grupo,${team.group || ""}\n`
  csv += `Fecha de Registro,"${team.createdAt ? new Date(team.createdAt).toLocaleDateString("es-ES") : ""}"\n`
  csv += `Total de Jugadores,${team.players ? team.players.length : 0}\n\n`

  csv += "JUGADORES\n"
  csv += "Nombre,UID,País,Teléfono,Rol,Bajas,Asistencias,Revividas,Daño a Vehículos\n"
  ;(team.players || []).forEach((player) => {
    csv += `"${player.name || ""}","${player.uid || ""}","${player.country || ""}","${player.phone || ""}","${player.role || ""}",${(player.stats && player.stats.kills) || 0},${(player.stats && player.stats.assists) || 0},${(player.stats && player.stats.revives) || 0},${(player.stats && player.stats.vehicleDamage) || 0}\n`
  })

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", `${team.name || "Equipo"}_Roster.csv`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function exportAllTeamsToExcel() {
  if (!registeredTeams || registeredTeams.length === 0) {
    alert("No hay equipos para exportar")
    return
  }

  if (window.XLSX && window.XLSX.utils) {
    exportAllTeamsToXLSX()
    return
  }

  exportAllTeamsToCSV()
}

function exportAllTeamsToXLSX() {
  const workbook = window.XLSX.utils.book_new()

  const summaryData = [
    ["RESUMEN DE EQUIPOS REGISTRADOS"],
    [],
    ["Total de Equipos", registeredTeams.length],
    ["Total de Jugadores", registeredTeams.reduce((sum, t) => sum + (t.players ? t.players.length : 0), 0)],
    [],
    ["Nombre", "Abreviación", "Grupo", "Jugadores", "Fecha Registro"],
  ]

  registeredTeams.forEach((team) => {
    summaryData.push([
      team.name || "",
      team.abbreviation || "",
      team.group || "",
      team.players ? team.players.length : 0,
      team.createdAt ? new Date(team.createdAt).toLocaleDateString("es-ES") : "",
    ])
  })

  const summarySheet = window.XLSX.utils.aoa_to_sheet(summaryData)
  summarySheet["!cols"] = [{ wch: 20 }, { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 15 }]
  window.XLSX.utils.book_append_sheet(workbook, summarySheet, "Resumen")

  registeredTeams.forEach((team) => {
    const teamData = [
      [`EQUIPO: ${team.name || ""}`],
      [`Abreviación: ${team.abbreviation || ""}`],
      [`Grupo: ${team.group || ""}`],
      [],
      ["Nombre", "UID", "País", "Teléfono", "Rol", "Bajas", "Asistencias", "Revividas", "Daño a Vehículos"],
    ]
    ;(team.players || []).forEach((player) => {
      teamData.push([
        player.name || "",
        player.uid || "",
        player.country || "",
        player.phone || "",
        player.role || "",
        (player.stats && player.stats.kills) || 0,
        (player.stats && player.stats.assists) || 0,
        (player.stats && player.stats.revives) || 0,
        (player.stats && player.stats.vehicleDamage) || 0,
      ])
    })
    const sheet = window.XLSX.utils.aoa_to_sheet(teamData)
    window.XLSX.utils.book_append_sheet(workbook, sheet, team.abbreviation || team.name || `Equipo_${team.id}`)
  })

  window.XLSX.writeFile(workbook, `Todos_los_Equipos_${new Date().toISOString().split("T")[0]}.xlsx`)
}

function exportAllTeamsToCSV() {
  let csv = "RESUMEN DE EQUIPOS REGISTRADOS\n\n"
  csv += `Total de Equipos,${registeredTeams.length}\n`
  csv += `Total de Jugadores,${registeredTeams.reduce((sum, t) => sum + (t.players ? t.players.length : 0), 0)}\n\n`
  csv += "EQUIPOS\n"
  csv += "Nombre,Abreviación,Grupo,Cantidad de Jugadores,Fecha Registro\n"

  registeredTeams.forEach((team) => {
    csv += `"${team.name || ""}","${team.abbreviation || ""}","${team.group || ""}",${team.players ? team.players.length : 0},"${team.createdAt ? new Date(team.createdAt).toLocaleDateString("es-ES") : ""}"\n`
  })

  csv += "\n\nDETALLE POR EQUIPO\n\n"

  registeredTeams.forEach((team) => {
    csv += `\n--- EQUIPO: ${team.name || ""} ---\n`
    csv += `Abreviación: ${team.abbreviation || ""}\n`
    csv += `Grupo: ${team.group || ""}\n\n`
    csv += "Nombre,UID,País,Teléfono,Rol,Bajas,Asistencias,Revividas,Daño a Vehículos\n"
    ;(team.players || []).forEach((player) => {
      csv += `"${player.name || ""}","${player.uid || ""}","${player.country || ""}","${player.phone || ""}","${player.role || ""}",${(player.stats && player.stats.kills) || 0},${(player.stats && player.stats.assists) || 0},${(player.stats && player.stats.revives) || 0},${(player.stats && player.stats.vehicleDamage) || 0}\n`
    })
  })

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", `Todos_los_Equipos_${new Date().toISOString().split("T")[0]}.csv`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
