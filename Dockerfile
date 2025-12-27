# Use bun official image
FROM oven/bun:latest

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install

# Copy source code and config
COPY src/ ./src/
COPY config/ ./config/
COPY tsconfig.json ./

# Build the TypeScript application
RUN bun run build

# Create logs directory
RUN mkdir -p tmp

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/healthz', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));"

# Run the application
CMD ["bun", "start"]
