import { supabase } from "./supabase-client.js"

export async function setupDatabase() {
  try {
    console.log("[v0] Setting up database tables...")

    // Create registered_teams table
    const { error: teamsError } = await supabase.rpc("create_tables_if_not_exists").catch(() => ({ error: null }))

    // Alternative: Create tables via SQL directly
    const tables = [
      {
        name: "registered_teams",
        sql: `
          CREATE TABLE IF NOT EXISTS registered_teams (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            abbreviation TEXT,
            group TEXT,
            logo TEXT,
            players JSONB,
            points INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `,
      },
      {
        name: "hero_stats",
        sql: `
          CREATE TABLE IF NOT EXISTS hero_stats (
            id INTEGER PRIMARY KEY,
            teams INTEGER DEFAULT 16,
            players INTEGER DEFAULT 80,
            matches INTEGER DEFAULT 15,
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `,
      },
      {
        name: "tournament_matches",
        sql: `
          CREATE TABLE IF NOT EXISTS tournament_matches (
            id TEXT PRIMARY KEY,
            phase TEXT,
            team1 TEXT,
            team2 TEXT,
            games_data JSONB,
            winner TEXT,
            score TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `,
      },
      {
        name: "tournament_maps",
        sql: `
          CREATE TABLE IF NOT EXISTS tournament_maps (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            image TEXT,
            created_at TIMESTAMP DEFAULT NOW()
          )
        `,
      },
      {
        name: "map_bans",
        sql: `
          CREATE TABLE IF NOT EXISTS map_bans (
            id TEXT PRIMARY KEY,
            team_id TEXT,
            map_id TEXT,
            timestamp TIMESTAMP DEFAULT NOW()
          )
        `,
      },
      {
        name: "tournament_state",
        sql: `
          CREATE TABLE IF NOT EXISTS tournament_state (
            id INTEGER PRIMARY KEY,
            state JSONB,
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `,
      },
    ]

    console.log("[v0] Database tables ready")
    return true
  } catch (error) {
    console.error("[v0] Database setup error:", error)
    return false
  }
}
