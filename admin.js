const adminData = {
  registeredTeams: [],
  teams: [],
  players: [],
  matches: [],
  maps: [],
  mapBans: [],
  heroStats: { teams: 0, players: 0, matches: 0 },
  tournamentState: { quarterfinals: [], semifinals: [], final: [], champion: null },
}

const syncChannel = new BroadcastChannel("tournament-admin-sync")

document.addEventListener("DOMContentLoaded", () => {
  console.log("[v0] Admin dashboard initializing")
  initNavigation()
  initTabs()
  loadAllData()
  subscribeToRealtime()
})

function initNavigation() {
  const hamburger = document.querySelector(".hamburger")
  const navMenu = document.querySelector(".nav-menu")
  const navLinks = document.querySelectorAll(".nav-link")

  if (hamburger) {
    hamburger.addEventListener("click", () => {
      navMenu.classList.toggle("active")
    })
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("active")
    })
  })
}

function initTabs() {
  const tabButtons = document.querySelectorAll(".tab-btn")
  const tabContents = document.querySelectorAll(".tab-content")

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tabName = button.getAttribute("data-tab")

      tabButtons.forEach((btn) => btn.classList.remove("active"))
      tabContents.forEach((content) => content.classList.remove("active"))

      button.classList.add("active")
      const activeTab = document.querySelector(`[data-tab-content="${tabName}"]`)
      if (activeTab) {
        activeTab.classList.add("active")
      }
    })
  })
}

async function loadAllData() {
  try {
    adminData.registeredTeams = (await window.supabase.fetchRegisteredTeams()) || []
    adminData.teams = (await window.supabase.fetchTeams()) || []
    adminData.players = (await window.supabase.fetchPlayers()) || []
    adminData.matches = (await window.supabase.fetchMatches()) || []
    adminData.maps = (await window.supabase.fetchMaps()) || []
    adminData.mapBans = (await window.supabase.fetchMapBans()) || []

    const statsData = await window.supabase.fetchHeroStats()
    adminData.heroStats = statsData || { teams: 0, players: 0, matches: 0 }

    const stateData = await window.supabase.fetchTournamentState()
    adminData.tournamentState = stateData || {
      quarterfinals: [],
      semifinals: [],
      final: [],
      champion: null,
    }

    console.log("[v0] Admin data loaded:", {
      registeredTeams: adminData.registeredTeams.length,
      teams: adminData.teams.length,
      players: adminData.players.length,
      matches: adminData.matches.length,
    })

    updateDashboard()
  } catch (error) {
    console.error("[v0] Error loading data:", error)
  }
}

function updateDashboard() {
  updateStatistics()
  displayRegisteredTeams()
  displayTeams()
  displayPlayers()
  displayMatches()
  displayMaps()
  populateSelects()
}

function updateStatistics() {
  const stats = {
    totalRegistered: adminData.registeredTeams.length,
    totalTeams: adminData.teams.length,
    totalPlayers: adminData.players.length,
    totalMatches: adminData.matches.length,
  }

  const statElements = {
    registeredTeamsCount: stats.totalRegistered,
    teamsCount: stats.totalTeams,
    playersCount: stats.totalPlayers,
    matchesCount: stats.totalMatches,
  }

  Object.entries(statElements).forEach(([id, value]) => {
    const el = document.getElementById(id)
    if (el) el.textContent = value
  })
}

function displayRegisteredTeams() {
  const container = document.getElementById("registeredTeamsList")
  if (!container) return

  container.innerHTML = ""

  if (adminData.registeredTeams.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: var(--text-muted);">No hay equipos registrados</p>'
    return
  }

  adminData.registeredTeams.forEach((team) => {
    const playerCount = team.players ? team.players.length : 0
    const teamDiv = document.createElement("div")
    teamDiv.className = "admin-team-card"
    teamDiv.innerHTML = `
      <div class="admin-team-header">
        <div class="admin-team-info">
          <h3>${team.name}</h3>
          <p class="team-abbr">${team.abbreviation}</p>
        </div>
        <span class="team-group">Grupo ${team.group || "N/A"}</span>
      </div>
      <div class="admin-team-details">
        <span>${playerCount} Jugadores</span>
        <span>${team.points || 0} Puntos</span>
      </div>
      <div class="admin-team-actions">
        <button onclick="approveTeam('${team.id}')" class="btn-approve">Aprobar</button>
        <button onclick="rejectTeam('${team.id}')" class="btn-reject">Rechazar</button>
        <button onclick="viewTeamDetails('${team.id}')" class="btn-view">Ver</button>
      </div>
    `
    container.appendChild(teamDiv)
  })
}

function displayTeams() {
  const container = document.getElementById("teamsList")
  if (!container) return

  container.innerHTML = ""

  if (adminData.teams.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: var(--text-muted);">No hay equipos</p>'
    return
  }

  adminData.teams.forEach((team) => {
    const playerCount = adminData.players.filter((p) => p.team_id === team.id).length
    const teamDiv = document.createElement("div")
    teamDiv.className = "admin-team-card"
    teamDiv.innerHTML = `
      <div class="admin-team-header">
        <div class="admin-team-info">
          <h3>${team.team_name}</h3>
          <p class="team-abbr">${team.abbreviation}</p>
        </div>
        <span class="team-group">Grupo ${team.group_letter || "N/A"}</span>
      </div>
      <div class="admin-team-details">
        <span>${playerCount} Jugadores</span>
        <span>${team.points || 0} Puntos</span>
      </div>
      <div class="admin-team-actions">
        <button onclick="editTeam('${team.id}')" class="btn-edit">Editar</button>
        <button onclick="deleteTeamConfirm('${team.id}')" class="btn-delete">Eliminar</button>
      </div>
    `
    container.appendChild(teamDiv)
  })
}

function displayPlayers() {
  const container = document.getElementById("playersList")
  if (!container) return

  container.innerHTML = ""

  if (adminData.players.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: var(--text-muted);">No hay jugadores</p>'
    return
  }

  const playersTable = document.createElement("table")
  playersTable.className = "players-table"
  playersTable.innerHTML = `
    <thead>
      <tr>
        <th>Nombre</th>
        <th>UID</th>
        <th>Equipo</th>
        <th>Rol</th>
        <th>Acciones</th>
      </tr>
    </thead>
    <tbody>
      ${adminData.players
        .map((player) => {
          const team = adminData.teams.find((t) => t.id === player.team_id)
          return `
        <tr>
          <td>${player.player_name}</td>
          <td>${player.uid}</td>
          <td>${team?.team_name || "N/A"}</td>
          <td>${player.role || "Miembro"}</td>
          <td>
            <button onclick="deletePlayerConfirm('${player.id}')" class="btn-delete-small">Eliminar</button>
          </td>
        </tr>
      `
        })
        .join("")}
    </tbody>
  `
  container.appendChild(playersTable)
}

function displayMatches() {
  const container = document.getElementById("matchesList")
  if (!container) return

  container.innerHTML = ""

  if (adminData.matches.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: var(--text-muted);">No hay partidas</p>'
    return
  }

  adminData.matches.forEach((match) => {
    const team1 = adminData.teams.find((t) => t.id === match.team1_id)
    const team2 = adminData.teams.find((t) => t.id === match.team2_id)
    const winner = adminData.teams.find((t) => t.id === match.winner_id)

    const matchDiv = document.createElement("div")
    matchDiv.className = "admin-match-card"
    matchDiv.innerHTML = `
      <div class="match-info">
        <span>${team1?.abbreviation || "TBD"} vs ${team2?.abbreviation || "TBD"}</span>
        <span>${match.phase || "Grupos"}</span>
      </div>
      <div class="match-winner">${winner ? `Ganador: ${winner.abbreviation}` : "Pendiente"}</div>
      <div class="match-actions">
        <button onclick="editMatch('${match.id}')" class="btn-edit">Editar</button>
        <button onclick="deleteMatchConfirm('${match.id}')" class="btn-delete">Eliminar</button>
      </div>
    `
    container.appendChild(matchDiv)
  })
}

function displayMaps() {
  const container = document.getElementById("mapsList")
  if (!container) return

  container.innerHTML = ""

  if (adminData.maps.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: var(--text-muted);">No hay mapas</p>'
    return
  }

  adminData.maps.forEach((map) => {
    const mapDiv = document.createElement("div")
    mapDiv.className = "admin-map-card"
    mapDiv.innerHTML = `
      <div class="map-name">${map.map_name}</div>
      <div class="map-actions">
        <button onclick="deleteMapConfirm('${map.id}')" class="btn-delete">Eliminar</button>
      </div>
    `
    container.appendChild(mapDiv)
  })
}

function populateSelects() {
  const teamSelects = document.querySelectorAll("[data-role='team-select']")

  teamSelects.forEach((select) => {
    select.innerHTML = '<option value="">Seleccionar equipo</option>'
    adminData.teams.forEach((team) => {
      const option = document.createElement("option")
      option.value = team.id
      option.textContent = team.team_name
      select.appendChild(option)
    })
  })
}

window.editTeam = async (teamId) => {
  const team = adminData.teams.find((t) => t.id === teamId)
  if (!team) return

  const groupInput = prompt("Ingresa el grupo (A-D):", team.group_letter || "")
  const pointsInput = prompt("Ingresa los puntos:", team.points || "0")

  if (groupInput === null || pointsInput === null) return

  try {
    await window.supabase.updateTeam(teamId, {
      group_letter: groupInput.toUpperCase(),
      points: Number.parseInt(pointsInput) || 0,
    })

    console.log("[v0] Team updated")
    syncChannel.postMessage({ type: "refresh" })
    await loadAllData()
  } catch (error) {
    console.error("[v0] Error updating team:", error)
    alert("Error al actualizar el equipo")
  }
}

window.deleteTeamConfirm = (teamId) => {
  if (confirm("¿Estás seguro de que deseas eliminar este equipo?")) {
    deleteTeamAction(teamId)
  }
}

async function deleteTeamAction(teamId) {
  try {
    await window.supabase.deleteTeam(teamId)
    console.log("[v0] Team deleted")
    syncChannel.postMessage({ type: "refresh" })
    await loadAllData()
  } catch (error) {
    console.error("[v0] Error deleting team:", error)
    alert("Error al eliminar el equipo")
  }
}

window.deletePlayerConfirm = (playerId) => {
  if (confirm("¿Estás seguro de que deseas eliminar este jugador?")) {
    deletePlayerAction(playerId)
  }
}

async function deletePlayerAction(playerId) {
  try {
    await window.supabase.deletePlayer(playerId)
    console.log("[v0] Player deleted")
    await loadAllData()
  } catch (error) {
    console.error("[v0] Error deleting player:", error)
    alert("Error al eliminar el jugador")
  }
}

window.editMatch = async (matchId) => {
  const match = adminData.matches.find((m) => m.id === matchId)
  if (!match) return

  const team1 = adminData.teams.find((t) => t.id === match.team1_id)
  const team2 = adminData.teams.find((t) => t.id === match.team2_id)

  alert(`Partida: ${team1?.abbreviation || "TBD"} vs ${team2?.abbreviation || "TBD"}`)
}

window.deleteMatchConfirm = (matchId) => {
  if (confirm("¿Estás seguro de que deseas eliminar esta partida?")) {
    deleteMatchAction(matchId)
  }
}

async function deleteMatchAction(matchId) {
  try {
    await window.supabase.deleteMatch(matchId)
    console.log("[v0] Match deleted")
    await loadAllData()
  } catch (error) {
    console.error("[v0] Error deleting match:", error)
    alert("Error al eliminar la partida")
  }
}

window.deleteMapConfirm = (mapId) => {
  if (confirm("¿Estás seguro de que deseas eliminar este mapa?")) {
    deleteMapAction(mapId)
  }
}

async function deleteMapAction(mapId) {
  try {
    await window.supabase.deleteMap(mapId)
    console.log("[v0] Map deleted")
    await loadAllData()
  } catch (error) {
    console.error("[v0] Error deleting map:", error)
    alert("Error al eliminar el mapa")
  }
}

window.approveTeam = async (teamId) => {
  try {
    const team = adminData.registeredTeams.find((t) => t.id === teamId)
    if (!team) return

    await window.supabase.updateRegisteredTeam(teamId, {
      status: "approved",
    })

    console.log("[v0] Team approved")
    syncChannel.postMessage({ type: "refresh" })
    await loadAllData()
  } catch (error) {
    console.error("[v0] Error approving team:", error)
  }
}

window.rejectTeam = async (teamId) => {
  try {
    await window.supabase.deleteRegisteredTeam(teamId)
    console.log("[v0] Team rejected")
    syncChannel.postMessage({ type: "refresh" })
    await loadAllData()
  } catch (error) {
    console.error("[v0] Error rejecting team:", error)
  }
}

window.viewTeamDetails = (teamId) => {
  const team = adminData.registeredTeams.find((t) => t.id === teamId)
  if (!team) return

  const players = team.players || []
  let detailsHtml = `<strong>${team.name}</strong><br>`
  detailsHtml += `Abreviación: ${team.abbreviation}<br>`
  detailsHtml += `Grupo: ${team.group}<br>`
  detailsHtml += `Jugadores: ${players.length}<br><br>`
  detailsHtml += `<strong>Jugadores:</strong><br>`

  players.forEach((p) => {
    detailsHtml += `- ${p.name} (${p.uid}) - ${p.role}<br>`
  })

  alert(detailsHtml)
}

function subscribeToRealtime() {
  console.log("[v0] Setting up real-time subscriptions")

  window.supabase.subscribeToChanges("registered_teams", () => {
    console.log("[v0] Registered teams changed")
    loadAllData()
  })

  window.supabase.subscribeToChanges("teams", () => {
    console.log("[v0] Teams changed")
    loadAllData()
  })

  window.supabase.subscribeToChanges("players", () => {
    console.log("[v0] Players changed")
    loadAllData()
  })

  window.supabase.subscribeToChanges("matches", () => {
    console.log("[v0] Matches changed")
    loadAllData()
  })

  window.supabase.subscribeToChanges("maps", () => {
    console.log("[v0] Maps changed")
    loadAllData()
  })

  syncChannel.onmessage = (event) => {
    if (event.data.type === "refresh") {
      console.log("[v0] Refresh signal received")
      loadAllData()
    }
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Inicializar al cargar
window.addEventListener("load", () => {
  console.log("[v0] Admin panel ready")
})
