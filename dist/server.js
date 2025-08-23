"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const dotenv_1 = require("dotenv");
// Load environment variables
(0, dotenv_1.config)();
const app = (0, fastify_1.default)({
    logger: {
        level: process.env.LOG_LEVEL || 'info',
        formatters: {
            level: (label) => {
                return { level: label.toUpperCase() };
            },
        },
        timestamp: () => `,"time":"${new Date(Date.now()).toISOString()}"`,
    },
    genReqId: () => {
        return Math.random().toString(36).substring(2, 15);
    },
});
// Health check endpoint
app.get('/healthz', async (request, reply) => {
    return {
        ok: true,
        ts: Date.now(),
    };
});
// Voice command endpoint
app.post('/voice', async (request, reply) => {
    const body = request.body;
    request.log.info({
        utterance: body.utterance,
        deviceUser: body.deviceUser
    }, 'Voice request received');
    // For now, just echo back the request
    return {
        received: body,
        ts: Date.now(),
    };
});
const start = async () => {
    try {
        const port = parseInt(process.env.PORT || '3000', 10);
        const host = process.env.HOST || '0.0.0.0';
        await app.listen({ port, host });
        app.log.info(`Server listening on ${host}:${port}`);
    }
    catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};
start();
//# sourceMappingURL=server.js.map