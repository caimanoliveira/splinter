import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // React Compiler rules over-flag the common pattern of calling an async
      // data-fetching function inside useEffect (setState is called async, not sync).
      'react-hooks/set-state-in-effect': 'off',
      // Compiler-inferred deps may differ from intentionally fine-grained manual deps.
      'react-hooks/preserve-manual-memoization': 'off',
      // Date.now() inside useMemo/useState with [] dep is intentionally one-time; rule is too strict.
      'react-hooks/purity': 'off',
    },
  },
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
])

export default eslintConfig
