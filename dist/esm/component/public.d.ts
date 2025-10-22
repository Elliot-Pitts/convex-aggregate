export declare const init: import("convex/server").RegisteredMutation<"public", {
    namespace?: any;
    maxNodeSize?: number | undefined;
    rootLazy?: boolean | undefined;
}, Promise<void>>;
/**
 * Call this mutation to reduce contention at the expense of more reads.
 * This is useful if writes are frequent and serializing all writes is
 * detrimental.
 * Lazy roots are the default; use `clear` to revert to eager roots.
 */
export declare const makeRootLazy: import("convex/server").RegisteredMutation<"public", {
    namespace?: any;
}, Promise<void>>;
export declare const insert: import("convex/server").RegisteredMutation<"public", {
    key: import("./btree.js").Key;
    value: import("./btree.js").Value;
    summand?: number | Record<string, number>;
    namespace?: import("./btree.js").Namespace;
}, Promise<void>>;
export declare const delete_: import("convex/server").RegisteredMutation<"public", {
    key: import("./btree.js").Key;
    namespace?: import("./btree.js").Namespace;
}, Promise<void>>;
export declare const replace: import("convex/server").RegisteredMutation<"public", {
    namespace?: any;
    summand?: number | Record<string, number> | undefined;
    newNamespace?: any;
    value: any;
    currentKey: any;
    newKey: any;
}, Promise<void>>;
export declare const deleteIfExists: import("convex/server").RegisteredMutation<"public", {
    namespace?: any;
    key: any;
}, Promise<void>>;
export declare const replaceOrInsert: import("convex/server").RegisteredMutation<"public", {
    namespace?: any;
    summand?: number | Record<string, number> | undefined;
    newNamespace?: any;
    value: any;
    currentKey: any;
    newKey: any;
}, Promise<void>>;
/**
 * Reinitialize the aggregate data structure, clearing all data.
 * maxNodeSize is the sharding coefficient for the underlying btree.
 * rootLazy is whether to compute aggregates at the root eagerly or lazily.
 * If either is not provided, the existing value is preserved.
 */
export declare const clear: import("convex/server").RegisteredMutation<"public", {
    namespace?: any;
    maxNodeSize?: number | undefined;
    rootLazy?: boolean | undefined;
}, Promise<void>>;
//# sourceMappingURL=public.d.ts.map