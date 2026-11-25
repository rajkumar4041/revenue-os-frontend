import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginClient } from '@kubb/plugin-client'
import { pluginReactQuery } from '@kubb/plugin-react-query'

// Generates models, a typed client and TanStack Query hooks from the backend's
// OpenAPI document (exported to openapi.json by the backend OpenApiExportTest).
// Run with: npm run generate
export default defineConfig({
  root: '.',
  input: { path: './openapi.json' },
  output: {
    path: './src/gen',
    clean: true,
  },
  plugins: [
    pluginOas({ validate: false }),
    pluginTs({ output: { path: 'models' } }),
    pluginClient({
      output: { path: 'client' },
      importPath: '@/lib/kubbClient',
    }),
    pluginReactQuery({
      output: { path: 'hooks' },
      client: { importPath: '@/lib/kubbClient' },
    }),
  ],
})
