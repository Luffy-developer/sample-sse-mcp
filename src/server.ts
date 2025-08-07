#!/usr/bin/env node

/**
 * MCP Server
 * 支持标准输入输出的处理传输方式
 */

import { Server as McpServer } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { dispatchToolCall } from "./tools/handler.js";
import { ALL_TOOLS } from "./tools/index.js";
import { log } from "./utils.js";


/**
 * 创建MCP服务器配置接口
 */
export interface McpServerConfig {
  transportType: 'stdio' | 'sse';
  sseConfig?: {
    port: number;
    host?: string;
    path?: string;
    endpoint?: string;
  };
}

/**
 * 创建一个具有工具功能的MCP服务器（组件搜索）
 */
export function createServer(config: McpServerConfig = { transportType: 'stdio' }) {
  log("<===============> MCP Echo Server 启动中...");
  // 1. 创建MCP服务器实例
  const server = new McpServer({
    name: 'echo-server',
    version: '0.1.0',
  }, {
    capabilities: {
      tools: {
        resources: {},
        tools: {},
      },
    },
  });

  // 2. 设置请求处理器
  setupRequestHandlers(server);

  // 3. 创建传输层
  let transport;
  // 使用标准输入输出传输层
  transport = new StdioServerTransport();
  log("使用标准输入输出传输层");

  return {
    server,
    transport,
    start: async () => {
      try {
        // 连接到MCP服务器（这会自动调用transport.start()）
        await server.connect(transport);
        log("MCP Echo Server 启动成功!");
      } catch (error) {
        log("MCP Echo Server 启动失败:", error);
        throw error;
      }
    },
    stop: async () => {
      try {
        // 关闭MCP服务器（这会自动调用transport.close()）
        await server.close();
        log("MCP Echo Server 停止成功!");
      } catch (error) {
        log("MCP Echo Server 停止失败:", error);
      }
    }
  }
}

/**
 * Unified error handling
 * @param context 
 * @param error 
 */
function handleError(context: string, error: unknown) {
  log(`${context} failed:`, error);

  if (error instanceof McpError) {
    throw error;
  }

  throw new McpError(
    ErrorCode.InternalError,
    `${context} failed: ${error}`,
  );
}

/**
 * Request handlers
 */
function setupRequestHandlers(server: McpServer) {
  // handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      const toolName = request.params.name;
      const toolArgs = request.params.arguments;
      log(`Processing tool call: ${toolName}`, toolArgs);
      
      return await dispatchToolCall(toolName, toolArgs);
    } catch (error) {
      handleError(`Processing tool call: ${request.params.name}`, error);
      throw error; // 让错误继续传播
    }
  });

  // handle tool listing
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: ALL_TOOLS,
    }
  });

  // Error handling
  process.on('uncaughtException', (error) => {
    log('Uncaught exception:', error);
  });

  process.on('unhandledRejection', (reason) => {
    log('Unhandled rejection:', reason);
  });
}

function setupExitHandlers(server: { stop: () => Promise<void> }) {
  const exitHandler = async () => {
    log("Shutting down server...");
    await server.stop();
    process.exit(0);
  };

  // Handle various exit signals
  process.on("SIGINT", exitHandler);
  process.on("SIGTERM", exitHandler);
  process.on("SIGUSR1", exitHandler);
  process.on("SIGUSR2", exitHandler);
}