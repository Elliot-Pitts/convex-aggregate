import { DatabaseReader } from "./_generated/server.js";
import { Namespace } from "./btree.js";
export declare const display: import("convex/server").RegisteredQuery<"public", {
    namespace?: any;
}, Promise<void | "empty">>;
export declare const dump: import("convex/server").RegisteredQuery<"public", {
    namespace?: any;
}, Promise<string>>;
export declare function dumpTree(db: DatabaseReader, namespace: Namespace): Promise<string>;
export declare const inspectNode: import("convex/server").RegisteredQuery<"public", {
    namespace?: any;
    node?: string | undefined;
}, Promise<void>>;
export declare const listTrees: import("convex/server").RegisteredQuery<"public", {
    take?: number | undefined;
}, Promise<{
    _id: import("convex/values").GenericId<"btree">;
    _creationTime: number;
    namespace?: any;
    sumType?: "single" | "multi" | undefined;
    root: import("convex/values").GenericId<"btreeNode">;
    maxNodeSize: number;
}[]>>;
export declare const listTreeNodes: import("convex/server").RegisteredQuery<"public", {
    take?: number | undefined;
}, Promise<{
    _id: import("convex/values").GenericId<"btreeNode">;
    _creationTime: number;
    aggregate?: {
        count: number;
        sum: number | Record<string, number>;
    } | undefined;
    items: {
        k: any;
        v: any;
        s: number | Record<string, number>;
    }[];
    subtrees: import("convex/values").GenericId<"btreeNode">[];
}[]>>;
//# sourceMappingURL=inspect.d.ts.map