let registeredTeams = []
let teams = []
let players = []
let matches = []
let maps = []
let mapBans = []
let heroStats = { teams: 16, players: 80, matches: 15 }
let tournamentState = { quarterfinals: [], semifinals: [], final: [], champion: null }

const anime = window.anime
const syncChannel = new BroadcastChannel("tournament-sync")

document.addEventListener("DOMContentLoaded", () => {
  initNavigation()
  initScrollAnimations()
  initAnimatedBackground()
  loadAllData()
  initModal()
  initRealtimeSync()
})

async function loadAllData() {
  try {
    registeredTeams = await window.supabase.fetchRegisteredTeams()
    teams = await window.supabase.fetchTeams()
    players = await window.supabase.fetchPlayers()
    matches = await window.supabase.fetchMatches()
    maps = await window.supabase.fetchMaps()
    mapBans = await window.supabase.fetchMapBans()

    const statsData = await window.supabase.fetchHeroStats()
    heroStats = statsData || { teams: 16, players: 80, matches: 15 }

    const stateData = await window.supabase.fetchTournamentState()
    tournamentState = stateData || { quarterfinals: [], semifinals: [], final: [], champion: null }

    updateHeroStats()
    renderGroups()
    renderBrackets()
    renderStats()
    renderMapBans()
    loadMatches()
  } catch (error) {
    console.error("[v0] Error loading data:", error)
  }
}

function initRealtimeSync() {
  window.supabase.subscribeToChanges("registered_teams", (payload) => {
    registeredTeams = payload.new
    renderGroups()
    renderBrackets()
    renderStats()
    updateHeroStats()
  })

  window.supabase.subscribeToChanges("matches", (payload) => {
    matches = payload.new
    renderBrackets()
    loadMatches()
  })

  window.supabase.subscribeToChanges("maps", (payload) => {
    maps = payload.new
    renderMapBans()
  })

  syncChannel.onmessage = (event) => {
    console.log("[v0] Sync message received:", event.data)
    const { type } = event.data
    if (type === "refresh") {
      loadAllData()
    }
  }
}

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
    link.addEventListener("click", (e) => {
      if (link.getAttribute("href").startsWith("#")) {
        e.preventDefault()
        const target = document.querySelector(link.getAttribute("href"))
        if (target) {
          target.scrollIntoView({ behavior: "smooth" })
          navMenu.classList.remove("active")
        }
      }
    })
  })

  window.addEventListener("scroll", () => {
    const navbar = document.getElementById("navbar")
    if (window.scrollY > 50) {
      navbar.style.background = "rgba(15, 10, 30, 0.98)"
    } else {
      navbar.style.background = "rgba(15, 10, 30, 0.95)"
    }
  })
}

function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -100px 0px",
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateElement(entry.target)
        observer.unobserve(entry.target)
      }
    })
  }, observerOptions)

  document.querySelectorAll(".section").forEach((section) => {
    observer.observe(section)
  })

  document.querySelectorAll(".section-title").forEach((title) => {
    anime({
      targets: title,
      opacity: [0, 1],
      translateY: [-30, 0],
      duration: 1000,
      easing: "easeOutExpo",
      delay: 200,
    })
  })

  animateCounters()

  window.addEventListener("scroll", () => {
    const scrolled = window.pageYOffset
    const heroBg = document.querySelector(".hero-bg")
    if (heroBg) {
      heroBg.style.transform = `translateY(${scrolled * 0.5}px)`
    }
  })
}

function animateElement(element) {
  anime({
    targets: element,
    opacity: [0, 1],
    translateY: [50, 0],
    duration: 1000,
    easing: "easeOutExpo",
  })
}

function animateCounters() {
  const counters = [
    { element: document.getElementById("heroTeamsCount"), target: heroStats.teams },
    { element: document.getElementById("heroPlayersCount"), target: heroStats.players },
    { element: document.getElementById("heroMatchesCount"), target: heroStats.matches },
  ]

  counters.forEach(({ element, target }) => {
    if (element) {
      anime({
        targets: element,
        innerHTML: [0, target],
        duration: 2000,
        round: 1,
        easing: "easeOutExpo",
      })
    }
  })
}

function updateHeroStats() {
  const teamsEl = document.getElementById("heroTeamsCount")
  const playersEl = document.getElementById("heroPlayersCount")
  const matchesEl = document.getElementById("heroMatchesCount")

  if (teamsEl) teamsEl.textContent = heroStats.teams
  if (playersEl) playersEl.textContent = heroStats.players
  if (matchesEl) matchesEl.textContent = heroStats.matches
}

function renderGroups() {
  const container = document.getElementById("groupsContainer")
  const groups = ["A", "B", "C", "D"]

  container.innerHTML = ""

  groups.forEach((groupName) => {
    const groupTeams = registeredTeams.filter((t) => t.group === groupName).sort((a, b) => b.points - a.points)

    const groupDiv = document.createElement("div")
    groupDiv.className = "group fade-in-up"
    groupDiv.innerHTML = `<h3 class="group-header">Grupo ${groupName}</h3>`

    groupTeams.forEach((team) => {
      const teamCard = document.createElement("div")
      teamCard.className = "team-card"
      teamCard.onclick = () => window.showTeamModal(team.id)
      teamCard.innerHTML = `
        <img src="${team.logo || "/generic-team-logo.png"}" alt="${team.name}" class="team-logo">
        <div class="team-info">
          <div class="team-name">${team.name}</div>
          <div class="team-subtitle">${team.abbreviation} - ${team.players ? team.players.length : 0} jugadores</div>
        </div>
      `
      groupDiv.appendChild(teamCard)
    })

    if (groupTeams.length === 0) {
      groupDiv.innerHTML += '<p class="empty-group">Sin equipos registrados</p>'
    }

    container.appendChild(groupDiv)
  })
}

function renderBrackets() {
  const container = document.getElementById("bracketsContainer")

  if (!container) return

  const allTeams = registeredTeams.length
  const groupsCompleted = allTeams >= 4 && registeredTeams.every((t) => t.group)

  if (!groupsCompleted) {
    container.innerHTML = `
      <div style="text-align: center; padding: 4rem 2rem; color: var(--text-muted);">
        <p style="font-size: 1.2rem; margin-bottom: 1rem;">Los brackets se mostrarán una vez que se completen todas las series de grupos.</p>
        <p>Equipos registrados: ${allTeams}/16</p>
      </div>
    `
    return
  }

  const groupA = registeredTeams.filter((t) => t.group === "A").sort((a, b) => b.points - a.points)
  const groupB = registeredTeams.filter((t) => t.group === "B").sort((a, b) => b.points - a.points)
  const groupC = registeredTeams.filter((t) => t.group === "C").sort((a, b) => b.points - a.points)
  const groupD = registeredTeams.filter((t) => t.group === "D").sort((a, b) => b.points - a.points)

  const groupsReady = [groupA, groupB, groupC, groupD].every((g) => g.length >= 2)

  if (!groupsReady) {
    container.innerHTML = `
      <div style="text-align: center; padding: 4rem 2rem; color: var(--text-muted);">
        <p>Esperando que todos los grupos tengan al menos 2 equipos...</p>
        <p>Grupo A: ${groupA.length}/4 | Grupo B: ${groupB.length}/4 | Grupo C: ${groupC.length}/4 | Grupo D: ${groupD.length}/4</p>
      </div>
    `
    return
  }

  const quarterfinalsLeft = [
    { team1: groupA[0], team2: groupC[1] },
    { team1: groupB[0], team2: groupD[1] },
  ]

  const quarterfinalsRight = [
    { team1: groupC[0], team2: groupA[1] },
    { team1: groupD[0], team2: groupB[1] },
  ]

  const semifinalsTeams = tournamentState.semifinals
    .map((id) => registeredTeams.find((t) => t.id === id))
    .filter(Boolean)
  const finalTeams = tournamentState.final.map((id) => registeredTeams.find((t) => t.id === id)).filter(Boolean)
  const champion = tournamentState.champion ? registeredTeams.find((t) => t.id === tournamentState.champion) : null

  container.innerHTML = `
    <div class="bracket-wrapper">
      <div class="playoffs-grid">
        <div class="playoff-stage">
          <div class="bracket-stage-title">Cuartos de Final (Izq)</div>
          <div class="bracket-matches-column">
            ${renderPlayoffMatchup(quarterfinalsLeft[0])}
            ${renderPlayoffMatchup(quarterfinalsLeft[1])}
          </div>
        </div>

        <div class="playoff-stage">
          <div class="bracket-stage-title">Semifinales (Izq)</div>
          <div class="bracket-matches-column">
            ${renderPlayoffTeamBox(semifinalsTeams[0])}
            ${renderPlayoffTeamBox(semifinalsTeams[1])}
          </div>
        </div>

        <div class="playoff-stage">
          <div class="bracket-stage-title">Final</div>
          <div class="champion-section">
            ${renderPlayoffTeamBox(finalTeams[0], true)}
            <div class="bracket-vs">VS</div>
            ${renderPlayoffTeamBox(finalTeams[1], true)}
          </div>
        </div>

        <div class="playoff-stage">
          <div class="bracket-stage-title">Semifinales (Der)</div>
          <div class="bracket-matches-column">
            ${renderPlayoffTeamBox(semifinalsTeams[2])}
            ${renderPlayoffTeamBox(semifinalsTeams[3])}
          </div>
        </div>

        <div class="playoff-stage">
          <div class="bracket-stage-title">Cuartos de Final (Der)</div>
          <div class="bracket-matches-column">
            ${renderPlayoffMatchup(quarterfinalsRight[0])}
            ${renderPlayoffMatchup(quarterfinalsRight[1])}
          </div>
        </div>
      </div>
      ${
        champion
          ? `
        <div class="champion-badge" style="display: flex;">
          <div class="champion-badge-inner">
            <div class="champion-stars">⭐⭐⭐</div>
            <div class="champion-text">CAMPEÓN: ${champion.name}</div>
          </div>
        </div>
      `
          : ""
      }
    </div>
  `

  anime({
    targets: ".bracket-match-card",
    opacity: [0, 1],
    translateY: [30, 0],
    delay: anime.stagger(100),
    duration: 700,
    easing: "easeOutExpo",
  })

  anime({
    targets: ".playoff-stage",
    opacity: [0, 1],
    translateX: anime.stagger([-50, 50], { direction: "alternate" }),
    duration: 800,
    delay: anime.stagger(150),
    easing: "easeOutExpo",
  })
}

function renderPlayoffMatchup(matchup) {
  if (!matchup || (!matchup.team1 && !matchup.team2)) {
    return `
      <div class="bracket-match-card">
        <div class="bracket-team empty">
          <div class="bracket-team-placeholder">TBD</div>
        </div>
        <div class="bracket-vs">VS</div>
        <div class="bracket-team empty">
          <div class="bracket-team-placeholder">TBD</div>
        </div>
      </div>
    `
  }

  return `
    <div class="bracket-match-card" onclick="window.showTeamModal('${matchup.team1?.id || ""}')">
      <div class="bracket-team">
        ${matchup.team1 ? `<img src="${matchup.team1.logo || "/generic-team-logo.png"}" alt="${matchup.team1.name}" class="bracket-team-logo">` : ""}
        <span class="bracket-team-name">${matchup.team1?.name || "TBD"}</span>
      </div>
      <div class="bracket-vs">VS</div>
      <div class="bracket-team" onclick="window.showTeamModal('${matchup.team2?.id || ""}')">
        ${matchup.team2 ? `<img src="${matchup.team2.logo || "/generic-team-logo.png"}" alt="${matchup.team2.name}" class="bracket-team-logo">` : ""}
        <span class="bracket-team-name">${matchup.team2?.name || "TBD"}</span>
      </div>
    </div>
  `
}

function renderPlayoffTeamBox(team, isFinal = false) {
  if (!team) {
    return `
      <div class="bracket-team empty">
        <div class="bracket-team-placeholder">TBD</div>
      </div>
    `
  }

  return `
    <div class="bracket-team" onclick="window.showTeamModal('${team.id}')">
      <img src="${team.logo || "/generic-team-logo.png"}" alt="${team.name}" class="bracket-team-logo">
      <span class="bracket-team-name">${team.name}</span>
    </div>
  `
}

function renderStats(filter = "kills") {
  const container = document.getElementById("statsLeaderboard")

  const allPlayers = []
  registeredTeams.forEach((team) => {
    if (team.players) {
      team.players.forEach((player) => {
        allPlayers.push({
          ...player,
          teamName: team.name,
          teamLogo: team.logo,
          teamId: team.id,
        })
      })
    }
  })

  const sortedPlayers = allPlayers
    .sort((a, b) => {
      const aStat = (a.stats && a.stats[filter]) || 0
      const bStat = (b.stats && b.stats[filter]) || 0
      return bStat - aStat
    })
    .slice(0, 3)

  const filterLabels = {
    kills: "BAJAS",
    assists: "ASISTENCIAS",
    revives: "REVIVIDAS",
    vehicleDamage: "DAÑO A VEHÍCULOS",
  }

  container.innerHTML = `
    <div class="stats-category-title">${filterLabels[filter]}</div>
    <div class="podium-container">
      ${
        sortedPlayers[1]
          ? `
        <div class="podium-banner second-place">
          <div class="banner-position">2° LUGAR</div>
          <div class="banner-content">
            ${sortedPlayers[1].teamLogo ? `<img src="${sortedPlayers[1].teamLogo}" alt="${sortedPlayers[1].teamName}" class="banner-team-logo">` : ""}
            <div class="banner-player-name">${sortedPlayers[1].name}</div>
            <div class="banner-team-name">${sortedPlayers[1].teamName}</div>
            <div class="banner-stat-value">${(sortedPlayers[1].stats && sortedPlayers[1].stats[filter]) || 0}</div>
          </div>
        </div>
      `
          : ""
      }
      ${
        sortedPlayers[0]
          ? `
        <div class="podium-banner first-place">
          <div class="banner-position">1° LUGAR</div>
          <div class="banner-content">
            ${sortedPlayers[0].teamLogo ? `<img src="${sortedPlayers[0].teamLogo}" alt="${sortedPlayers[0].teamName}" class="banner-team-logo">` : ""}
            <div class="banner-player-name">${sortedPlayers[0].name}</div>
            <div class="banner-team-name">${sortedPlayers[0].teamName}</div>
            <div class="banner-stat-value">${(sortedPlayers[0].stats && sortedPlayers[0].stats[filter]) || 0}</div>
          </div>
        </div>
      `
          : ""
      }
      ${
        sortedPlayers[2]
          ? `
        <div class="podium-banner third-place">
          <div class="banner-position">3° LUGAR</div>
          <div class="banner-content">
            ${sortedPlayers[2].teamLogo ? `<img src="${sortedPlayers[2].teamLogo}" alt="${sortedPlayers[2].teamName}" class="banner-team-logo">` : ""}
            <div class="banner-player-name">${sortedPlayers[2].name}</div>
            <div class="banner-team-name">${sortedPlayers[2].teamName}</div>
            <div class="banner-stat-value">${(sortedPlayers[2].stats && sortedPlayers[2].stats[filter]) || 0}</div>
          </div>
        </div>
      `
          : ""
      }
    </div>
  `

  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"))
      btn.classList.add("active")
      renderStats(btn.dataset.filter)
    })
  })

  anime({
    targets: ".podium-banner",
    opacity: [0, 1],
    translateY: [50, 0],
    delay: anime.stagger(150),
    duration: 800,
    easing: "easeOutExpo",
  })
}

function renderMapBans() {
  const container = document.getElementById("mapBansContainer")
  const groups = ["A", "B", "C", "D"]

  if (matches.length === 0) {
    container.innerHTML =
      '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">No hay partidas registradas aún</p>'
    return
  }

  let html = ""

  groups.forEach((groupName) => {
    const groupTeams = registeredTeams.filter((t) => t.group === groupName)
    const groupTeamIds = groupTeams.map((t) => t.id)
    const groupMatchesFiltered = matches.filter((m) => groupTeamIds.includes(m.team1) && groupTeamIds.includes(m.team2))

    if (groupMatchesFiltered.length > 0) {
      html += `<div class="group-matches-section"><h3 class="group-matches-title">Grupo ${groupName}</h3><div class="matches-grid">`

      groupMatchesFiltered.forEach((match, index) => {
        const team1 = registeredTeams.find((t) => t.id === match.team1)
        const team2 = registeredTeams.find((t) => t.id === match.team2)
        const winner = match.winner ? registeredTeams.find((t) => t.id === match.winner) : null

        html += `
          <div class="match-info-card" onclick="window.showMatchDetails('${match.id}')">
            <div class="match-header">
              <h4>Partida ${index + 1}</h4>
              ${winner ? `<span class="match-status completed">Completada</span>` : `<span class="match-status pending">Pendiente</span>`}
            </div>
            <div class="match-teams">
              <div class="match-team ${winner && winner.id === team1?.id ? "winner" : ""}">
                <img src="${team1?.logo || "/generic-team-logo.png"}" alt="${team1?.name || "TBD"}">
                <span>${team1?.name || "TBD"}</span>
              </div>
              <span class="match-vs">VS</span>
              <div class="match-team ${winner && winner.id === team2?.id ? "winner" : ""}">
                <img src="${team2?.logo || "/generic-team-logo.png"}" alt="${team2?.name || "TBD"}">
                <span>${team2?.name || "TBD"}</span>
              </div>
            </div>
            <div class="match-click-hint">Click para ver detalles</div>
          </div>
        `
      })

      html += "</div></div>"
    }
  })

  container.innerHTML =
    html || '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">No hay partidas registradas</p>'

  anime({
    targets: ".match-info-card",
    opacity: [0, 1],
    translateY: [20, 0],
    delay: anime.stagger(80),
    duration: 600,
    easing: "easeOutExpo",
  })
}

function loadMatches() {
  renderMapBans()
}

window.showTeamModal = (teamId) => {
  const team = registeredTeams.find((t) => t.id === teamId)
  if (!team) {
    alert("Equipo no encontrado")
    return
  }

  const teamPlayers = team.players || []
  const leader = teamPlayers.find((p) => p.role === "leader")
  const members = teamPlayers.filter((p) => p.role === "member")
  const substitutes = teamPlayers.filter((p) => p.role === "substitute")

  const teamMatches = matches.filter((m) => m.team1 === teamId || m.team2 === teamId)
  const wins = teamMatches.filter((m) => m.winner === teamId).length
  const losses = teamMatches.filter((m) => m.winner && m.winner !== teamId).length

  const modal = document.getElementById("teamModal")
  const content = document.getElementById("teamModalContent")

  if (!modal || !content) return

  const passedQuarterfinals = team.points >= 3
  const qualificationStatus = passedQuarterfinals ? "✓ Clasifica a Cuartos" : "En disputa"

  content.innerHTML = `
    <div class="modal-team-header">
      <img src="${team.logo || "/generic-team-logo.png"}" alt="${team.name}" class="modal-team-logo">
      <h2 class="modal-team-name">${team.name}</h2>
      <p style="color: var(--text-muted);">Grupo ${team.group} - ${teamPlayers.length} Jugadores</p>
      <div class="team-points-display" style="font-size: 1.2rem; margin: 1rem 0; color: #ffd700; font-weight: bold;">
        Puntos: ${team.points || 0}
      </div>
      <div class="team-qualification-status" style="font-size: 1rem; margin-bottom: 1rem; color: ${passedQuarterfinals ? "#00ff00" : "#ffa500"};">
        ${qualificationStatus}
      </div>
      <div class="team-record">
        <span class="record-wins">${wins}V</span>
        <span class="record-separator">-</span>
        <span class="record-losses">${losses}D</span>
      </div>
    </div>

    <div class="modal-tabs">
      <button class="modal-tab active" data-tab="players">Jugadores</button>
      <button class="modal-tab" data-tab="matches">Partidas</button>
      <button class="modal-tab" data-tab="stats">Estadísticas</button>
    </div>

    <div class="modal-tab-content active" data-content="players">
      ${leader ? `<div class="players-section"><h3>Líder</h3>${createPlayerHTML(leader)}</div>` : ""}
      ${members.length > 0 ? `<div class="players-section"><h3>Miembros</h3>${members.map((p) => createPlayerHTML(p)).join("")}</div>` : ""}
      ${substitutes.length > 0 ? `<div class="players-section"><h3>Suplentes</h3>${substitutes.map((p) => createPlayerHTML(p)).join("")}</div>` : ""}
    </div>

    <div class="modal-tab-content" data-content="matches">
      <div class="matches-history">
        ${
          teamMatches.length > 0
            ? teamMatches
                .map((match) => {
                  const opponent =
                    match.team1 === teamId
                      ? registeredTeams.find((t) => t.id === match.team2)
                      : registeredTeams.find((t) => t.id === match.team1)
                  const isWinner = match.winner === teamId
                  const result = match.winner ? (isWinner ? "Victoria" : "Derrota") : "Pendiente"

                  return `
                  <div class="match-history-item ${isWinner ? "win" : match.winner ? "loss" : "pending"}">
                    <div class="match-history-opponent">
                      <img src="${opponent?.logo || "/generic-team-logo.png"}" alt="${opponent?.name || "TBD"}">
                      <span>vs ${opponent?.name || "TBD"}</span>
                    </div>
                    <div class="match-history-result">${result}</div>
                  </div>
                `
                })
                .join("")
            : '<p style="text-align: center; color: var(--text-muted);">No hay partidas registradas</p>'
        }
      </div>
    </div>

    <div class="modal-tab-content" data-content="stats">
      <div class="team-stats-grid">
        ${createTeamStatsHTML(teamPlayers)}
      </div>
    </div>
  `

  modal.style.display = "block"

  document.querySelectorAll(".modal-tab").forEach((tab) =>
    tab.addEventListener("click", () => {
      document.querySelectorAll(".modal-tab").forEach((t) => t.classList.remove("active"))
      document.querySelectorAll(".modal-tab-content").forEach((c) => c.classList.remove("active"))

      tab.classList.add("active")
      const tabContent = document.querySelector(`[data-content="${tab.dataset.tab}"]`)
      if (tabContent) {
        tabContent.classList.add("active")
      }
    }),
  )

  anime({
    targets: ".modal-content",
    scale: [0.8, 1],
    opacity: [0, 1],
    duration: 400,
    easing: "easeOutExpo",
  })
}

window.showMatchDetails = (matchId) => {
  const match = matches.find((m) => m.id === matchId)
  if (!match) return

  const team1 = registeredTeams.find((t) => t.id === match.team1)
  const team2 = registeredTeams.find((t) => t.id === match.team2)
  const winner = match.winner ? registeredTeams.find((t) => t.id === match.winner) : null

  const modal = document.getElementById("teamModal")
  const content = document.getElementById("teamModalContent")

  content.innerHTML = `
    <div class="modal-match-header">
      <h2>Detalles de la Partida (Mejor de 5)</h2>
      <div class="modal-match-teams">
        <div class="modal-match-team">
          <img src="${team1?.logo || "/generic-team-logo.png"}" alt="${team1?.name || "TBD"}">
          <span>${team1?.name || "TBD"}</span>
        </div>
        <span class="modal-match-vs">VS</span>
        <div class="modal-match-team">
          <img src="${team2?.logo || "/generic-team-logo.png"}" alt="${team2?.name || "TBD"}">
          <span>${team2?.name || "TBD"}</span>
        </div>
      </div>
      ${
        winner
          ? `
        <div class="modal-match-winner">
          <h3>Ganador de la Serie</h3>
          <div class="modal-winner-team">
            <img src="${winner.logo || "/generic-team-logo.png"}" alt="${winner.name}">
            <span>${winner.name}</span>
          </div>
        </div>
      `
          : ""
      }
    </div>
  `

  modal.style.display = "block"

  anime({
    targets: ".modal-content",
    scale: [0.8, 1],
    opacity: [0, 1],
    duration: 400,
    easing: "easeOutExpo",
  })
}

function createPlayerHTML(player) {
  const roleText = {
    leader: "Líder del Clan",
    member: "Miembro",
    substitute: "Suplente",
  }

  const stats = player.stats || { kills: 0, assists: 0, revives: 0, vehicleDamage: 0 }

  return `
    <div class="player-item ${player.role}">
        <div class="player-name">${player.name}</div>
        <div class="player-role">${roleText[player.role] || "Miembro"}</div>
        <div class="player-stats">
            <div class="player-stat">
                <span class="player-stat-label">Bajas</span>
                <span class="player-stat-value">${stats.kills || 0}</span>
            </div>
            <div class="player-stat">
                <span class="player-stat-label">Asistencias</span>
                <span class="player-stat-value">${stats.assists || 0}</span>
            </div>
            <div class="player-stat">
                <span class="player-stat-label">Revividas</span>
                <span class="player-stat-value">${stats.revives || 0}</span>
            </div>
            <div class="player-stat">
                <span class="player-stat-label">Daño Vehículos</span>
                <span class="player-stat-value">${stats.vehicleDamage || 0}</span>
            </div>
        </div>
    </div>
  `
}

function createTeamStatsHTML(teamPlayers) {
  const totalStats = teamPlayers.reduce(
    (acc, player) => {
      const stats = player.stats || { kills: 0, assists: 0, revives: 0, vehicleDamage: 0 }
      acc.kills += stats.kills || 0
      acc.assists += stats.assists || 0
      acc.revives += stats.revives || 0
      acc.vehicleDamage += stats.vehicleDamage || 0
      return acc
    },
    { kills: 0, assists: 0, revives: 0, vehicleDamage: 0 },
  )

  return `
    <div class="team-stat-card">
      <div class="team-stat-label">Total Bajas</div>
      <div class="team-stat-value">${totalStats.kills}</div>
    </div>
    <div class="team-stat-card">
      <div class="team-stat-label">Total Asistencias</div>
      <div class="team-stat-value">${totalStats.assists}</div>
    </div>
    <div class="team-stat-card">
      <div class="team-stat-label">Total Revividas</div>
      <div class="team-stat-value">${totalStats.revives}</div>
    </div>
    <div class="team-stat-card">
      <div class="team-stat-label">Daño a Vehículos</div>
      <div class="team-stat-value">${totalStats.vehicleDamage}</div>
    </div>
  `
}

function initAnimatedBackground() {
  anime({
    targets: ".shape-1",
    translateX: [0, 100, 0],
    translateY: [0, -50, 0],
    rotate: [0, 360],
    duration: 20000,
    easing: "linear",
    loop: true,
  })

  anime({
    targets: ".shape-2",
    translateX: [0, -80, 0],
    translateY: [0, 100, 0],
    rotate: [0, -360],
    duration: 25000,
    easing: "linear",
    loop: true,
  })

  anime({
    targets: ".shape-3",
    translateX: [0, 120, 0],
    translateY: [0, 80, 0],
    scale: [1, 1.2, 1],
    duration: 18000,
    easing: "linear",
    loop: true,
  })

  anime({
    targets: ".shape-4",
    translateX: [0, -100, 0],
    translateY: [0, -80, 0],
    rotate: [0, 180, 360],
    duration: 22000,
    easing: "linear",
    loop: true,
  })

  anime({
    targets: ".shape-5",
    translateX: [0, 60, 0],
    translateY: [0, -100, 0],
    scale: [1, 0.8, 1],
    duration: 19000,
    easing: "linear",
    loop: true,
  })
}

function initModal() {
  const modal = document.getElementById("teamModal")
  const closeBtn = document.querySelector(".close")

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.style.display = "none"
    })
  }

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none"
    }
  })
}
