import { Tool } from "@modelcontextprotocol/sdk/types.js";

// 搜索工具定义
export const SEARCH_TOOLS: Tool = {
  name: "get_all_components_desc",
  description: "查询所有组件的描述信息",
  inputSchema: {
    type: "object",
    properties: {},
    required: [],
  },
}

// 单个组件搜索
export const SEARCH_COMPONENT_TOOL: Tool = {
  name: "search_component",
  description: "搜索指定组件的实现代码",
  inputSchema: {
    type: "object",
    properties: {
      component_name: {
        type: "string",
        description: "组件名称",
      },
    },
    required: ["component_name"],
  },
}

// 工具定义
export const ALL_TOOLS = [
  SEARCH_TOOLS,
  SEARCH_COMPONENT_TOOL,
];
