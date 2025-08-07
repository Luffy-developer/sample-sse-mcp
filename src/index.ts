import express from "express";
import { randomUUID } from "node:crypto";
import { Server as McpServer } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest, CallToolRequestSchema, ListToolsRequestSchema, McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import dotenv from "dotenv";
import { dispatchToolCall } from "./tools/handler.js";
import { ALL_TOOLS } from "./tools/index.js";
import { log } from "./utils.js";

// 加载环境变量
dotenv.config();

// 配置常量
const PORT = process.env.PORT || 3088;
const MCP_ENDPOINT = '/mcp';
const SESSION_ID_HEADER = 'mcp-session-id';

/**
 * 初始化 Express 应用
 */
function setupExpressApp() {
  const app = express();
  app.use(express.json());
  return app;
}

/**
 * 创建并配置 MCP 服务器
 * @returns 配置好的 MCP 服务器实例
 */
function createMcpServer(): McpServer {
  return new McpServer({
    name: "example-server",
    version: "1.0.0"
  }, {
    capabilities: {
      tools: {
        resources: {},
        tools: {},
      },
    },
  });
}

/**
 * 创建新的传输层
 * @returns 配置好的传输层实例
 */
function createTransport(transports: Record<string, StreamableHTTPServerTransport>): StreamableHTTPServerTransport {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    onsessioninitialized: (sessionId) => {
      // 按会话ID存储传输层
      transports[sessionId] = transport;
      console.log(`会话已初始化: ${sessionId}`);
    },
    enableDnsRebindingProtection: true,
    // 即使禁用了保护，也可以保留允许的主机列表作为参考
    allowedHosts: ['127.0.0.1', 'localhost'],
  });

  // 当关闭时清理传输层
  transport.onclose = () => {
    if (transport.sessionId) {
      console.log(`会话已关闭: ${transport.sessionId}`);
      delete transports[transport.sessionId];
    }
  };

  return transport;
}

/**
 * 处理无效请求
 */
function handleInvalidRequest(res: express.Response) {
  res.status(400).json({
    jsonrpc: '2.0',
    error: {
      code: -32000,
      message: '无效请求: 未提供有效的会话ID',
    },
    id: null,
  });
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log('MCP 服务器启动中...');
    
    const app = setupExpressApp();
    
    // 存储按会话ID索引的传输层
    const transports: Record<string, StreamableHTTPServerTransport> = {};
    
    // 处理客户端到服务器的POST请求
    app.post(MCP_ENDPOINT, async (req, res) => {
      // 检查现有会话ID
      const sessionId = req.headers[SESSION_ID_HEADER] as string | undefined;
      let transport: StreamableHTTPServerTransport;
    
      if (sessionId && transports[sessionId]) {
        // 重用现有传输层
        transport = transports[sessionId];
        console.log(`使用现有会话: ${sessionId}`);
      } else if (!sessionId && isInitializeRequest(req.body)) {
        // 1、创建传输层
        transport = createTransport(transports);
        
        // 2、创建MCP服务器实例
        const server = createMcpServer();
    
        // 3、设置工具
        setupRequestHandlers(server);
    
        // 4、连接到MCP服务器
        await server.connect(transport);
        console.log('服务器已连接到传输层', sessionId);
      } else {
        // 无效请求
        handleInvalidRequest(res);
        return;
      }
    
      // 处理请求
      await transport.handleRequest(req, res, req.body);
    });
    
    // 处理GET和DELETE请求的可重用处理程序
    const handleSessionRequest = async (req: express.Request, res: express.Response) => {
      const sessionId = req.headers[SESSION_ID_HEADER] as string | undefined;
      if (!sessionId || !transports[sessionId]) {
        res.status(400).send('无效或缺失的会话ID');
        return;
      }
      
      const transport = transports[sessionId];
      await transport.handleRequest(req, res);
    };
    
    // 处理通过SSE进行的服务器到客户端通知的GET请求
    app.get(MCP_ENDPOINT, handleSessionRequest);
    
    // 处理会话终止的DELETE请求
    app.delete(MCP_ENDPOINT, handleSessionRequest);
    
    // 启动服务器
    app.listen(PORT, () => {
      console.log(`MCP 服务器监听端口 ${PORT}`);
    });
    
    // 设置退出处理程序
    setupExitHandlers();
    
  } catch (error) {
    console.error('MCP 服务器启动失败:', error);
    process.exit(1);
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
      throw error; // 让错误继续传递
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

/**
 * 设置退出处理程序
 */
function setupExitHandlers() {
  const exitHandler = () => {
    console.log("正在关闭服务器...");
    process.exit(0);
  };

  // 处理各种退出信号
  process.on("SIGINT", exitHandler);
  process.on("SIGTERM", exitHandler);
}

// 启动程序
main().catch((error) => {
  console.error("致命错误:", error);
  process.exit(1);
});