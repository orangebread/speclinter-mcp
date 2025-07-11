# SpecLinter MCP Server - Multi-stage Docker Build
# Supports both interactive MCP server and headless validation modes

# Build stage
FROM node:18-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++ sqlite

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install pnpm and dependencies
RUN npm install -g pnpm && \
    pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Production stage
FROM node:18-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache sqlite

# Create app user for security
RUN addgroup -g 1001 -S speclinter && \
    adduser -S speclinter -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install pnpm and production dependencies only
RUN npm install -g pnpm && \
    if [ -f pnpm-lock.yaml ]; then \
        pnpm install --prod --frozen-lockfile; \
    else \
        pnpm install --prod; \
    fi && \
    npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Create workspace directory for project mounting
RUN mkdir -p /workspace && \
    chown -R speclinter:speclinter /app /workspace

# Switch to non-root user
USER speclinter

# Set default workspace
WORKDIR /workspace

# Expose MCP server port (though MCP typically uses stdio)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node /app/dist/cli.js --version || exit 1

# Default entrypoint
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

# Default command - start MCP server
CMD ["serve"]

# Labels for metadata
LABEL org.opencontainers.image.title="SpecLinter MCP Server"
LABEL org.opencontainers.image.description="AI-powered specification analysis and task generation MCP server"
LABEL org.opencontainers.image.version="0.1.0"
LABEL org.opencontainers.image.vendor="SpecLinter"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.source="https://github.com/orangebread/speclinter-mcp"
LABEL org.opencontainers.image.documentation="https://github.com/orangebread/speclinter-mcp#readme"
