# Siri → LLM Voice-to-Minecraft Bridge

## Current Status: Step 3 ✅ COMPLETED - Ready for Step 4

---

## 0) Repo + skeleton ✅ COMPLETED

**Goal:** Have a runnable HTTP service with healthcheck and structured logs.

**Do**

1. `p**Debug**

* **Goal:** Shortcut waits f* ---d request**Debug**

* `curl` with "give me bread" → LLM generates `["give player bread 5"]` → v**Debug**

* Make 2 quick requests → 2nd should 429 with "cooldown" message
* Request commands for non-whitelisted player → rejection with helpful error
* Try `/give` with invalid item → command filtered out with item validation error
* Try `/god` command twice quickly → second request gets longer cooldown message
* Request with excessive item count → count clamped to policy limitsation passes
* `curl` with "give me unicorn" → LLM generates `["give player unicorn 1"]` → validation fails with "Sorry, 'unicorn' is not a valid Minecraft item"
* `curl` with "turn on god mode" → LLM generates `["god player"]` → validation passes
* `curl` with "let me fly" → LLM generates `["fly player"]` → validation passes
* `curl` with "teleport me home" → LLM generates `["home player"]` → validation passes
* Add logs showing: utterance → LLM commands → validation resultsiri speaks: "Delive**Debug**

*## 7) RCON plumbing (dry-run first)

**Goal:** Execute validated LLM-generated commands via RCON, with dry-run testing.

**Do**

1. Update RCON execution pipeline:
   * Take validated commands from steps 4-6 (LLM → item validation → policy enforcement)
   * For each command, ensure proper formatting for RCON
   * Add automatic `tellraw` notifications for successful `give` commands

2. For now, **don't** send to the server; just return:

   ```json
   { "commands": ["give .BabyBear1234 bread 5", "tellraw .BabyBear1234 {\"text\":\"You received: bread x5\",\"color\":\"green\"}"], "dryRun": true }
   ```

3. Command formatting:
   * Ensure player names are properly escaped
   * Validate command syntax before queuing
   * Generate user-friendly notificationsequests → 2nd should 429 with "cooldown" message
* Request commands for non-whitelisted player → rejection with helpful error
* LLM tries to generate non-`give` command → command filtered out with explanation
* Request with excessive item count → count clamped to policy limits bread x5"
* Invalid item → Siri speaks: "Sorry, 'unicorn' is not a valid Minecraft item. Try: bread, diamond_pickaxe, torch, etc."
* Server error → Siri speaks: "Sorry, the Minecraft server is currently unavailable" server response and speaks results back to user.*Goal:** Shortcut waits for server response and speaks results back to user.curl` with "give me bread" → LLM generates `["give player bread 5"]` → validation passes
* `curl` with "give me unicorn" → LLM generates `["give player unicorn 1"]` → validation fails with "Sorry, 'unicorn' is not a valid Minecraft item"
* Add logs showing: utterance → LLM commands → validation resultsinit`. Add `typescript`, `ts-node`, `zod`, `@ai-sdk/openai`, `ai`, `pino`, `dotenv`, `fastify` (or `express`). ✅
2. Create `src/server.ts` with: ✅
   * `GET /healthz` → returns `{ok:true, ts:<epoch>}` ✅
   * `POST /voice` → accepts `{ utterance: string, deviceUser?: string }` and just echoes back. ✅
   * Fastify logging with request id. ✅
3. `.env` for `PORT`, `HMAC_SECRET`, `OPENAI_API_KEY`. ✅

**Debug**

* `curl localhost:3000/healthz` → `{"ok":true,"ts":1755917630001}` ✅
* `curl -XPOST /voice -d '{"utterance":"give me bread"}'` → `{"received":{"utterance":"give me bread"},"ts":1755917638089}` ✅

**Status:** STABLE ✅

---

## 1) Request authentication (simple HMAC) ✅ COMPLETED

**Goal:** Only Siri Shortcut requests are accepted.

**Do**

1. Add an HMAC header check middleware: ✅
   * Compute `sig = base64(hmacSHA256(body, HMAC_SECRET))`. ✅
   * Require header `X-Signature: <sig>`. ✅
2. If invalid → `401`. ✅

**Debug**

* `curl` without header → `{"error":"Missing signature"}` ✅
* `curl` with header (computed locally) → `{"received":{"utterance":"give me bread"},"ts":1755917866371}` ✅
* `curl` with invalid signature → `{"error":"Invalid signature"}` ✅
* Dev bypass with `X-Dev-Bypass: 1` works for LAN testing ✅

**Status:** STABLE ✅

---

## 2) Siri Shortcut (local-only first) ✅ COMPLETED

**Goal:** Use Siri to hit your server.

**Do**

1. In Shortcuts app, make "Ask Minecraft": ✅
   * Action 1: **Dictate Text** → variable `speech`. ✅
   * Action 2: **Get Contents of URL** (POST JSON) to `http://<lan-ip>:3000/voice`. ✅
     * JSON body: `{ "utterance": magic: speech, "deviceUser": "adalyn_iphone" }` ✅
     * Headers: `Content-Type: application/json`, `X-Dev-Bypass: 1` ✅
2. Response shows in Shortcut. ✅

**Debug**

* Say: "10 blocks" → Server logs: `{"utterance":"10 blocks","msg":"Voice request received"}` ✅
* Dev bypass working: `{"msg":"Using dev bypass - should only be used on LAN"}` ✅
* Response time: 13ms ✅

**Status:** STABLE ✅

[Siri Shortcut Screenshot](https://share.cleanshot.com/nfxTycMG)

---

## Tech choices (locked for this plan)

* Server: Node.js (TypeScript), Express, pnpm
* Model: OpenAI (use `generateObject` / JSON Schema via Vercel AI SDK)
* Minecraft bridge: RCON
* Transport security: HTTPS + shared-secret HMAC
* Voice: Apple Shortcuts (Siri)

---

## 0) Repo + skeleton

**Goal:** Have a runnable HTTP service with healthcheck and structured logs.

**Do**

1. `pnpm init`. Add `typescript`, `ts-node`, `zod`, `@ai-sdk/openai`, `ai`, `pino`, `dotenv`, `fastify` (or `express`).
2. Create `src/server.ts` with:

   * `GET /healthz` → returns `{ok:true, ts:<epoch>}`
   * `POST /voice` → accepts `{ utterance: string, deviceUser?: string }` and just echoes back.
   * Pino logging with request id.
3. `.env` for `PORT`, `HMAC_SECRET`, `AZURE_OPENAI_*`.

**Debug**

* `curl localhost:3000/healthz` → `{"ok":true,...}`
* `curl -XPOST /voice -d '{"utterance":"give me bread"}'` → echo payload in response + server logs show JSON.

**Don’t continue** until this is stable.

---

## 1) Request authentication (simple HMAC)

**Goal:** Only Siri Shortcut requests are accepted.

**Do**

1. Add an HMAC header check middleware:

   * Compute `sig = base64(hmacSHA256(body, HMAC_SECRET))`.
   * Require header `X-Signature: <sig>`.
2. If invalid → `401`.

**Debug**

* `curl` without header → `401`.
* `curl` with header (computed locally) → `200`.

---

## 2) Siri Shortcut (local-only first)

**Goal:** Use Siri to hit your server.

**Do**

1. In Shortcuts app, make “Ask Minecraft”:

   * Action 1: **Dictate Text** → variable `speech`.
   * Action 2: **Get Contents of URL** (POST JSON) to `http://<lan-ip>:3000/voice`.

     * JSON body: `{ "utterance": magic: speech, "deviceUser": "adalyn_iphone" }`
     * Headers: `Content-Type: application/json`, `X-Signature: <computed via a small Scriptable or precomputed dev value for now>`. (For now, set server to accept a secondary dev header `X-Dev-Bypass: 1` behind LAN.)
2. Response shows in Shortcut.

**Debug**

* Say: “ask minecraft for bread”.
* Shortcut result mirrors what server received.

> Later, replace LAN with HTTPS and real HMAC (Step 10).

---

## 3) Player/device mapping ✅ COMPLETED (Updated to use .env)

**Goal:** Map `deviceUser` → Minecraft username(s) via environment variables.

**Do**

1. Add player mappings to `.env`: ✅
   ```env
   # Player device to Minecraft username mappings
   PLAYER_EISLEY=.BabyBear1234
   PLAYER_JON=jonmagic
   DEFAULT_PLAYER=.BabyBear1234
   ```

2. Update `env.example` with placeholder values: ✅
   ```env
   # Player device to Minecraft username mappings
   PLAYER_EISLEY=your_minecraft_username
   PLAYER_JON=another_minecraft_username
   DEFAULT_PLAYER=default_minecraft_username
   ```

3. Update `src/players.ts` to read from environment variables instead of YAML: ✅

**Debug**

* `POST /voice` with `deviceUser: "eisley"` returns `targetPlayer: ".BabyBear1234"` ✅
* `POST /voice` with `deviceUser: "jon"` returns `targetPlayer: "jonmagic"` ✅
* `POST /voice` with unknown/missing `deviceUser` returns `targetPlayer: ".BabyBear1234"` (default) ✅
* No sensitive usernames committed to code ✅

**Status:** STABLE ✅

---

---

## 4) LLM command generation with item validation

**Goal:** LLM interprets utterances and generates RCON commands, with validation against the item list.

**Do**

1. Add `src/nlp.ts` using Vercel AI SDK's `generateObject` to interpret utterances into RCON commands:

   ```ts
   const schema = {
     type: "object",
     properties: {
       commands: {
         type: "array",
         items: {
           type: "string",
           pattern: "^(give|god|fly|sethome|home|tp|tellraw)\\s*.*$"  // Commands you actually use
         }
       },
       reasoning: {
         type: "string",
         description: "Brief explanation of what was interpreted from the user's request"
       },
       itemsRequested: {
         type: "array",
         items: {
           type: "object",
           properties: {
             itemName: { type: "string" },
             quantity: { type: "integer", minimum: 1, maximum: 64 },
             player: { type: "string" }
           },
           required: ["itemName", "quantity", "player"]
         }
       }
     },
     required: ["commands", "itemsRequested"],
     additionalProperties: false,
   };
   ```

2. System prompt instructs LLM to:
   * Convert natural language to valid RCON commands
   * Use these commands: `/give` (items), `/god` (invincibility), `/fly` (flight), `/sethome` (save location), `/home` (teleport to saved location), `/tp` (teleport to coordinates/player)
   * Use reasonable default quantities for items (bread=5, tools=1, blocks=16, etc.)
   * Target the requesting player by default
   * Only generate commands for actions clearly requested by the user

3. Add `src/items.ts` to validate generated commands:
   * Load `config/items.csv` into a Set of valid item names
   * Use the `itemsRequested` array from LLM response for validation (only applies to `/give` commands)
   * Cross-reference each `itemName` against the CSV list for `/give` commands
   * For non-item commands (`/god`, `/fly`, `/home`, etc.), validate command structure but skip item validation
   * Return helpful error messages for invalid items with suggestions
   * Validate that commands match the expected items

4. Pipeline for `/voice`:
   * Call LLM to generate structured response with commands and itemsRequested
   * Validate each item in `itemsRequested` against items.csv
   * Cross-validate that `commands` array matches the `itemsRequested` items
   * If validation fails, return user-friendly error message with item suggestions
   * If valid, proceed with validated commands

**Debug**

* Unit tests: “give me 10 torches” → `torch x10`.
* “I want wings” → `elytra x1`.

---

## 5) Enhanced Shortcut with voice response

**Goal:** Handle free-form (“a snack and a pickaxe for me and my friend”) reliably.

**Do**

1. Add `src/nlp.ts` using Vercel AI SDK’s `generateObject` with **JSON Schema**:

   1. Update Siri Shortcut "Ask Minecraft":
   * Keep existing: **Dictate Text** → variable `speech`
   * Keep existing: **Get Contents of URL** (POST to server)
   * **NEW:** Add **Speak Text** action using the server response
   * **NEW:** Add error handling for failed requests

2. Server response format:
   * Success: `{"success": true, "message": "Delivered: bread x5", "commands": ["give player bread 5"]}`
   * Error: `{"success": false, "message": "Sorry, 'unicorn' is not a valid Minecraft item. Try: bread, diamond_pickaxe, torch, etc."}`
2. System prompt includes your **item dictionary** (names + ids + synonyms) and strict rules:

   * Only output items that exist in the provided dictionary.
   * If unknown, omit and add `notes` field explaining omission (optional).
3. Pipeline for `/voice`:

   * Try `matchItems` (dict). If empty/partial → call LLM to fill missing fields.
   * Normalize: for each item, map to `id` from dictionary; apply counts; drop unknowns.

**Debug**

* `curl` with “a snack and a pickaxe” → returns `bread x5`, `diamond_pickaxe x1`.
* Add logs showing: raw text → dict hits → llm output → normalized plan.

---

## 6) Safety rails (command validation & limits)

**Goal:** Prevent abuse or accidents in generated RCON commands.

**Do**

1. `config/policy.yml`:

   ```yml
   maxCommandsPerRequest: 5
   maxItemCountPerCommand: 64
   allowedCommands: [give, god, fly, sethome, home, tp, tellraw]
   requirePlayerWhitelist: true
   playerWhitelist: [.BabyBear1234, jonmagic]
   cooldownSecondsPerDevice: 30
   # Command-specific limits
   cooldownSecondsForGod: 60      # Prevent god mode spam
   cooldownSecondsForFly: 60      # Prevent fly spam
   maxHomesPerPlayer: 5           # Limit saved home locations
   ```

2. Command validation pipeline:
   * Parse each generated command to extract type, player, item/coordinates, count
   * Reject non-whitelisted command types (only `give`, `god`, `fly`, `sethome`, `home`, `tp`, and `tellraw` allowed)
   * Reject if target player not whitelisted
   * Apply command-specific validation:
     - `/give`: Clamp item counts, validate items against CSV
     - `/god` & `/fly`: Apply longer cooldowns to prevent spam
     - `/sethome`: Validate home name, check limits per player
     - `/home`: Validate home exists
     - `/tp`: Validate coordinates or target player exists
   * Apply per-device and per-command cooldowns
   * Log all rejections with detailed reasons

3. Integration with item validation:
   * First: LLM generates commands → item validation (step 4)
   * Then: Command structure validation → policy enforcement
   * Finally: Send to RCON or return helpful error message

**Debug**

* Make 2 quick requests → 2nd should 429 with “cooldown” message.
* Request 5 items → trimmed to 3.

---

## 7) RCON plumbing (no-ops first)

**Goal:** Build the command generator and dry-run output.

**Do**

1. Implement `toMinecraftCommands(plan)`:

   * For each item: `give <player> <id> <count>`
   * Also add an in-game notification: `tellraw <player> {"text":"You received: bread x5","color":"green"}`
2. For now, **don’t** send to the server; just return:

   ```json
   { "commands": ["give ...", "..."], "dryRun": true }
   ```

**Debug**

* `curl` with "give me bread" → see properly formatted RCON commands in JSON response and logs
* Verify `tellraw` notifications are automatically added for `give` commands
* Test command formatting with various player names and items

---

## 8) Server access & file transfer

**Goal:** Set up reliable access to both servers for deployment and management.

**Do**

1. **PebbleHost (Minecraft server) - SFTP access:**
   ```bash
   # Upload config files to Minecraft server
   sftp pebblehost
   put config/server.properties
   put config/paper-global.yml  # if using Paper
   ```

2. **Home server (NAS) - SSH/SCP access:**
   ```bash
   # Deploy Node.js service to home server
   scp -r dist/ nas:~/minecraft-voice-grants/
   scp package.json nas:~/minecraft-voice-grants/
   scp .env nas:~/minecraft-voice-grants/

   # SSH to manage the service
   ssh nas
   cd ~/minecraft-voice-grants
   pnpm install --prod
   pm2 restart minecraft-voice
   ```

**Debug**

* `ssh pebblehost` and `ssh nas` both connect successfully
* SFTP to PebbleHost allows file uploads
* SCP can transfer built application to home server

---

## 9) Enable RCON on the server

**Goal:** Server can accept remote console commands.

**Do (Paper/Spigot or itzg/minecraft-server in Docker)**

1. In `server.properties`:

   ```
   enable-rcon=true
   rcon.port=25575
   rcon.password=YOUR_STRONG_PASSWORD
   ```
2. Restart server.
3. Test locally from the host:

   * With itzg image: `docker exec -i <mc_container> rcon-cli --password $RCON_PASSWORD "list"`
   * Or install `mcrcon`: `mcrcon -H <host> -P 25575 -p $RCON_PASSWORD "list"`

**Debug**

* `list` returns online players.
* `say RCON ok` shows in chat.

---

## 10) Wire RCON client

**Goal:** Execute commands for real.

**Do**

1. Add `rcon-client` (Node lib) or use a tiny wrapper that opens TCP, sends, closes.
2. Config via `.env`:

   ```
   RCON_HOST=...
   RCON_PORT=25575
   RCON_PASSWORD=...
   ```
3. In `/voice` handler, if `?dryRun=1` → return commands; else:

   * Connect
   * Send each command, collect responses
   * Close

**Debug**

* `?dryRun=1` → still works.
* Live request for `torch x2` → player receives items; logs capture RCON replies.

---

## 11) Externalize the endpoint (HTTPS)

**Goal:** Siri anywhere (not just LAN) + real auth.

**Do**

1. Put the service behind HTTPS:

   * Easiest: Cloudflare Tunnel or Tailscale Funnel → stable public URL.
2. Remove `X-Dev-Bypass`. Require real HMAC.
3. Update Shortcut to post to `https://yourdomain/voice` and compute header:

   * Easiest: add a small “Sign Payload” endpoint in **your** service the Shortcut calls first to fetch a one-time `X-Signature` (valid for 30s). Or use a Shortcut “Encrypt/Hash” step via a tiny Scriptable script.

**Debug**

* From cellular, Siri call succeeds.
* Requests without signature get `401`.

---

## 12) UX polish in-game (confirmation + feedback)

**Goal:** Make it friendly and self-explanatory.

**Do**

1. After successful grants, send:

   * `tellraw <player> {"text":"Delivered: bread x5, diamond_pickaxe x1","color":"green"}`
2. On policy rejection (cooldown/unknown item), **don’t** hit RCON; respond to Siri with a friendly message and (optional) send `tellraw` explaining why next time.

**Debug**

* Try breaking a policy → see clear reason in Siri result; no server changes.

---

## 13) Observability & audit

**Goal:** You can explain “who got what and when” and debug fast.

**Do**

1. Log every request with:

   * `reqId`, `deviceUser`, `targetPlayer`, `utterance`, `items`, `counts`, `mode` (dryRun/live), `result`, `latencyMs`.
2. Write successes to `grants.ndjson`.
3. Add `GET /admin/last-20` protected by a header token to view recent entries.

**Debug**

* Call twice; `GET /admin/last-20` shows both lines.

---

## 14) Safety net (kill switch & rate limits)

**Goal:** One switch to stop everything if needed.

**Do**

1. `.env` flag `PAUSE_ALL_GRANTS=true` → handler returns 503 with message.
2. Add `express-rate-limit`/`fastify-rate-limit` per-IP and per-device.

**Debug**

* Toggle flag → all calls 503.
* Hit 10x quickly → rate-limited.

---

## 15) Test pack (copy/paste ready)

**Goal:** Known-good vectors the junior can run.

**Do**

* `curl` cases:

  1. `"give me bread"` → `bread x5`.
  2. `"give me 3 stacks of torches"` → `torch x64 * 2 +  torch x?` (normalize to 128 cap).
  3. `"i want wings"` → `elytra x1`.
  4. Cooldown violation → `429`.
  5. Unknown item → dropped with note.

**Debug**

* Save as `scripts/smoke.sh`; run after any change.

---

## 16) Productionize (nice-to-haves)

* **“Are you sure?” parental confirm**: for certain items (elytra/diamonds), queue until a parent taps an approval link (signed, 10-min expiry).
* **“Undo” pseudo-support**: track last N grants and expose `/admin/suggest-undo` → prints `/clear @p slot commands` or guidance (can’t truly undo most items).
* **Dict growth**: periodically append new synonyms observed in logs (after human review).
* **Multi-player phrasing**: “give us bread” → targets `[player, nearest friend?]` (keep simple: always target `deviceUser` only unless explicitly named).

---

## Failure modes & the quick fix

* **LLM timeout** → fallback to dictionary-only; if still empty, return friendly clarification to Siri.
* **RCON connect fail** → return “Server unavailable” and set a `degraded` flag for 2 minutes (skip LLM calls while down).
* **Player not online** → either queue until online or tell user “join the server first.”

---

## Security recap (must keep)

* HTTPS only.
* HMAC on body (or one-time signed token).
* Whitelisted players and allowed items.
* Cooldowns + rate limits.
* No arbitrary console commands—**only** generated `give`/`tellraw` with validated IDs.

---

## Directory layout (reference)

```
/minecraft-voice-grants
  .env
  src/
    server.ts
    nlp.ts
    policy.ts
    rcon.ts
    items.ts
    players.ts
  config/
    players.yml
    items.yml
    policy.yml
  scripts/
    smoke.sh
  logs/
    grants.ndjson
```

---

## Definition of Done (ship checklist)

* [ ] Siri Shortcut works over cellular → gets items in-game.
* [ ] Logs show correct normalization path (dict vs LLM) and enforcement.
* [ ] Cooldowns and ACLs verified.
* [ ] Kill switch halts grants immediately.
* [ ] Test pack passes (dryRun + live).
* [ ] README documents setup for another engineer.

---

If you want, I can drop in the minimal Fastify server and the `/voice` handler stub with the JSON Schema and dictionary loader next.
