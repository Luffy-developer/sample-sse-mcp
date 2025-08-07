import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { log } from "../utils.js";
import { handleGetAllComponentsDesc, getComponentFile } from './search.js';
import { SEARCH_TOOLS, SEARCH_COMPONENT_TOOL } from "./index.js";

/**
 * Dispatch request handlers based on the request type.
 */
export const dispatchToolCall = async (toolName: string, args: unknown) => {
  log(`处理工具调用: ${toolName}`, args);

  try {
    switch (toolName) {
      case SEARCH_TOOLS.name:
        return await handleGetAllComponentsDesc();
      case SEARCH_COMPONENT_TOOL.name:
        return await getComponentFile(args);
      default:
        log(`找不到工具: ${toolName}`);
        throw new McpError(
          ErrorCode.MethodNotFound,
          `找不到工具: ${toolName}`
        );
    }
  } catch (error) {
    log(`工具调用失败: ${toolName}`, error);
    throw error;
  }
}
