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

## 🚀 Setup Guide

Getting Speak2Craft up and running is straightforward. Follow these steps to go from zero to voice-controlling your Minecraft server:

### Step 1: Prepare Your Environment

First, copy the environment template and open it for editing:

```bash
# Copy the template
cp env.example .env

# Edit with your details
nano .env
```

### Step 2: Configure Your Settings

Fill out your `.env` file with the following essential settings:

```bash
# Security - Generate a strong random secret
HMAC_SECRET=your_super_secret_key_here

# AI Integration - Get from OpenAI dashboard
OPENAI_API_KEY=sk-your-openai-key-here

# Minecraft Server Connection
RCON_HOST=your-minecraft-server.com
RCON_PORT=25575
RCON_PASSWORD=your_rcon_password

# Player Mappings (device → Minecraft username)
PLAYER_EISLEY=your_minecraft_username
PLAYER_JON=another_player_name
DEFAULT_PLAYER=fallback_username

# Server Settings (defaults work for most setups)
PORT=3000
HOST=0.0.0.0
LOG_LEVEL=info
```

**Player mapping explained**: Each device that will send voice commands needs to be mapped to a Minecraft username. For example:
- `PLAYER_EISLEY=.BabyBear1234` means when Eisley's device sends commands, they affect the JonMagic player in-game
- `PLAYER_JON=jonmagic` means Mom's phone controls the SteveMiner player
- `DEFAULT_PLAYER=jonmagic` is used when a device isn't specifically mapped

### Step 3: Start the Server

With your configuration ready, start Speak2Craft using Docker:

```bash
# Build and start in the background
docker-compose up -d

# Watch the logs to ensure everything is working
docker-compose logs -f speak2craft
```

You should see logs indicating successful connection to your Minecraft server via RCON.

### Step 4: Set Up Siri Shortcuts

Now configure your voice assistant to send commands to Speak2Craft:

<img width="2116" height="2790" alt="Siri Shortcut" src="https://github.com/user-attachments/assets/ba3f2ba0-ba04-470f-b903-d2938889ecca" />

**For iOS Siri Shortcuts:**
1. Create a new shortcut in the Shortcuts app
2. Add "Get Contents of URL" action
3. Set the URL to `http://your-server:3000/voice`
4. Configure HMAC signature generation (see screenshot above)
5. Add your preferred voice trigger phrase

**For other voice assistants**, use similar webhook configurations with HMAC authentication support.

### Step 5: Test Your Setup

Try your first voice command! Say something like _"Give me bread"_ to your voice assistant. You should see the command appear in your server logs, and 5 bread items should appear in your Minecraft inventory with an in-game confirmation message.

If something isn't working, check the troubleshooting section below for common solutions.

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
