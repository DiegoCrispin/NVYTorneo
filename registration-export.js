// Import the XLSX library
const XLSX = require("xlsx")

// Add this to your registro-equipo.js

function exportTeamToExcel(teamData) {
  if (!window.XLSX || !window.XLSX.utils) {
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

// Export all registered teams to Excel
function exportAllTeamsToExcel(registeredTeams) {
  if (!registeredTeams || registeredTeams.length === 0) {
    alert("No hay equipos para exportar")
    return
  }

  if (!window.XLSX || !window.XLSX.utils) {
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
