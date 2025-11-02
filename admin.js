let registeredTeams = []
const teams = []
const players = []
let matches = []
let maps = []
let mapBans = []
let heroStats = { teams: 16, players: 80, matches: 15 }
let tournamentState = { quarterfinals: [], semifinals: [], final: [], champion: null }

const XLSX = window.XLSX || null

document.addEventListener("DOMContentLoaded", async () => {
  console.log("[v0] Admin dashboard initializing")

  if (sessionStorage.getItem("nvyAdminAuth") !== "true") {
    window.location.href = "login.html"
    return
  }

  // Setup logout
  const logoutBtn = document.getElementById("logoutBtn")
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault()
      sessionStorage.removeItem("nvyAdminAuth")
      window.location.href = "login.html"
    })
  }

  // Load all data from Supabase
  await loadAllData()
  initAdminNavigation()
  initAllForms()
  setupRealtimeSync()
})

async function loadAllData() {
  try {
    console.log("[v0] Loading data from Supabase")
    registeredTeams = await window.SupabaseClient.getRegisteredTeams()
    heroStats = await window.SupabaseClient.getHeroStats()
    matches = await window.SupabaseClient.getTournamentMatches()
    maps = await window.SupabaseClient.getMaps()
    mapBans = await window.SupabaseClient.getMapBans()
    tournamentState = await window.SupabaseClient.getTournamentState()

    console.log("[v0] Data loaded successfully:", { registeredTeams: registeredTeams.length, matches: matches.length })
  } catch (error) {
    console.error("[v0] Error loading data:", error)
  }
}

function initAdminNavigation() {
  const navLinks = document.querySelectorAll(".admin-nav-link")
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault()
      navLinks.forEach((l) => l.classList.remove("active"))
      link.classList.add("active")

      const sectionId = link.dataset.section
      document.querySelectorAll(".admin-section").forEach((section) => {
        section.classList.remove("active")
      })

      const target = document.getElementById(sectionId)
      if (target) target.classList.add("active")
      loadAdminSection(sectionId)
    })
  })

  // Click first link to show hero-stats by default
  const firstLink = document.querySelector(".admin-nav-link")
  if (firstLink) firstLink.click()
}

function loadAdminSection(sectionName) {
  console.log("[v0] Loading section:", sectionName)

  if (sectionName === "hero-stats") {
    loadHeroStatsForm()
  } else if (sectionName === "registered-teams") {
    renderRegisteredTeams()
  } else if (sectionName === "teams") {
    renderTeams()
  } else if (sectionName === "players") {
    renderPlayers()
  } else if (sectionName === "player-stats") {
    loadPlayerStatsSection()
  } else if (sectionName === "matches") {
    renderMatches()
    updateMatchTeamSelects()
  } else if (sectionName === "maps") {
    renderMaps()
    updateBanTeamSelect()
  } else if (sectionName === "edit-teams") {
    initEditTeamsSection()
  }
}

// ========== HERO STATS ==========
function loadHeroStatsForm() {
  const teamsEl = document.getElementById("heroTeams")
  const playersEl = document.getElementById("heroPlayers")
  const matchesEl = document.getElementById("heroMatches")

  if (teamsEl) teamsEl.value = heroStats.teams || 0
  if (playersEl) playersEl.value = heroStats.players || 0
  if (matchesEl) matchesEl.value = heroStats.matches || 0
}

// ========== REGISTERED TEAMS ==========
function renderRegisteredTeams() {
  const container = document.getElementById("registeredTeamsList")
  if (!container) return

  if (registeredTeams.length === 0) {
    container.innerHTML =
      '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">No hay equipos registrados</p>'
    return
  }

  container.innerHTML = registeredTeams
    .map((team) => {
      const playerCount = team.players ? team.players.length : 0
      return `
      <div class="registered-team-card">
        <div class="team-card-header">
          <div class="team-card-logo-section">
            <img src="${team.logo || ""}" alt="${team.name}" class="team-card-logo" onerror="this.style.display='none'">
            <div class="team-card-info">
              <h3>${team.name}</h3>
              <p class="team-abbreviation">${team.abbreviation || ""} | Grupo ${team.group || "N/A"}</p>
              <p class="team-date">Registrado: ${team.created_at ? new Date(team.created_at).toLocaleDateString("es-ES") : ""}</p>
            </div>
          </div>
          <div class="team-card-actions">
            <button class="btn-secondary" onclick="exportTeamToExcel('${team.id}')">Exportar</button>
            <button class="btn-danger" onclick="deleteTeamConfirm('${team.id}')">Eliminar</button>
          </div>
        </div>
        <div class="team-card-details">
          <div class="team-players-info">
            <span class="info-badge">${playerCount} Jugadores</span>
            <span class="info-badge leader-badge">1 Líder</span>
            <span class="info-badge">${team.players ? team.players.filter((p) => p.role === "substitute").length : 0} Suplentes</span>
          </div>
        </div>
      </div>
    `
    })
    .join("")
}

window.deleteTeamConfirm = async (teamId) => {
  if (!confirm("¿Estás seguro de que deseas eliminar este equipo?")) return
  await window.SupabaseClient.deleteRegisteredTeam(teamId)
  registeredTeams = registeredTeams.filter((t) => t.id !== teamId)
  renderRegisteredTeams()
}

window.exportTeamToExcel = (teamId) => {
  const team = registeredTeams.find((t) => t.id === teamId)
  if (!team) return

  if (window.XLSX && window.XLSX.utils) {
    const workbook = window.XLSX.utils.book_new()

    const teamInfoData = [
      ["INFORMACIÓN DEL EQUIPO"],
      [],
      ["Nombre", team.name || ""],
      ["Abreviación", team.abbreviation || ""],
      ["Grupo", team.group || ""],
      ["Total de Jugadores", team.players ? team.players.length : 0],
    ]

    const teamSheet = window.XLSX.utils.aoa_to_sheet(teamInfoData)
    window.XLSX.utils.book_append_sheet(workbook, teamSheet, "Información")

    const playersData = [["Nombre", "UID", "País", "Teléfono", "Rol"]]
    ;(team.players || []).forEach((player) => {
      playersData.push([
        player.name || "",
        player.uid || "",
        player.country || "",
        player.phone || "",
        player.role || "",
      ])
    })

    const playersSheet = window.XLSX.utils.aoa_to_sheet(playersData)
    window.XLSX.utils.book_append_sheet(workbook, playersSheet, "Jugadores")

    window.XLSX.writeFile(workbook, `${team.name || "Equipo"}_Roster.xlsx`)
  } else {
    alert("XLSX library not available")
  }
}

// ========== HERO STATS FORM ==========
function initAllForms() {
  const heroStatsForm = document.getElementById("heroStatsForm")
  if (heroStatsForm) {
    heroStatsForm.addEventListener("submit", async (e) => {
      e.preventDefault()
      heroStats = {
        teams: Number.parseInt(document.getElementById("heroTeams").value) || 0,
        players: Number.parseInt(document.getElementById("heroPlayers").value) || 0,
        matches: Number.parseInt(document.getElementById("heroMatches").value) || 0,
      }
      await window.SupabaseClient.saveHeroStats(heroStats)
      alert("Estadísticas del hero actualizadas")
    })
  }

  const matchForm = document.getElementById("matchForm")
  if (matchForm) {
    matchForm.addEventListener("submit", async (e) => {
      e.preventDefault()
      await handleMatchFormSubmit()
    })
  }

  const mapForm = document.getElementById("mapForm")
  if (mapForm) {
    mapForm.addEventListener("submit", async (e) => {
      e.preventDefault()
      await handleMapFormSubmit()
    })
  }

  const mapBanForm = document.getElementById("mapBanForm")
  if (mapBanForm) {
    mapBanForm.addEventListener("submit", async (e) => {
      e.preventDefault()
      await handleMapBanFormSubmit()
    })
  }

  const editTeamGroupForm = document.getElementById("editTeamGroupForm")
  if (editTeamGroupForm) {
    editTeamGroupForm.addEventListener("submit", async (e) => {
      e.preventDefault()
      await handleEditTeamGroupSubmit()
    })
  }

  const editPlayerForm = document.getElementById("editPlayerForm")
  if (editPlayerForm) {
    editPlayerForm.addEventListener("submit", async (e) => {
      e.preventDefault()
      await handleEditPlayerSubmit()
    })
  }

  const statsForm = document.getElementById("statsForm")
  if (statsForm) {
    statsForm.addEventListener("submit", async (e) => {
      e.preventDefault()
      await updatePlayerStatsFromRegistered()
    })
  }

  initializeSelects()
}

// ========== TEAMS MANAGEMENT ==========
function renderTeams() {
  // Placeholder - teams are managed via registered teams
  const container = document.getElementById("teamsList")
  if (container) {
    container.innerHTML =
      '<p style="text-align: center; color: var(--text-muted);">Los equipos se gestionan desde la sección de Equipos Registrados</p>'
  }
}

// ========== PLAYERS MANAGEMENT ==========
function renderPlayers() {
  const container = document.getElementById("playersList")
  if (container) {
    container.innerHTML =
      '<p style="text-align: center; color: var(--text-muted);">Los jugadores se gestionan desde la sección de Equipos Registrados</p>'
  }
}

// ========== PLAYER STATS ==========
function loadPlayerStatsSection() {
  const statsTeamSelect = document.getElementById("statsTeam")
  if (!statsTeamSelect) return

  statsTeamSelect.innerHTML =
    '<option value="">Seleccionar equipo registrado</option>' +
    registeredTeams.map((team) => `<option value="${team.id}">${team.name} (${team.abbreviation})</option>`).join("")

  statsTeamSelect.addEventListener("change", function () {
    const teamId = this.value
    const statsPlayerSelect = document.getElementById("statsPlayer")
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

  player.stats.kills = (player.stats.kills || 0) + kills
  player.stats.assists = (player.stats.assists || 0) + assists
  player.stats.revives = (player.stats.revives || 0) + revives
  player.stats.vehicleDamage = (player.stats.vehicleDamage || 0) + vehicleDamage

  await window.SupabaseClient.updateRegisteredTeam(teamId, { players: team.players })
  document.getElementById("statsForm").reset()
  alert(
    `Estadísticas actualizadas para ${player.name}!\nBalas: +${kills} | Asistencias: +${assists} | Revividas: +${revives} | Daño: +${vehicleDamage}`,
  )
}

// ========== MATCHES MANAGEMENT ==========
function renderMatches() {
  const container = document.getElementById("matchesList")
  if (!container) return

  if (matches.length === 0) {
    container.innerHTML =
      '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">No hay partidas registradas</p>'
    return
  }

  container.innerHTML = matches
    .map((match) => {
      const team1 = registeredTeams.find((t) => t.id === match.team1)
      const team2 = registeredTeams.find((t) => t.id === match.team2)
      const winner = match.winner ? registeredTeams.find((t) => t.id === match.winner) : null

      return `
      <div class="admin-item">
        <div class="admin-item-info">
          <h4>${team1?.name || "TBD"} vs ${team2?.name || "TBD"}</h4>
          <p>${match.phase} - Ganador: ${winner ? winner.name : "Pendiente"}</p>
        </div>
        <div class="admin-item-actions">
          <button class="btn-delete" onclick="deleteMatchConfirm('${match.id}')">Eliminar</button>
        </div>
      </div>
    `
    })
    .join("")
}

window.deleteMatchConfirm = async (matchId) => {
  if (!confirm("¿Eliminar esta partida?")) return
  await window.SupabaseClient.deleteMatch(matchId)
  matches = matches.filter((m) => m.id !== matchId)
  renderMatches()
}

function updateGameWinners() {
  const team1IdEl = document.getElementById("matchTeam1")
  const team2IdEl = document.getElementById("matchTeam2")
  const team1Id = team1IdEl ? team1IdEl.value : ""
  const team2Id = team2IdEl ? team2IdEl.value : ""

  if (!team1Id || !team2Id) return

  const team1 = registeredTeams.find((t) => t.id === team1Id)
  const team2 = registeredTeams.find((t) => t.id === team2Id)

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

  const team1 = registeredTeams.find((t) => t.id === team1Id)
  const team2 = registeredTeams.find((t) => t.id === team2Id)
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

async function handleMatchFormSubmit() {
  const phase = document.getElementById("matchPhase").value
  const team1 = document.getElementById("matchTeam1").value
  const team2 = document.getElementById("matchTeam2").value

  const gamesData = []
  document.querySelectorAll(".game-map").forEach((mapSelect, index) => {
    const mapId = mapSelect.value
    const winnerSelect = document.querySelectorAll(".game-winner")[index]
    const winnerId = winnerSelect ? winnerSelect.value : ""
    if (mapId && winnerId) {
      gamesData.push({ mapId, winner: winnerId })
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
    games_data: gamesData,
    winner,
    score: `${team1Wins}-${team2Wins}`,
    created_at: new Date().toISOString(),
  }

  await window.SupabaseClient.saveTournamentMatch(match)
  matches.push(match)

  // Update team points for group phase
  if (phase === "groups" && winner) {
    const winnerTeam = registeredTeams.find((t) => t.id === winner)
    if (winnerTeam) {
      winnerTeam.points = (winnerTeam.points || 0) + 1
      await window.SupabaseClient.updateRegisteredTeam(winner, { points: winnerTeam.points })
    }
  }

  document.getElementById("matchForm").reset()
  const seriesWinner = document.getElementById("seriesWinner")
  if (seriesWinner) seriesWinner.textContent = "-"
  renderMatches()
  alert("Partida guardada y puntos actualizados")
}

function updateMatchTeamSelects() {
  const matchTeam1 = document.getElementById("matchTeam1")
  const matchTeam2 = document.getElementById("matchTeam2")

  const teamOptions = registeredTeams
    .map((t) => `<option value="${t.id}">${t.name} (${t.abbreviation})</option>`)
    .join("")

  if (matchTeam1) {
    matchTeam1.innerHTML = '<option value="">Equipo 1</option>' + teamOptions
    matchTeam1.addEventListener("change", updateGameWinners)
  }
  if (matchTeam2) {
    matchTeam2.innerHTML = '<option value="">Equipo 2</option>' + teamOptions
    matchTeam2.addEventListener("change", updateGameWinners)
  }

  document.querySelectorAll(".game-winner").forEach((select) => {
    select.addEventListener("change", calculateSeriesWinner)
  })
}

// ========== MAPS MANAGEMENT ==========
function renderMaps() {
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
        <button class="btn-delete" onclick="deleteMapConfirm('${map.id}')">Eliminar</button>
      </div>
    </div>
  `,
    )
    .join("")

  updateMapSelects()
}

window.deleteMapConfirm = async (mapId) => {
  if (!confirm("¿Eliminar este mapa?")) return
  await window.SupabaseClient.deleteMap(mapId)
  maps = maps.filter((m) => m.id !== mapId)
  renderMaps()
}

function updateMapSelects() {
  const mapSelect = document.getElementById("banMap")
  if (mapSelect) {
    mapSelect.innerHTML =
      '<option value="">Seleccionar mapa</option>' +
      maps.map((m) => `<option value="${m.id}">${m.name}</option>`).join("")
  }

  document.querySelectorAll(".game-map").forEach((select) => {
    select.innerHTML =
      '<option value="">No jugado</option>' + maps.map((m) => `<option value="${m.id}">${m.name}</option>`).join("")
  })
}

async function handleMapFormSubmit() {
  const name = document.getElementById("mapName").value
  const imageFileEl = document.getElementById("mapImageFile")
  const imageFile = imageFileEl ? imageFileEl.files[0] : null
  const imageUrl = document.getElementById("mapImage").value

  if (imageFile) {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const map = { id: Date.now().toString(), name, image: e.target.result, created_at: new Date().toISOString() }
      await window.SupabaseClient.saveMap(map)
      maps.push(map)
      document.getElementById("mapForm").reset()
      renderMaps()
      alert("Mapa agregado")
    }
    reader.readAsDataURL(imageFile)
  } else {
    const map = { id: Date.now().toString(), name, image: imageUrl, created_at: new Date().toISOString() }
    await window.SupabaseClient.saveMap(map)
    maps.push(map)
    document.getElementById("mapForm").reset()
    renderMaps()
    alert("Mapa agregado")
  }
}

// ========== MAP BANS ==========
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

async function handleMapBanFormSubmit() {
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

  const ban = {
    id: Date.now().toString(),
    team_id: teamId,
    map_id: mapId,
    timestamp: new Date().toISOString(),
  }

  await window.SupabaseClient.saveMapBan(ban)
  mapBans.push(ban)
  document.getElementById("mapBanForm").reset()
  alert(`Baneo registrado: ${team.name} ha baneado un mapa`)
}

// ========== EDIT TEAMS SECTION ==========
function initEditTeamsSection() {
  const editTeamSelect = document.getElementById("editTeamSelect")
  if (editTeamSelect) {
    editTeamSelect.innerHTML =
      '<option value="">Seleccionar equipo</option>' +
      registeredTeams
        .map((t) => `<option value="${t.id}">${t.name} (${t.abbreviation}) - Grupo ${t.group}</option>`)
        .join("")

    editTeamSelect.addEventListener("change", function () {
      loadTeamForEditing(this.value)
    })
  }
}

function loadTeamForEditing(teamId) {
  const team = registeredTeams.find((t) => t.id === teamId)
  if (!team) return

  const editTeamGroup = document.getElementById("editTeamGroup")
  const editTeamPoints = document.getElementById("editTeamPoints")
  const editPlayerSelect = document.getElementById("editPlayerSelect")
  const editTeamPlayersList = document.getElementById("editTeamPlayersList")

  if (editTeamGroup) editTeamGroup.value = team.group || "A"
  if (editTeamPoints) editTeamPoints.value = team.points || 0

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
      ${(team.players || [])
        .map(
          (p, idx) => `
        <div class="player-list-item">
          <strong>${p.name}</strong><br>
          Rol: ${p.role} | UID: ${p.uid}<br>
          País: ${p.country} | Tel: ${p.phone}
        </div>
      `,
        )
        .join("")}
    `
  }

  document.getElementById("editPlayerTeamId").value = teamId
}

async function handleEditTeamGroupSubmit() {
  const teamId = document.getElementById("editTeamSelect").value
  const newGroup = document.getElementById("editTeamGroup").value
  const newPoints = Number.parseInt(document.getElementById("editTeamPoints").value) || 0

  if (!teamId) {
    alert("Selecciona un equipo primero")
    return
  }

  const team = registeredTeams.find((t) => t.id === teamId)
  if (!team) {
    alert("Equipo no encontrado")
    return
  }

  team.group = newGroup
  team.points = newPoints
  await window.SupabaseClient.updateRegisteredTeam(teamId, { group: newGroup, points: newPoints })
  alert(`Grupo actualizado a ${newGroup} con ${newPoints} puntos`)
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

async function handleEditPlayerSubmit() {
  const teamId = document.getElementById("editPlayerTeamId").value
  const playerIndex = Number.parseInt(document.getElementById("editPlayerIndex").value)

  const name = document.getElementById("editPlayerName").value
  const uid = document.getElementById("editPlayerUID").value
  const country = document.getElementById("editPlayerCountry").value

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
  team.players[playerIndex].countryCode = document.getElementById("editPlayerCountryCode").value
  team.players[playerIndex].phone = document.getElementById("editPlayerPhone").value

  await window.SupabaseClient.updateRegisteredTeam(teamId, { players: team.players })
  alert(`Jugador ${name} actualizado correctamente`)
}

function initializeSelects() {
  const editPlayerSelect = document.getElementById("editPlayerSelect")
  if (editPlayerSelect) {
    editPlayerSelect.addEventListener("change", function () {
      loadPlayerForEditing(this.value)
    })
  }
}

function setupRealtimeSync() {
  console.log("[v0] Setting up real-time sync")

  // Poll for updates every 3 seconds
  setInterval(async () => {
    try {
      registeredTeams = await window.SupabaseClient.getRegisteredTeams()
      matches = await window.SupabaseClient.getTournamentMatches()
      maps = await window.SupabaseClient.getMaps()
      mapBans = await window.SupabaseClient.getMapBans()
      heroStats = await window.SupabaseClient.getHeroStats()
      tournamentState = await window.SupabaseClient.getTournamentState()
    } catch (error) {
      console.log("[v0] Polling error (expected):", error.message)
    }
  }, 3000)
}
