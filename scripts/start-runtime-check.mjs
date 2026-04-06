#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { constants as fsConstants, promises as fs } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const [, , mode, appRootArg, projectRootArg] = process.argv;

if (!mode || !appRootArg || !projectRootArg) {
  console.error('Usage: node scripts/start-runtime-check.mjs <validate-project|healthcheck-mcp> <app-root> <project-root>');
  process.exit(1);
}

const appRoot = path.resolve(appRootArg);
const projectRoot = path.resolve(projectRootArg);

const STATUS = {
  OK: 0,
  NOT_INITIALIZED: 10,
  INVALID_CONFIG: 11
};

async function exists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function validateProject() {
  const speclinterDir = path.join(projectRoot, '.speclinter');
  const configPath = path.join(speclinterDir, 'config.json');

  if (!(await exists(speclinterDir)) || !(await exists(configPath))) {
    process.exit(STATUS.NOT_INITIALIZED);
  }

  try {
    const [{ ConfigSchema }, { ConfigManager }] = await Promise.all([
      import(pathToFileURL(path.join(appRoot, 'dist/types/config.js')).href),
      import(pathToFileURL(path.join(appRoot, 'dist/utils/config-manager.js')).href)
    ]);

    const rawConfig = await fs.readFile(configPath, 'utf8');
    const parsedConfig = JSON.parse(rawConfig);
    const config = ConfigSchema.parse(parsedConfig);
    const validation = ConfigManager.validateConfig(config);

    if (!validation.success) {
      console.error(validation.error ?? 'Configuration validation failed');
      const errors = validation.data?.errors ?? [];
      for (const error of errors) {
        console.error(`- ${error}`);
      }
      process.exit(STATUS.INVALID_CONFIG);
    }

    const requiredDirs = [
      path.resolve(projectRoot, config.storage.tasksDir),
      path.resolve(projectRoot, config.context.contextDir),
      path.dirname(path.resolve(projectRoot, config.storage.dbPath))
    ];

    for (const dir of requiredDirs) {
      await fs.mkdir(dir, { recursive: true });
      await fs.access(dir, fsConstants.R_OK | fsConstants.W_OK);
    }

    const contextFiles = ['project.md', 'patterns.md', 'architecture.md'];
    const missingContext = [];

    for (const fileName of contextFiles) {
      const filePath = path.resolve(projectRoot, config.context.contextDir, fileName);
      if (!(await exists(filePath))) {
        missingContext.push(fileName);
      }
    }

    if (validation.data?.warnings?.length) {
      for (const warning of validation.data.warnings) {
        console.error(`WARN:${warning}`);
      }
    }

    if (missingContext.length > 0) {
      console.error(`WARN:Missing AI context files: ${missingContext.join(', ')}`);
    }

    process.exit(STATUS.OK);
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Unknown configuration validation error');
    process.exit(STATUS.INVALID_CONFIG);
  }
}

async function healthcheckMcp() {
  const startupMarker = 'SpecLinter MCP server running on stdio';
  const timeoutMs = 10000;

  const child = spawn(process.execPath, ['dist/cli.js', 'serve'], {
    cwd: appRoot,
    env: {
      ...process.env,
      SPECLINTER_PROJECT_ROOT: projectRoot
    },
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let stderr = '';
  let finished = false;

  const finish = (code, message) => {
    if (finished) {
      return;
    }
    finished = true;

    clearTimeout(timer);

    if (message) {
      if (code === 0) {
        console.error(message);
      } else {
        console.error(`${message}${stderr ? `\n${stderr.trim()}` : ''}`);
      }
    }

    if (child.exitCode === null && child.signalCode === null) {
      const forceExitTimer = setTimeout(() => {
        process.exit(code);
      }, 1000);

      child.once('exit', () => {
        clearTimeout(forceExitTimer);
        process.exit(code);
      });

      child.kill('SIGTERM');
      return;
    }

    process.exit(code);
  };

  const timer = setTimeout(() => {
    finish(1, `Timed out waiting for MCP startup after ${timeoutMs}ms`);
  }, timeoutMs);

  child.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
    if (stderr.includes(startupMarker)) {
      finish(0, startupMarker);
    }
  });

  child.on('exit', (code, signal) => {
    if (!finished) {
      finish(1, `MCP server exited before startup completed (code=${code ?? 'null'}, signal=${signal ?? 'null'})`);
    }
  });

  child.on('error', (error) => {
    finish(1, `Failed to start MCP server: ${error.message}`);
  });
}

if (mode === 'validate-project') {
  await validateProject();
} else if (mode === 'healthcheck-mcp') {
  await healthcheckMcp();
} else {
  console.error(`Unknown mode: ${mode}`);
  process.exit(1);
}
