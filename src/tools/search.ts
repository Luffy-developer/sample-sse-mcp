import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { GetComponentArgs, GetComponentRsp, isValidGetComponentArgs } from '../interface/tool.js';
import { formatError } from '../utils.js';
import { log } from '../utils.js';

// 从环境变量获取API地址，默认为本地开发地址
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

// 验证API地址格式
if (!API_BASE_URL.startsWith('http://') && !API_BASE_URL.startsWith('https://')) {
  log(`Warning: API_BASE_URL should include protocol (http:// or https://). Current: ${API_BASE_URL}`);
}

log(`Using API base URL: ${API_BASE_URL}`);

export const handleGetAllComponentsDesc = async () => {
  try {
    log(`Fetching all components description from API: ${API_BASE_URL}...`);
    
    // 使用环境变量配置的API地址
    const response = await fetch(`${API_BASE_URL}/api/components`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    log('Successfully retrieved components description from API');
    
    return {
      content: [{
        type: 'text',
        mimeType: 'application/json',
        text: JSON.stringify(data, null, 2)
      }]
    };
  } catch (error) {
    log('Failed to fetch components description from API:', error);
    
    // 更详细的错误处理
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        return {
          content: [{
            type: 'text',
            mimeType: 'text/plain',
            text: `API server is not available at ${API_BASE_URL}. Please ensure the server is running or set API_BASE_URL environment variable.`,
          }],
          isError: true,
        }
      }
      
      if (error.message.includes('HTTP error! status: 404')) {
        return {
          content: [{
            type: 'text',
            mimeType: 'text/plain',
            text: `API endpoint not found at ${API_BASE_URL}/api/components`,
          }],
          isError: true,
        }
      }
    }
    
    return {
      content: [{
        type: 'text',
        mimeType: 'text/plain',
        text: `Failed to get components description: ${formatError(error)}`,
      }],
      isError: true,
    }
  }
}

export const getComponentFile = async (args: unknown) => {
  if (!isValidGetComponentArgs(args)) {
    throw new McpError(
      ErrorCode.InvalidParams,
      "Invalid component arguments"
    );
  }

  const { component_name: componentName } = args as GetComponentArgs;
  try {
    log(`Fetching Vue file content for component: ${componentName} from ${API_BASE_URL}...`);
    
    // 使用环境变量配置的API地址
    const url = `${API_BASE_URL}/api/components/${encodeURIComponent(componentName)}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Component "${componentName}" not found`);
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    log(`Successfully retrieved Vue file content for component: ${componentName}`);
    
    return {
      content: [{
        type: 'text',
        mimeType: 'application/json',
        text: JSON.stringify(data, null, 2)
      }]
    };
  } catch (error) {
    log(`Failed to fetch Vue file content for component ${componentName}:`, error);
    
    // 更详细的错误处理
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        return {
          content: [{
            type: 'text',
            mimeType: 'text/plain',
            text: `API server is not available at ${API_BASE_URL}. Please ensure the server is running or set API_BASE_URL environment variable.`,
          }],
          isError: true,
        };
      }
      
      if (error.message.includes('not found')) {
        return {
          content: [{
            type: 'text',
            mimeType: 'text/plain',
            text: error.message,
          }],
          isError: true,
        };
      }
    }
    
    return {
      content: [{
        type: 'text',
        mimeType: 'text/plain',
        text: `Failed to get component file: ${formatError(error)}`,
      }],
      isError: true,
    };
  }
};
