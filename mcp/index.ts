import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { registerWorksTools } from './tools/works.js'
import { registerArticlesTools } from './tools/articles.js'
import { registerJourneyTools } from './tools/journey.js'
import { registerImagesTools } from './tools/images.js'
import { registerSearchTools } from './tools/search.js'
import { registerSiteInfoTools } from './tools/site-info.js'

const server = new McpServer({
  name: 'show-me',
  version: '1.0.0',
  description: "Anner's portfolio — full CRUD for works, articles, journey, images",
})

registerWorksTools(server)
registerArticlesTools(server)
registerJourneyTools(server)
registerImagesTools(server)
registerSearchTools(server)
registerSiteInfoTools(server)

const transport = new StdioServerTransport()
await server.connect(transport)
