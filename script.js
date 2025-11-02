// Data Storage
let registeredTeams = []
let matches = []
let maps = []
let heroStats = { teams: 16, players: 80, matches: 15 }
let tournamentState = { quarterfinals: [], semifinals: [], final: [], champion: null }

// Anime.js library import
const anime = window.anime

// BroadcastChannel for real-time sync between tabs
const syncChannel = new BroadcastChannel("tournament-sync")

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
  console.log("[v0] Tournament page loading")

  await loadAllData()
  initNavigation()
  initScrollAnimations()
  initAnimatedBackground()
  updateHeroStats()
  renderGroups()
  renderBrackets()
  renderStats()
  renderMapBans()
  initModal()
  setupRealtimeSync()
})

async function loadAllData() {
  try {
    console.log("[v0] Loading tournament data from Supabase")
    registeredTeams = await window.SupabaseClient.getRegisteredTeams()
    heroStats = await window.SupabaseClient.getHeroStats()
    matches = await window.SupabaseClient.getTournamentMatches()
    maps = await window.SupabaseClient.getMaps()
    tournamentState = await window.SupabaseClient.getTournamentState()
    console.log("[v0] Tournament data loaded:", { teams: registeredTeams.length, matches: matches.length })
  } catch (error) {
    console.error("[v0] Error loading tournament data:", error)
  }
}

function initAnimatedBackground() {
  if (!anime) return

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

  // Navbar scroll effect
  window.addEventListener("scroll", () => {
    const navbar = document.getElementById("navbar")
    if (navbar) {
      if (window.scrollY > 50) {
        navbar.style.background = "rgba(15, 10, 30, 0.98)"
      } else {
        navbar.style.background = "rgba(15, 10, 30, 0.95)"
      }
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
      if (entry.isIntersecting && anime) {
        anime({
          targets: entry.target,
          opacity: [0, 1],
          translateY: [50, 0],
          duration: 1000,
          easing: "easeOutExpo",
        })
        observer.unobserve(entry.target)
      }
    })
  }, observerOptions)

  document.querySelectorAll(".section").forEach((section) => {
    observer.observe(section)
  })

  if (anime) {
    anime({
      targets: ".section-title",
      opacity: [0, 1],
      translateY: [-30, 0],
      duration: 1000,
      easing: "easeOutExpo",
      delay: 200,
    })
  }

  animateCounters()

  // Parallax effect on hero background
  window.addEventListener("scroll", () => {
    const scrolled = window.pageYOffset
    const heroBg = document.querySelector(".hero-bg")
    if (heroBg) {
      heroBg.style.transform = `translateY(${scrolled * 0.5}px)`
    }
  })
}

function animateCounters() {
  if (!anime) return

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

  if (teamsEl) teamsEl.textContent = registeredTeams.length
  if (playersEl) playersEl.textContent = registeredTeams.reduce((sum, t) => sum + (t.players ? t.players.length : 0), 0)
  if (matchesEl) matchesEl.textContent = matches.length
}

function renderGroups() {
  const container = document.getElementById("groupsContainer")
  if (!container) return

  const groups = ["A", "B", "C", "D"]
  container.innerHTML = ""

  groups.forEach((groupName) => {
    const groupTeams = registeredTeams.filter((t) => t.group === groupName).sort((a, b) => b.points - a.points)

    const groupDiv = document.createElement("div")
    groupDiv.className = "group fade-in-up"
    groupDiv.innerHTML = `
      <h3 class="group-header">Grupo ${groupName}</h3>
      ${groupTeams
        .map(
          (team) => `
        <div class="team-card" onclick="showTeamModal('${team.id}')">
          <img src="${team.logo || "/placeholder.svg?height=60&width=60"}" alt="${team.name}" class="team-logo">
          <div class="team-info">
            <div class="team-name">${team.name}</div>
            <div class="team-subtitle">${team.abbreviation} - ${team.players ? team.players.length : 0} jugadores</div>
          </div>
        </div>
      `,
        )
        .join("")}
      ${groupTeams.length === 0 ? '<p class="empty-group">Sin equipos registrados</p>' : ""}
    `
    container.appendChild(groupDiv)
  })
}

function renderStats(filter = "kills") {
  const container = document.getElementById("statsLeaderboard")
  if (!container) return

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

  if (anime) {
    anime({
      targets: ".podium-banner",
      opacity: [0, 1],
      translateY: [50, 0],
      delay: anime.stagger(150),
      duration: 800,
      easing: "easeOutExpo",
    })
  }
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

  container.innerHTML = `
    <div class="bracket-wrapper">
      <div class="playoffs-grid">
        <div class="playoff-stage">
          <div class="bracket-stage-title">Cuartos de Final</div>
          ${quarterfinalsLeft.map((m) => renderPlayoffMatchup(m)).join("")}
          ${quarterfinalsRight.map((m) => renderPlayoffMatchup(m)).join("")}
        </div>
      </div>
      ${
        tournamentState.champion
          ? `
        <div class="champion-badge" style="display: flex;">
          <div class="champion-badge-inner">
            <div class="champion-stars">⭐⭐⭐</div>
            <div class="champion-text">CAMPEÓN: ${registeredTeams.find((t) => t.id === tournamentState.champion)?.name || ""}</div>
          </div>
        </div>
      `
          : ""
      }
    </div>
  `
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
    <div class="bracket-match-card">
      <div class="bracket-team" onclick="showTeamModal('${matchup.team1?.id || ""}')">
        ${matchup.team1 ? `<img src="${matchup.team1.logo || "/placeholder.svg"}" alt="${matchup.team1.name}" class="bracket-team-logo">` : ""}
        <span class="bracket-team-name">${matchup.team1?.name || "TBD"}</span>
      </div>
      <div class="bracket-vs">VS</div>
      <div class="bracket-team" onclick="showTeamModal('${matchup.team2?.id || ""}')">
        ${matchup.team2 ? `<img src="${matchup.team2.logo || "/placeholder.svg"}" alt="${matchup.team2.name}" class="bracket-team-logo">` : ""}
        <span class="bracket-team-name">${matchup.team2?.name || "TBD"}</span>
      </div>
    </div>
  `
}

function renderMapBans() {
  const container = document.getElementById("mapBansContainer")
  if (!container) return

  const groupMatches = matches.filter((m) => m.phase === "groups")

  if (groupMatches.length === 0) {
    container.innerHTML =
      '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">No hay partidas registradas aún</p>'
    return
  }

  let html = ""
  const groups = ["A", "B", "C", "D"]

  groups.forEach((groupName) => {
    const groupTeams = registeredTeams.filter((t) => t.group === groupName)
    const groupTeamIds = groupTeams.map((t) => t.id)
    const groupMatchesFiltered = groupMatches.filter(
      (m) => groupTeamIds.includes(m.team1) && groupTeamIds.includes(m.team2),
    )

    if (groupMatchesFiltered.length > 0) {
      html += `
        <div class="group-matches-section">
          <h3 class="group-matches-title">Grupo ${groupName}</h3>
          <div class="matches-grid">
            ${groupMatchesFiltered
              .map((match, index) => {
                const team1 = registeredTeams.find((t) => t.id === match.team1)
                const team2 = registeredTeams.find((t) => t.id === match.team2)
                const winner = match.winner ? registeredTeams.find((t) => t.id === match.winner) : null
                const gamesData = match.games_data || []

                return `
                <div class="match-info-card" onclick="showMatchDetails('${match.id}')">
                  <div class="match-header">
                    <h4>Partida ${index + 1}</h4>
                    ${winner ? '<span class="match-status completed">Completada</span>' : '<span class="match-status pending">Pendiente</span>'}
                  </div>
                  <div class="match-teams">
                    <div class="match-team ${winner && winner.id === team1?.id ? "winner" : ""}">
                      <img src="${team1?.logo || "/placeholder.svg"}" alt="${team1?.name || "TBD"}">
                      <span>${team1?.name || "TBD"}</span>
                    </div>
                    <span class="match-vs">VS</span>
                    <div class="match-team ${winner && winner.id === team2?.id ? "winner" : ""}">
                      <img src="${team2?.logo || "/placeholder.svg"}" alt="${team2?.name || "TBD"}">
                      <span>${team2?.name || "TBD"}</span>
                    </div>
                  </div>
                  ${
                    gamesData.length > 0
                      ? `
                    <div class="match-result">
                      <span class="result-label">Mapas: ${gamesData.length}/5</span>
                    </div>
                  `
                      : ""
                  }
                </div>
              `
              })
              .join("")}
          </div>
        </div>
      `
    }
  })

  container.innerHTML =
    html || '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">No hay partidas registradas</p>'

  if (anime) {
    anime({
      targets: ".match-info-card",
      opacity: [0, 1],
      translateY: [20, 0],
      delay: anime.stagger(80),
      duration: 600,
      easing: "easeOutExpo",
    })
  }
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

window.showTeamModal = (teamId) => {
  const team = registeredTeams.find((t) => t.id === teamId)
  if (!team) {
    alert("Equipo no encontrado")
    return
  }

  const modal = document.getElementById("teamModal")
  const content = document.getElementById("teamModalContent")
  const teamPlayers = team.players || []

  content.innerHTML = `
    <div class="modal-team-header">
      <img src="${team.logo || "/placeholder.svg"}" alt="${team.name}" class="modal-team-logo">
      <h2 class="modal-team-name">${team.name}</h2>
      <p>Grupo ${team.group} - ${teamPlayers.length} Jugadores - ${team.points || 0} Puntos</p>
    </div>
    <div class="modal-players">
      ${teamPlayers
        .map(
          (p) => `
        <div class="player-item">
          <strong>${p.name}</strong><br>
          Rol: ${p.role} | UID: ${p.uid}<br>
          Bajas: ${p.stats?.kills || 0} | Asistencias: ${p.stats?.assists || 0}
        </div>
      `,
        )
        .join("")}
    </div>
  `

  modal.style.display = "block"

  if (anime) {
    anime({
      targets: ".modal-content",
      scale: [0.8, 1],
      opacity: [0, 1],
      duration: 400,
      easing: "easeOutExpo",
    })
  }
}

window.showMatchDetails = (matchId) => {
  const match = matches.find((m) => m.id === matchId)
  if (!match) return

  const team1 = registeredTeams.find((t) => t.id === match.team1)
  const team2 = registeredTeams.find((t) => t.id === match.team2)
  const gamesData = match.games_data || []

  const modal = document.getElementById("teamModal")
  const content = document.getElementById("teamModalContent")

  content.innerHTML = `
    <div class="modal-match-header">
      <h2>Detalles de la Partida</h2>
      <div class="modal-match-teams">
        <div>${team1?.name || "TBD"}</div>
        <span>VS</span>
        <div>${team2?.name || "TBD"}</div>
      </div>
    </div>
    <div class="modal-match-games">
      ${gamesData
        .map((game, idx) => {
          const map = maps.find((m) => m.id === game.mapId)
          const gameWinner = registeredTeams.find((t) => t.id === game.winner)
          return `
          <div class="modal-game-card">
            <div>Mapa ${idx + 1}: ${map?.name || "Desconocido"}</div>
            <div>Ganador: ${gameWinner?.name || "Desconocido"}</div>
          </div>
        `
        })
        .join("")}
    </div>
  `

  modal.style.display = "block"
}

function setupRealtimeSync() {
  console.log("[v0] Setting up real-time sync for tournament page")

  // Poll for updates every 3 seconds
  setInterval(async () => {
    try {
      const newTeams = await window.SupabaseClient.getRegisteredTeams()
      const newMatches = await window.SupabaseClient.getTournamentMatches()

      // Check if data changed
      if (
        JSON.stringify(newTeams) !== JSON.stringify(registeredTeams) ||
        JSON.stringify(newMatches) !== JSON.stringify(matches)
      ) {
        registeredTeams = newTeams
        matches = newMatches
        updateHeroStats()
        renderGroups()
        renderBrackets()
        renderStats()
        renderMapBans()
      }
    } catch (error) {
      console.log("[v0] Polling error (expected):", error.message)
    }
  }, 3000)
}
