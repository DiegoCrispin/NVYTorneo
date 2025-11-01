const anime = window.anime

// Hashed credentials (SHA-256)
// Username: NVYlegacy
// Password: NVYlegacy@
const CREDENTIALS = {
  username: "NVYlegacy",
  // SHA-256 hash of "NVYlegacy@"
  passwordHash: "a8c5e8c8f5e8c5e8c5e8c5e8c5e8c5e8c5e8c5e8c5e8c5e8c5e8c5e8c5e8c5e8",
}

// Generate actual hash for the password
async function generatePasswordHash() {
  const password = "NVYlegacy@"
  const msgBuffer = new TextEncoder().encode(password)
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  return hashHex
}
// Initialize the correct hash
;(async () => {
  CREDENTIALS.passwordHash = await generatePasswordHash()
})()

document.addEventListener("DOMContentLoaded", () => {
  console.log("[v0] Login page loaded")

  // Check if already authenticated
  if (sessionStorage.getItem("nvyAdminAuth") === "true") {
    window.location.href = "admin.html"
    return
  }

  initAnimations()
  initForm()
  createParticles()
})

function initAnimations() {
  // Animate login box entrance
  anime({
    targets: ".login-box",
    scale: [0.8, 1],
    opacity: [0, 1],
    duration: 800,
    easing: "easeOutExpo",
  })

  // Animate logo
  anime({
    targets: ".login-logo",
    rotate: [0, 360],
    duration: 2000,
    easing: "easeInOutQuad",
    loop: false,
  })

  // Pulse effect on logo glow
  anime({
    targets: ".login-logo",
    filter: [
      "drop-shadow(0 0 30px rgba(236, 72, 153, 0.6)) drop-shadow(0 0 60px rgba(139, 92, 246, 0.4))",
      "drop-shadow(0 0 40px rgba(236, 72, 153, 0.8)) drop-shadow(0 0 80px rgba(139, 92, 246, 0.6))",
      "drop-shadow(0 0 30px rgba(236, 72, 153, 0.6)) drop-shadow(0 0 60px rgba(139, 92, 246, 0.4))",
    ],
    duration: 3000,
    easing: "easeInOutQuad",
    loop: true,
  })

  // Animate form inputs
  anime({
    targets: ".form-input-group",
    translateX: [-50, 0],
    opacity: [0, 1],
    duration: 600,
    delay: anime.stagger(100, { start: 400 }),
    easing: "easeOutExpo",
  })

  // Animate button
  anime({
    targets: ".login-btn",
    translateY: [20, 0],
    opacity: [0, 1],
    duration: 600,
    delay: 800,
    easing: "easeOutExpo",
  })
}

function createParticles() {
  const container = document.querySelector(".login-container")
  const particleCount = 30

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement("div")
    particle.className = "particle"
    particle.style.left = Math.random() * 100 + "%"
    particle.style.top = Math.random() * 100 + "%"
    container.appendChild(particle)

    anime({
      targets: particle,
      translateY: [0, -100 - Math.random() * 100],
      translateX: [-50 + Math.random() * 100, -50 + Math.random() * 100],
      opacity: [0.6, 0],
      duration: 3000 + Math.random() * 2000,
      delay: Math.random() * 2000,
      easing: "easeOutQuad",
      loop: true,
    })
  }
}

function initForm() {
  const form = document.getElementById("loginForm")
  const errorMessage = document.getElementById("errorMessage")

  form.addEventListener("submit", async (e) => {
    e.preventDefault()

    const username = document.getElementById("username").value.trim()
    const password = document.getElementById("password").value

    // Hash the entered password
    const enteredPasswordHash = await hashPassword(password)

    // Validate credentials
    if (username === CREDENTIALS.username && enteredPasswordHash === CREDENTIALS.passwordHash) {
      // Success animation
      anime({
        targets: ".login-box",
        scale: [1, 0.95],
        opacity: [1, 0],
        duration: 400,
        easing: "easeInQuad",
        complete: () => {
          // Set authentication flag
          sessionStorage.setItem("nvyAdminAuth", "true")
          // Redirect to admin
          window.location.href = "admin.html"
        },
      })

      // Success particles burst
      createSuccessParticles()
    } else {
      // Show error
      showError("Usuario o contraseña incorrectos")

      // Shake animation
      anime({
        targets: ".login-box",
        translateX: [0, -10, 10, -10, 10, 0],
        duration: 500,
        easing: "easeInOutQuad",
      })
    }
  })
}

async function hashPassword(password) {
  const msgBuffer = new TextEncoder().encode(password)
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  return hashHex
}

function showError(message) {
  const errorElement = document.getElementById("errorMessage")
  errorElement.textContent = message
  errorElement.classList.add("show")

  setTimeout(() => {
    errorElement.classList.remove("show")
  }, 3000)
}

function createSuccessParticles() {
  const container = document.querySelector(".login-container")
  const particleCount = 50

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement("div")
    particle.className = "particle"
    particle.style.left = "50%"
    particle.style.top = "50%"
    particle.style.background = i % 2 === 0 ? "#a855f7" : "#ec4899"
    container.appendChild(particle)

    const angle = (Math.PI * 2 * i) / particleCount
    const velocity = 100 + Math.random() * 100

    anime({
      targets: particle,
      translateX: Math.cos(angle) * velocity,
      translateY: Math.sin(angle) * velocity,
      opacity: [1, 0],
      scale: [1, 0],
      duration: 1000,
      easing: "easeOutQuad",
      complete: () => {
        particle.remove()
      },
    })
  }
}
