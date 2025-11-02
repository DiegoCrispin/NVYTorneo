/// const XLSX = require("xlsx") - This line was causing script execution to stop

// Countries list with phone codes and digit requirements
const COUNTRIES = {
  argentina: { name: "Argentina", code: "54", flag: "🇦🇷", digits: 10 },
  bolivia: { name: "Bolivia", code: "591", flag: "🇧🇴", digits: 8 },
  chile: { name: "Chile", code: "56", flag: "🇨🇱", digits: 9 },
  colombia: { name: "Colombia", code: "57", flag: "🇨🇴", digits: 10 },
  costarica: { name: "Costa Rica", code: "506", flag: "🇨🇷", digits: 8 },
  cuba: { name: "Cuba", code: "53", flag: "🇨🇺", digits: 8 },
  ecuador: { name: "Ecuador", code: "593", flag: "🇪🇨", digits: 9 },
  elsalvador: { name: "El Salvador", code: "503", flag: "🇸🇻", digits: 8 },
  guatemala: { name: "Guatemala", code: "502", flag: "🇬🇹", digits: 8 },
  honduras: { name: "Honduras", code: "504", flag: "🇭🇳", digits: 8 },
  mexico: { name: "México", code: "52", flag: "🇲🇽", digits: 10 },
  nicaragua: { name: "Nicaragua", code: "505", flag: "🇳🇮", digits: 8 },
  panama: { name: "Panamá", code: "507", flag: "🇵🇦", digits: 8 },
  paraguay: { name: "Paraguay", code: "595", flag: "🇵🇾", digits: 9 },
  peru: { name: "Perú", code: "51", flag: "🇵🇪", digits: 9 },
  republicadominicana: { name: "República Dominicana", code: "1", flag: "🇩🇴", digits: 10 },
  uruguay: { name: "Uruguay", code: "598", flag: "🇺🇾", digits: 9 },
  venezuela: { name: "Venezuela", code: "58", flag: "🇻🇪", digits: 10 },
}

let logoImage = null
const anime = window.anime
const XLSX = window.XLSX // Declare the XLSX variable here

document.addEventListener("DOMContentLoaded", () => {
  console.log("[v0] DOMContentLoaded - Inicializando formulario")
  initNavigation()
  initForm()
  addInitialPlayers()
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

function initForm() {
  const form = document.getElementById("registroForm")
  const logoInput = document.getElementById("teamLogo")
  const addBtn = document.getElementById("addPlayerBtn")
  const removeBtn = document.getElementById("removePlayerBtn")

  logoInput.addEventListener("change", handleLogoUpload)
  form.addEventListener("submit", handleFormSubmit)
  addBtn.addEventListener("click", addPlayer)
  removeBtn.addEventListener("click", removePlayer)
}

function handleLogoUpload(e) {
  const file = e.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (event) => {
      logoImage = event.target.result
      const preview = document.getElementById("logoPreview")
      preview.innerHTML = `<img src="${logoImage}" alt="Logo preview">`
    }
    reader.readAsDataURL(file)
  }
}

function addInitialPlayers() {
  console.log("[v0] Agregando 20 jugadores iniciales")
  for (let i = 0; i < 20; i++) {
    addPlayer()
  }
  console.log("[v0] Jugadores iniciales agregados")
}

function addPlayer() {
  const container = document.getElementById("playersContainer")
  const count = container.children.length

  if (count >= 24) {
    alert("Máximo de 24 jugadores alcanzado")
    return
  }

  const playerDiv = document.createElement("div")
  playerDiv.className = "player-input-group"
  playerDiv.innerHTML = `
    <div class="player-header">
      <span class="player-number">#${count + 1}</span>
      <div class="player-role-selector">
        <label class="role-label">
          <input type="radio" name="role_${count}" value="leader" class="role-radio">
          <span>Líder</span>
        </label>
        <label class="role-label">
          <input type="radio" name="role_${count}" value="member" class="role-radio" checked>
          <span>Miembro</span>
        </label>
        <label class="role-label">
          <input type="radio" name="role_${count}" value="substitute" class="role-radio">
          <span>Suplente</span>
        </label>
      </div>
    </div>

    <div class="player-inputs">
      <div class="form-group">
        <label>Nombre del Jugador</label>
        <input type="text" name="playerName_${count}" placeholder="Nombre" class="player-name" maxlength="50">
      </div>

      <div class="form-group">
        <label>UID (20 dígitos)</label>
        <input type="text" name="playerUID_${count}" placeholder="12345678901234567890" class="player-uid" maxlength="20" pattern="\\d{20}">
      </div>

      <div class="form-group">
        <label>País</label>
        <select name="playerCountry_${count}" class="player-country">
          <option value="">Seleccionar país</option>
          ${Object.entries(COUNTRIES)
            .map(([key, { name, flag }]) => `<option value="${key}">${flag} ${name}</option>`)
            .join("")}
        </select>
      </div>

      <div class="form-group">
        <label>Teléfono</label>
        <input type="tel" name="playerPhone_${count}" placeholder="Número de teléfono" class="player-phone" data-player-index="${count}">
        <small class="phone-digits-hint"></small>
      </div>
    </div>
  `

  container.appendChild(playerDiv)
  updatePlayerCount()

  const countrySelect = playerDiv.querySelector(".player-country")
  const phoneInput = playerDiv.querySelector(".player-phone")

  countrySelect.addEventListener("change", () => {
    const country = countrySelect.value
    const hint = playerDiv.querySelector(".phone-digits-hint")
    if (country && COUNTRIES[country]) {
      const digits = COUNTRIES[country].digits
      hint.textContent = `Ingresa ${digits} dígitos`
      phoneInput.maxLength = digits
      phoneInput.pattern = `\\d{${digits}}`
    } else {
      hint.textContent = ""
      phoneInput.maxLength = 20
      phoneInput.pattern = ""
    }
  })
}

function removePlayer() {
  const container = document.getElementById("playersContainer")
  const count = container.children.length

  if (count <= 1) {
    alert("Debe haber al menos 1 jugador")
    return
  }

  container.lastChild.remove()
  updatePlayerCount()
}

function updatePlayerCount() {
  const container = document.getElementById("playersContainer")
  const count = container.children.length
  document.getElementById("currentCount").textContent = count
}

function handleFormSubmit(e) {
  e.preventDefault()
  console.log("[v0] Iniciando envío del formulario")

  // Gather form data
  const teamName = document.getElementById("teamName").value.trim()
  const teamAbbr = document.getElementById("teamAbbr").value.trim()

  const hasLogo = logoImage !== null

  if (!teamName) {
    alert("Por favor completa el nombre del equipo")
    return
  }

  if (!teamAbbr) {
    alert("Por favor completa la abreviación del equipo (3 letras)")
    return
  }

  if (!hasLogo) {
    alert("Por favor carga el logo del equipo")
    return
  }

  const container = document.getElementById("playersContainer")
  const players = Array.from(container.querySelectorAll(".player-input-group")).map((playerElement, index) => {
    const roleInput = playerElement.querySelector(`input[name="role_${index}"]:checked`)
    const nameInput = playerElement.querySelector(`.player-name`)
    const uidInput = playerElement.querySelector(`.player-uid`)
    const countrySelect = playerElement.querySelector(`.player-country`)
    const phoneInput = playerElement.querySelector(`.player-phone`)

    return {
      name: nameInput ? nameInput.value.trim() : "",
      uid: uidInput ? uidInput.value.trim() : "",
      country: countrySelect ? countrySelect.value : "",
      phone: phoneInput ? phoneInput.value.trim() : "",
      role: roleInput ? roleInput.value : "member",
    }
  })

  console.log("[v0] Datos de jugadores extraídos:", players.length)

  const totalPlayers = players.length
  if (totalPlayers < 20) {
    alert(
      `ERROR: El equipo debe tener exactamente 20 jugadores.\nActualmente tienes ${totalPlayers}.\nAgrega ${20 - totalPlayers} jugador(es) más.`,
    )
    return
  }

  if (totalPlayers > 24) {
    alert("ERROR: El equipo no puede tener más de 24 jugadores")
    return
  }

  const incompletePlayer = players.findIndex(
    (player) => !player.name || !player.uid || !player.country || !player.phone,
  )

  if (incompletePlayer !== -1) {
    const playerNum = incompletePlayer + 1
    alert(
      `ERROR: El jugador #${playerNum} está incompleto.\n\nTodos los 20 jugadores DEBEN tener:\n- Nombre\n- UID (20 dígitos)\n- País\n- Teléfono\n\nPor favor completa todos los campos antes de guardar.`,
    )
    return
  }

  const leaderCount = players.filter((player) => player.role === "leader").length
  const substituteCount = players.filter((player) => player.role === "substitute").length

  console.log("[v0] Líderes:", leaderCount, "Suplentes:", substituteCount)

  if (leaderCount !== 1) {
    alert(`ERROR: El equipo debe tener exactamente 1 líder.\nActualmente tienes ${leaderCount} líder(es).`)
    return
  }

  if (substituteCount > 4) {
    alert(`ERROR: No puede haber más de 4 suplentes.\nActualmente tienes ${substituteCount} suplente(s).`)
    return
  }

  const assignedGroup = assignGroupAutomatically()

  if (!assignedGroup) {
    alert("ERROR: No hay grupos disponibles. Todos los grupos están llenos.")
    return
  }

  // Create team object
  const team = {
    id: Date.now().toString(),
    name: teamName,
    abbreviation: teamAbbr,
    group: assignedGroup,
    logo: logoImage,
    players: players,
    createdAt: new Date().toISOString(),
    points: 0,
  }

  console.log("[v0] Equipo creado:", team.name, "asignado al grupo:", assignedGroup)

  try {
    const registeredTeams = JSON.parse(localStorage.getItem("registeredTeams")) || []
    registeredTeams.push(team)
    localStorage.setItem("registeredTeams", JSON.stringify(registeredTeams))
    console.log("[v0] Equipo guardado en localStorage:", team.id)
  } catch (error) {
    console.error("[v0] Error al guardar en localStorage:", error)
    alert("ERROR: No se pudo guardar el equipo. Intenta de nuevo.")
    return
  }

  // Sync with admin
  try {
    const syncChannel = new BroadcastChannel("adminSync")
    syncChannel.postMessage({ type: "refresh" })
    console.log("[v0] Mensaje de sync enviado al admin")
  } catch (error) {
    console.warn("[v0] BroadcastChannel no disponible, continuando sin sync")
  }

  showSuccessModal(teamName, assignedGroup)
}

function getRandomAvailableGroup() {
  const registeredTeams = JSON.parse(localStorage.getItem("registeredTeams")) || []
  const groups = { A: 0, B: 0, C: 0, D: 0 }

  registeredTeams.forEach((team) => {
    if (groups.hasOwnProperty(team.group)) {
      groups[team.group]++
    }
  })

  const availableGroups = Object.entries(groups)
    .filter(([group, count]) => count < 4)
    .map(([group]) => group)

  if (availableGroups.length === 0) {
    return null
  }

  return availableGroups[Math.floor(Math.random() * availableGroups.length)]
}

function showSuccessModal(teamName, assignedGroup) {
  const modal = document.getElementById("successModal")
  const message = document.getElementById("successMessage")
  message.textContent = `¡El equipo "${teamName}" ha sido registrado exitosamente en el Grupo ${assignedGroup}! Puedes verlo en el panel de admin.`

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

function redirectToHome() {
  window.location.href = "NVYTorneo.html"
}

function exportTeamToExcel(teamData) {
  if (!XLSX || !XLSX.utils) {
    alert("La librería XLSX no está cargada. Verificando...")
    return
  }

  const workbook = XLSX.utils.book_new()

  // Sheet 1 - Team Information
  const teamInfoData = [
    ["INFORMACIÓN DEL EQUIPO"],
    [],
    ["Nombre", teamData.name || ""],
    ["Abreviación", teamData.abbreviation || ""],
    ["Grupo", teamData.group || ""],
    ["Fecha de Registro", teamData.createdAt ? new Date(teamData.createdAt).toLocaleDateString("es-ES") : ""],
    ["Total de Jugadores", teamData.players ? teamData.players.length : 0],
  ]

  const teamSheet = XLSX.utils.aoa_to_sheet(teamInfoData)
  teamSheet["!cols"] = [{ wch: 25 }, { wch: 30 }]
  XLSX.utils.book_append_sheet(workbook, teamSheet, "Información")

  // Sheet 2 - Players
  const playersData = [
    ["Nombre", "UID", "País", "Teléfono", "Rol", "Bajas", "Asistencias", "Revividas", "Daño Vehículos"],
  ]
  ;(teamData.players || []).forEach((player) => {
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

  const playersSheet = XLSX.utils.aoa_to_sheet(playersData)
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
  XLSX.utils.book_append_sheet(workbook, playersSheet, "Jugadores")

  XLSX.writeFile(workbook, `${teamData.name || "Equipo"}_Roster.xlsx`)
}

function exportAllTeamsToExcel(registeredTeams) {
  if (!registeredTeams || registeredTeams.length === 0) {
    alert("No hay equipos para exportar")
    return
  }

  if (!XLSX || !XLSX.utils) {
    alert("La librería XLSX no está cargada")
    return
  }

  const workbook = XLSX.utils.book_new()

  // Summary sheet
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

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  summarySheet["!cols"] = [{ wch: 20 }, { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 15 }]
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Resumen")

  // Individual team sheets
  registeredTeams.forEach((team) => {
    const teamData = [
      [`EQUIPO: ${team.name || ""}`],
      [`Abreviación: ${team.abbreviation || ""}`],
      [`Grupo: ${team.group || ""}`],
      [],
      ["Nombre", "UID", "País", "Teléfono", "Rol", "Bajas", "Asistencias", "Revividas", "Daño Vehículos"],
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

    const sheet = XLSX.utils.aoa_to_sheet(teamData)
    sheet["!cols"] = [
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
    XLSX.utils.book_append_sheet(workbook, sheet, team.abbreviation || team.name || `Equipo_${team.id}`)
  })

  XLSX.writeFile(workbook, `Todos_los_Equipos_${new Date().toISOString().split("T")[0]}.xlsx`)
}

function assignGroupAutomatically() {
  const registeredTeams = JSON.parse(localStorage.getItem("registeredTeams")) || []
  const groups = { A: 0, B: 0, C: 0, D: 0 } // Changed from 5 groups (A-E) to 4 groups (A-D)

  registeredTeams.forEach((team) => {
    if (groups.hasOwnProperty(team.group)) {
      groups[team.group]++
    }
  })

  // Find all groups that don't have 4 teams yet
  const availableGroups = Object.entries(groups)
    .filter(([group, count]) => count < 4)
    .map(([group]) => group)

  if (availableGroups.length === 0) {
    return null // No groups available
  }

  // Assign to the group with the fewest teams
  const groupCounts = Object.entries(groups).filter(([g]) => availableGroups.includes(g))
  const [assignedGroup] = groupCounts.reduce((prev, curr) => (prev[1] < curr[1] ? prev : curr))

  console.log("[v0] Grupo asignado automáticamente:", assignedGroup)
  return assignedGroup
}

