#!/usr/bin/env node

/**
 * MCP SSE服务器测试脚本
 * 
 * 此脚本用于测试MCP SSE服务器的功能，包括：
 * 1. 启动SSE服务器
 * 2. 发送测试消息
 * 3. 模拟客户端连接和断开
 */

import http from 'http';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

// 添加Object.hasOwn polyfill
if (!Object.hasOwn) {
  Object.hasOwn = function(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
  };
}

// 加载环境变量
dotenv.config();

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 检查构建目录是否存在
const buildPath = resolve(__dirname, '../build/index.js');
if (!fs.existsSync(buildPath)) {
  console.error(`错误: 构建文件不存在: ${buildPath}`);
  console.error('请先运行 npm run build 命令');
  process.exit(1);
}

// 日志函数
function log(message, ...args) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, ...args);
}

/**
 * 模拟客户端发送消息
 * @param {string} message 要发送的消息
 * @returns {Promise<object>} 响应结果
 */
async function sendClientMessage(message) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/mcp-message',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(message)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            data: JSON.parse(data)
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(message);
    req.end();
  });
}

/**
 * 运行测试
 */
async function runTest() {
  log('开始测试 MCP SSE 服务器');

  try {
    // 1. 设置环境变量
    process.env.TRANSPORT_TYPE = 'sse';
    process.env.SSE_PORT = '3000';
    process.env.SSE_HOST = 'localhost';
    process.env.SSE_PATH = '/mcp-sse';
    process.env.SSE_CLIENT_MESSAGE_PATH = '/mcp-message';

    // 2. 导入服务器模块
    log('正在导入服务器模块...');
    const { createServer } = await import('../build/server.js');
    
    // 3. 创建并启动服务器
    log('正在启动 MCP SSE 服务器...');
    const server = createServer({
      transportType: 'sse',
      sseConfig: {
        port: 3000,
        host: 'localhost',
        path: '/mcp-sse',
        clientMessagePath: '/mcp-message'
      }
    });
    
    await server.start();
    log('MCP SSE 服务器已启动');

    // 4. 等待一段时间，确保服务器已完全启动
    log('等待服务器初始化...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 5. 发送测试消息
    log('正在发送测试消息...');
    try {
      const testMessage = JSON.stringify({
        type: 'test',
        content: '这是一条测试消息',
        timestamp: new Date().toISOString()
      });
      
      const response = await sendClientMessage(testMessage);
      log(`测试消息发送结果: 状态码=${response.statusCode}, 响应=${JSON.stringify(response.data)}`);
      
      if (response.statusCode !== 200) {
        throw new Error(`消息发送失败，状态码: ${response.statusCode}`);
      }
    } catch (sendError) {
      log('发送测试消息失败:', sendError);
      throw sendError;
    }

    // 6. 等待一段时间，然后结束测试
    log('测试完成，5秒后将结束测试...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 7. 停止服务器
    log('正在停止服务器...');
    await server.stop();
    log('服务器已停止');
    
    log('测试成功完成');
    process.exit(0);
  } catch (error) {
    log('测试失败:', error);
    process.exit(1);
  }
}

// 运行测试
runTest();