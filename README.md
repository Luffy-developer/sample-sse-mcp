# MCP Server
一个基于SSE（Server-Sent Events）的Mcp服务器。

## 功能特点

- 查询所有可用的Vue.js组件及其描述
- 按名称搜索特定组件文件
- 获取组件元数据，包括属性、事件和代码
- 环境变量配置，实现灵活的API端点设置

## 可用工具

- `get_all_components_desc`: 返回所有可用组件的描述
- `search_component`: 通过名称获取特定组件的详细信息

## 安装

```bash
git clone https://github.com/Luffy-developer/sample-sse-mcp.git
cd sample-sse-mcp
npm install
```

## 配置

### 环境变量

设置以下环境变量来配置服务器：

- `API_BASE_URL`: 组件API的基础URL（默认值：http://localhost:3000）
  - 示例：`export API_BASE_URL=https://your-api-server.com`

### MCP设置

在VSCode设置中将echo服务器添加到您的MCP设置文件中（例如 ~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json）：

```json
{
  "mcpServers": {
    "echo-server": {
      "transport": {
        "type": "sse",
        "url": "http://localhost:3088/mcp",
        "headers": {
          "mcp-session-id": "your-session-id"
        }
      },
      "disabled": false,
      "autoApprove": [
        "get_all_components_desc",
        "search_component"
      ],
      "env": {
        "API_BASE_URL": "http://localhost:3000",
        "PORT": "3088"
      }
    }
  }
}
```

您也可以使用标准输入输出方式配置：

```json
{
  "mcpServers": {
    "echo-server": {
      "command": "node",
      "args": ["/path/to/echo-server/build/index.js"],
      "disabled": false,
      "autoApprove": [
        "get_all_components_desc",
        "search_component"
      ],
      "env": {
        "API_BASE_URL": "http://localhost:3000",
        "TRANSPORT_TYPE": "stdio"
      }
    }
  }
}
```

## 使用示例

### 获取所有组件

```json
{
  "tool": "get_all_components_desc",
  "arguments": {}
}
```

### 搜索特定组件

```json
{
  "tool": "search_component",
  "arguments": {
    "component_name": "Button"
  }
}
```

## 开发

### 运行测试

```bash
npm test
```

### 构建

```bash
npm run build
```

### 开发模式

```bash
npm run watch
```

## API要求

此MCP服务器需要一个提供以下功能的后端API：

- `GET /api/components` - 返回所有组件列表
- `GET /api/components/:componentName` - 返回特定组件详情

## 许可证

MIT