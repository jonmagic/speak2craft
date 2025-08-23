# Speak2Craft

🎙️ **Transform your voice into Minecraft magic!**

Control your Minecraft server using natural language voice commands through Siri (or any voice assistant). Say "give me bread" and watch as 5 loaves appear in your inventory with in-game confirmation!

## 🌟 What Can You Do?

### 🎒 Item Management
- **Give yourself items**: _"Give me 10 torches"_ → Instantly receive torches with visual confirmation
- **Smart item recognition**: Say _"diamond pick"_ and get a `diamond_pickaxe`
- **Automatic quantities**: Request _"bread"_ and get 5 loaves (sensible defaults)
- **Item validation**: Invalid items suggest similar alternatives
- **Full Minecraft catalog**: Support for 1,100+ valid Minecraft items

### ⚡ Player Powers
- **God mode**: _"Turn on god mode"_ → Become invincible
- **Flight**: _"Let me fly"_ → Soar through your world
- **Toggle abilities**: Commands work as toggles (on/off)

### 🏠 Teleportation & Homes
- **Set home locations**: _"Set home base"_ → Save your current location
- **Teleport home**: _"Go to base"_ → Instantly return to saved locations
- **Teleport to coordinates**: _"Teleport to spawn"_ → Move anywhere
- **Teleport to players**: _"TP to Steve"_ → Join other players

### 💬 Smart Communication
- **In-game feedback**: Every action shows visual confirmation in Minecraft
- **Voice responses**: Siri speaks back what happened: _"I gave you 5 bread and a diamond pickaxe"_
- **Error handling**: Clear explanations when things go wrong
- **Natural language**: No need to learn command syntax

### 👥 Multi-Player Support
- **Device mapping**: Each phone/device maps to a Minecraft username
- **Player targeting**: _"Give Steve some bread"_ → Items go to specific players
- **Default fallbacks**: Commands work even without device mapping

## 🎯 Example Voice Commands

```
"Give me bread"                    → 5 bread + confirmation
"I need a diamond pickaxe"         → 1 diamond_pickaxe + confirmation
"Turn on god mode"                 → Invincibility enabled + confirmation
"Let me fly"                       → Flight enabled + confirmation
"Give me 32 stone blocks"          → Exact quantity delivered
"Set home at base"                 → Home location saved
"Take me home"                     → Teleport to saved home
"Give Jon some food"               → Items delivered to specific player
"Turn off flight"                  → Ability disabled
```

## 🚀 Quick Start

### Docker Setup (Recommended)
```bash
# Copy environment template
cp env.example .env

# Edit with your server details
nano .env

# Build and start
docker-compose up -d

# View real-time logs
docker-compose logs -f speak2craft
```

### Development Setup
```bash
# Install dependencies
pnpm install

# Set up environment
cp env.example .env
nano .env

# Start development server
pnpm dev
```

## ⚙️ Configuration

### Essential Settings (`.env`)
```bash
# Security
HMAC_SECRET=your_super_secret_key_here

# AI Integration
OPENAI_API_KEY=sk-your-openai-key-here

# Minecraft Server Connection
RCON_HOST=your-minecraft-server.com
RCON_PORT=25575
RCON_PASSWORD=your_rcon_password

# Player Mappings (device → Minecraft username)
PLAYER_EISLEY=your_minecraft_username
PLAYER_JON=another_player_name
DEFAULT_PLAYER=fallback_username

# Server Settings
PORT=3000
HOST=0.0.0.0
LOG_LEVEL=info
```

### Player Device Mapping
Map your devices to Minecraft usernames:
- `PLAYER_EISLEY=JonMagic` → Eisley's device controls JonMagic in-game
- `PLAYER_MOM=SteveMiner` → Mom's phone controls SteveMiner
- `DEFAULT_PLAYER=Admin` → Fallback for unmapped devices

## 🔌 API Reference

### Health Check
```http
GET /healthz
GET /healthz?checkRcon=1  # Include RCON connectivity test
```

### Voice Commands
```http
POST /voice
Content-Type: application/json
X-Signature: <HMAC-SHA256>

{
  "utterance": "give me bread",
  "deviceUser": "eisley"  # optional
}
```

### Testing Mode
```http
POST /voice?dryRun=1  # Generate commands without executing
```

## 🏗️ Architecture

```
Voice Input (Siri)
    ↓
HMAC Authentication
    ↓
Natural Language Processing (OpenAI GPT-4)
    ↓
Item Validation (1,100+ items)
    ↓
RCON Command Execution
    ↓
Minecraft Server + In-game Feedback
```

## 🛡️ Security Features

- **HMAC Authentication**: Cryptographic signatures prevent unauthorized access
- **Input Validation**: All items validated against official Minecraft catalog
- **Rate Limiting**: Built-in protections against abuse
- **Error Handling**: Graceful degradation when services are unavailable
- **Logging**: Comprehensive audit trail of all actions

## 🎮 Supported Minecraft Commands

| Category | Commands | Example Voice |
|----------|----------|---------------|
| **Items** | `give` | _"Give me 10 torches"_ |
| **Abilities** | `god`, `fly` | _"Turn on god mode"_ |
| **Teleport** | `tp` | _"Teleport to spawn"_ |
| **Homes** | `sethome`, `home` | _"Set home base"_ |
| **Messages** | `tellraw` | _Automatic confirmations_ |

## 📱 Voice Assistant Setup

### Siri Shortcuts (iOS)
1. Create new shortcut
2. Add "Get Contents of URL" action
3. Set URL to your server's `/voice` endpoint
4. Configure HMAC signature generation
5. Add voice trigger phrase

### Google Assistant / Alexa
Similar webhook configuration with HMAC authentication support.

## 🧪 Development & Testing

```bash
# Run with live reload
pnpm dev

# Test command generation without execution
curl -X POST http://localhost:3000/voice?dryRun=1 \
  -H "Content-Type: application/json" \
  -H "X-Dev-Bypass: 1" \
  -d '{"utterance": "give me bread"}'

# Check server health + RCON
curl http://localhost:3000/healthz?checkRcon=1

# View logs
tail -f tmp/log.txt
```

## 🔧 Troubleshooting

- **"Invalid signature"**: Check HMAC_SECRET configuration
- **"Item not found"**: Use `/voice?dryRun=1` to test item recognition
- **"RCON connection failed"**: Verify Minecraft server settings
- **No in-game feedback**: Check RCON permissions and server status

## 📄 License

MIT License - Use it, modify it, share it!
