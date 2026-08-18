import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

function shimUseSyncExternalStore() {
  return {
    name: 'shim-use-sync-external-store',
    generateBundle(options, bundle) {
      for (const [fileName, file] of Object.entries(bundle)) {
        if (file.type === 'chunk' && (fileName.endsWith('.js') || fileName.endsWith('.cjs'))) {
          let code = file.code;

          // 1. ESM Shim (ES modules)
          const esmPattern = /import\s+([^;]*?)\buseSyncExternalStore\s+as\s+(\w+)([^;]*?)\s+from\s*['"]react['"]/g;
          if (esmPattern.test(code)) {
            esmPattern.lastIndex = 0; // reset regex
            code = code.replace(esmPattern, (match, before, localName, after) => {
              let cleanBefore = before.trim().replace(/,\s*$/, '').replace(/^,\s*/, '');
              let cleanAfter = after.trim().replace(/,\s*$/, '').replace(/^,\s*/, '');

              const defaultExportMatch = match.match(/import\s+(\w+)\s*,?\s*\{/);
              const defaultExport = defaultExportMatch ? defaultExportMatch[1] : '';

              let reconstructedReact = '';
              const innerBrackets = [
                cleanBefore.replace(/^[^\{]*\{\s*/, ''),
                cleanAfter.replace(/\s*\}[^\}]*$/, '')
              ].filter(Boolean).join(', ').trim().replace(/^,\s*/, '').replace(/,\s*$/, '');

              if (defaultExport) {
                reconstructedReact = `import ${defaultExport}, { ${innerBrackets} } from "react";`;
              } else {
                reconstructedReact = `import { ${innerBrackets} } from "react";`;
              }

              const shimImport = `import { useSyncExternalStore as ${localName} } from "use-sync-external-store/shim";`;
              return `${reconstructedReact}\n${shimImport}`;
            });
          }

          // 2. CJS Shim (CommonJS)
          const cjsReactVarMatch = code.match(/(?:var|const|let)\s+(\w+)\s*=\s*require\s*\(\s*['"]react['"]\s*\)/);
          if (cjsReactVarMatch) {
            const reactVar = cjsReactVarMatch[1];
            const cjsPattern = new RegExp(`\\b${reactVar}\\.useSyncExternalStore\\b`, 'g');
            code = code.replace(cjsPattern, `require("use-sync-external-store/shim").useSyncExternalStore`);
          }

          file.code = code;
        }
      }
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), shimUseSyncExternalStore()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'DiffChecker',
      fileName: (format) => `diff-checker.${format === 'es' ? 'es.js' : 'cjs.js'}`,
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react-router-dom',
        'ag-grid-community',
        'ag-grid-enterprise',
        'ag-grid-react',
      ],
      output: {
        exports: 'named',
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react-router-dom': 'ReactRouterDOM',
          'ag-grid-community': 'agGridCommunity',
          'ag-grid-enterprise': 'agGridEnterprise',
          'ag-grid-react': 'AgGridReact',
        },
      },
    },
    assetsInlineLimit: 65536,
    cssCodeSplit: false,
  },
});


