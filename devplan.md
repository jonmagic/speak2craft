# Siri → LLM → Minecraft: Step-by-Step Build Plan

## Tech choices (locked for this plan)

* Server: Node.js (TypeScript), fastify, pnpm
* Model: OpenAI (use `generateObject` / JSON Schema via Vercel AI SDK)
* Minecraft bridge: RCON
* Transport security: HTTPS + shared-secret HMAC
* Voice: Apple Shortcuts (Siri)

---

## ✅ 0) Repo + skeleton (COMPLETE)

**Goal:** Have a runnable HTTP service with healthcheck and structured logs.

**What was built:**

1. ✅ `pnpm init` with dependencies: `typescript`, `ts-node`, `zod`, `@ai-sdk/openai`, `ai`, `pino`, `pino-pretty`, `dotenv`, `fastify`
2. ✅ `src/server.ts` with:
   * `GET /healthz` → returns `{ok:true, ts:<epoch>}`
   * `POST /voice` → accepts `{ utterance: string, deviceUser?: string }` with full processing pipeline
   * Pino logging with request id, dual output (file + pretty console)
3. ✅ `.env` configuration for `PORT`, `HMAC_SECRET`, `OPENAI_API_KEY`, `RCON_*`, player mappings

**Debug verified:**
* ✅ `curl localhost:3000/healthz` → `{"ok":true,...}`
* ✅ `curl -XPOST /voice -d '{"utterance":"give me bread"}'` → full LLM processing + validation

---

## ✅ 1) Request authentication (COMPLETE)

**Goal:** Only Siri Shortcut requests are accepted.

**What was built:**

1. ✅ HMAC header check middleware with SHA256 + base64
   * Compute `sig = base64(hmacSHA256(body, HMAC_SECRET))`
   * Require header `X-Signature: <sig>`
   * Dev bypass via `X-Dev-Bypass: 1` for LAN testing
2. ✅ Security: Invalid signatures → `401`

**Debug verified:**
* ✅ `curl` without header → `401`
* ✅ `curl` with header (computed locally) → `200`
* ✅ Dev bypass works for local testing

---

## ✅ 2) Siri Shortcut integration (COMPLETE)

**Goal:** Use Siri to hit your server and get conversational responses.

**What was built:**

1. ✅ Siri Shortcut "Ask Minecraft":
   * Action 1: **Dictate Text** → variable `speech`
   * Action 2: **Get Contents of URL** (POST JSON) to server
   * JSON body: `{ "utterance": speech, "deviceUser": "device_identifier" }`
   * Headers: `Content-Type: application/json`, `X-Signature: <computed>`
2. ✅ Response flows back to Siri for voice feedback

**Debug verified:**
* ✅ Say: "ask minecraft for bread" → Siri speaks back the result
* ✅ Server processes natural language and responds with user-friendly messages

**TODO:** Improve LLM response formatting to be more conversational for Siri readback

---

## ✅ 3) Player/device mapping (COMPLETE)

**Goal:** Map device identifiers to Minecraft usernames securely.

**What was built:**

1. ✅ Environment-based player configuration in `src/players.ts`:
   * `PLAYER_EISLEY=.BabyBear1234` (device → minecraft username mapping)
   * `PLAYER_JONMAGIC=jonmagic` 
   * `DEFAULT_PLAYER=jonmagic` (fallback for unknown devices)
2. ✅ Privacy-first: No player names in code/config files
3. ✅ Dynamic loading from environment variables

**Debug verified:**
* ✅ Device user resolution working
* ✅ Fallback to default player when device unknown
* ✅ OSS-ready (no real usernames exposed)

---

## ✅ 4) Canonical item dictionary + validation (COMPLETE)

**Goal:** Deterministic item validation against official Minecraft items.

**What was built:**

1. ✅ Complete Minecraft items list in `config/items.csv` (1129+ items)
2. ✅ `src/items.ts` with validation functions:
   * `loadItemList()` - loads CSV into memory for O(1) lookups
   * `isValidItem()` - validates individual items
   * `findSimilarItems()` - suggests alternatives for typos
   * `validateItems()` - validates entire request with detailed feedback
3. ✅ Integration with main pipeline for item validation

**Debug verified:**
* ✅ Valid items pass through
* ✅ Invalid items return helpful suggestions
* ✅ Quantity validation (1-64 range)

---

## ✅ 5) LLM-powered command generation (COMPLETE)

**Goal:** Handle free-form natural language and generate appropriate Minecraft commands.

**What was built:**

1. ✅ `src/nlp.ts` using Vercel AI SDK's `generateObject` with Zod schema:
   ```ts
   const CommandGenerationSchema = z.object({
     commands: z.array(z.string()).describe('Array of RCON commands to execute'),
     reasoning: z.string().describe('Brief explanation of what was interpreted'),
     itemsRequested: z.array(z.object({
       itemName: z.string(),
       quantity: z.number().int().min(1).max(64),
       player: z.string()
     }))
   })
   ```

2. ✅ **Expanded command set beyond just `give`:**
   * `give <player> <item> <quantity>` - Give items to player
   * `god <player>` - Toggle invincibility 
   * `fly <player>` - Toggle flight
   * `sethome <player> <name>` - Set home location
   * `home <player> <name>` - Teleport to home
   * `tp <player> <target/coordinates>` - Teleport player
   * `tellraw <player> <message>` - Send messages

3. ✅ Smart system prompt with item knowledge and command rules
4. ✅ Player name substitution and context awareness

**Debug verified:**
* ✅ "give me bread" → `["give jonmagic bread 5"]` + validation
* ✅ "turn on god mode" → `["god jonmagic"]` (no items to validate)
* ✅ "let me fly" → `["fly jonmagic"]`
* ✅ Complex requests: "give me a snack and a pickaxe" → multiple commands

**TODO:** Improve `reasoning` field to be more conversational for Siri responses

---

## ✅ 6) Complete processing pipeline (COMPLETE)

**Goal:** End-to-end request processing with validation and error handling.

**What was built:**

1. ✅ Full `/voice` endpoint pipeline:
   * Request validation (utterance required)
   * Player resolution from device mapping
   * LLM command generation
   * Item validation (if applicable)
   * Structured JSON response with success/failure states
   
2. ✅ Error handling with user-friendly messages:
   * Invalid items → suggestions returned
   * Missing utterance → clear error
   * LLM failures → graceful fallback
   
3. ✅ Rich logging throughout for debugging
4. ✅ Response format optimized for both debugging and Siri

**Debug verified:**
* ✅ Full pipeline working end-to-end
* ✅ Error cases handled gracefully
* ✅ Logging provides good debugging info

---

## 🔄 7) RCON client implementation (TODO - NEXT STEP)

**Goal:** Execute commands on actual Minecraft server via RCON.

**Currently:** Commands are generated and validated but not executed (returns `dryRun: true`)

**TODO:**

1. Add `rcon-client` package or implement TCP RCON wrapper
2. Environment config already in place:
   ```
   RCON_HOST=minecraft.server.com
   RCON_PORT=25575
   RCON_PASSWORD=your_password
   ```
3. Update `/voice` handler to execute commands when not in dry-run mode
4. Add RCON response logging and error handling
5. Add query parameter `?dryRun=1` to bypass execution for testing

**Debug plan:**
* `?dryRun=1` → current behavior (return commands without executing)
* Live request → connect to RCON, execute commands, capture responses
* Error handling for RCON connection failures

---

## 📋 8) UX improvements (PLANNED)

**Goal:** Better user experience both in Siri and in-game.

**TODO:**

1. **Conversational LLM responses:** Update the `reasoning` field in `generateCommands()` to return more natural language suitable for Siri to speak back
   * Instead of: "Brief explanation of what was interpreted"  
   * Return: "I gave you 5 bread and 1 diamond pickaxe" or "I turned on god mode for you"

2. **In-game feedback:** Add `tellraw` commands for user confirmation:
   * After successful item grants: `tellraw <player> {"text":"Delivered: bread x5, diamond_pickaxe x1","color":"green"}`
   * After mode changes: `tellraw <player> {"text":"God mode enabled","color":"yellow"}`

3. **Error feedback:** For policy/validation failures, send helpful `tellraw` messages explaining why the request was denied

**Debug plan:**
* Test Siri responses sound natural when spoken
* Verify in-game messages appear correctly
* Test error cases provide clear guidance

---

## 🚀 9) Production deployment (FUTURE)

**Goal:** Deploy securely with HTTPS and proper HMAC in Siri shortcuts.

**TODO:**

1. Remove `X-Dev-Bypass` middleware
2. Deploy server with HTTPS endpoint
3. Update Siri shortcut to use production URL with real HMAC computation
4. Add rate limiting and additional security measures
5. Consider adding authentication logs and monitoring

---

## Notes for OSS Release

* ✅ All real usernames replaced with example values (`.BabyBear1234`, `jonmagic`)
* ✅ Environment-based configuration keeps sensitive data out of code
* ✅ Comprehensive `env.example` file provided
* ✅ Privacy-first design suitable for public release