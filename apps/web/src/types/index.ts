/**
 * Shared Type Definitions
 *
 * Core domain types used across features.
 * Feature-specific types belong in their respective feature directories.
 *
 * ## Dependency Rules (IMPORTANT)
 *
 * This barrel file is for EXTERNAL consumption only.
 * Internal files must import directly from source files, NOT from this index.
 *
 * Layer structure (dependencies flow downward only):
 *
 *   Base:     geometry.ts, component.ts
 *              ↓
 *   Middle:   element.ts
 *              ↓
 *   Extended: editor-element.ts, project.ts
 *              ↓
 *   Public:   index.ts (this file - external API only)
 *
 * ❌ BAD:  import { BBox } from "./index"      // Causes circular dependency
 * ✅ GOOD: import { BBox } from "./geometry"   // Direct import
 */

export * from "./component";
export * from "./editor-element";
export * from "./element";
export * from "./geometry";
export * from "./project";
export * from "./versions";
