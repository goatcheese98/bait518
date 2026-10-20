/// <reference types="vite/client" />

// Compatibility declaration for the one untouched JavaScript chart component.
// Vue's language tools infer the actual types for TypeScript SFCs.
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{ fullscreen?: boolean }>
  export default component
}
