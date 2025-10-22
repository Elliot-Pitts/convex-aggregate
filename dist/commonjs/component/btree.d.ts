import { Value as ConvexValue } from "convex/values";
import { DatabaseReader, DatabaseWriter } from "./_generated/server.js";
import { Doc, Id } from "./_generated/dataModel.js";
import { Item } from "./schema.js";
export declare const DEFAULT_MAX_NODE_SIZE = 16;
export type Key = ConvexValue;
export type Value = ConvexValue;
export type Namespace = ConvexValue | undefined;
export declare function p(v: ConvexValue): string;
export declare function insertHandler(ctx: {
    db: DatabaseWriter;
}, args: {
    key: Key;
    value: Value;
    summand?: number | Record<string, number>;
    namespace?: Namespace;
}): Promise<void>;
export declare function deleteHandler(ctx: {
    db: DatabaseWriter;
}, args: {
    key: Key;
    namespace?: Namespace;
}): Promise<void>;
export declare const validate: import("convex/server").RegisteredQuery<"public", {
    namespace?: Namespace;
}, Promise<void>>;
export declare function validateTree(ctx: {
    db: DatabaseReader;
}, args: {
    namespace?: Namespace;
}): Promise<void>;
export declare function aggregateBetweenHandler(ctx: {
    db: DatabaseReader;
}, args: {
    k1?: Key;
    k2?: Key;
    namespace?: Namespace;
}): Promise<{
    count: number;
    sum: number | Record<string, number>;
}>;
export declare const aggregateBetween: import("convex/server").RegisteredQuery<"public", {
    k1?: Key;
    k2?: Key;
    namespace?: Namespace;
}, Promise<{
    count: number;
    sum: number | Record<string, number>;
}>>;
export declare function getHandler(ctx: {
    db: DatabaseReader;
}, args: {
    key: Key;
    namespace?: Namespace;
}): Promise<Item | null>;
export declare const get: import("convex/server").RegisteredQuery<"public", {
    key: Key;
    namespace?: Namespace;
}, Promise<Item | null>>;
export declare const atOffset: import("convex/server").RegisteredQuery<"public", {
    offset: number;
    k1?: Key;
    k2?: Key;
    namespace?: Namespace;
}, Promise<Item>>;
export declare function atOffsetHandler(ctx: {
    db: DatabaseReader;
}, args: {
    offset: number;
    k1?: Key;
    k2?: Key;
    namespace?: Namespace;
}): Promise<Item>;
export declare const atNegativeOffset: import("convex/server").RegisteredQuery<"public", {
    offset: number;
    k1?: Key;
    k2?: Key;
    namespace?: Namespace;
}, Promise<Item>>;
export declare function atNegativeOffsetHandler(ctx: {
    db: DatabaseReader;
}, args: {
    offset: number;
    k1?: Key;
    k2?: Key;
    namespace?: Namespace;
}): Promise<Item>;
export declare function offsetHandler(ctx: {
    db: DatabaseReader;
}, args: {
    key: Key;
    k1?: Key;
    namespace?: Namespace;
}): Promise<number>;
export declare const offset: import("convex/server").RegisteredQuery<"public", {
    key: Key;
    k1?: Key;
    namespace?: Namespace;
}, Promise<number>>;
export declare function offsetUntilHandler(ctx: {
    db: DatabaseReader;
}, args: {
    key: Key;
    k2?: Key;
    namespace?: Namespace;
}): Promise<number>;
export declare const offsetUntil: import("convex/server").RegisteredQuery<"public", {
    key: Key;
    k2?: Key;
    namespace?: Namespace;
}, Promise<number>>;
export declare function getTree(db: DatabaseReader, namespace: Namespace): Promise<{
    _id: import("convex/values").GenericId<"btree">;
    _creationTime: number;
    namespace?: any;
    sumType?: "single" | "multi" | undefined;
    root: import("convex/values").GenericId<"btreeNode">;
    maxNodeSize: number;
} | null>;
export declare function mustGetTree(db: DatabaseReader, namespace: Namespace): Promise<{
    _id: import("convex/values").GenericId<"btree">;
    _creationTime: number;
    namespace?: any;
    sumType?: "single" | "multi" | undefined;
    root: import("convex/values").GenericId<"btreeNode">;
    maxNodeSize: number;
}>;
export declare function getOrCreateTree(db: DatabaseWriter, namespace: Namespace, maxNodeSize?: number, rootLazy?: boolean): Promise<Doc<"btree">>;
export declare const deleteTreeNodes: import("convex/server").RegisteredMutation<"internal", {
    node: import("convex/values").GenericId<"btreeNode">;
}, Promise<void>>;
export declare const paginate: import("convex/server").RegisteredQuery<"public", {
    limit: number;
    order: "asc" | "desc";
    cursor?: string;
    k1?: Key;
    k2?: Key;
    namespace?: Namespace;
}, Promise<{
    page: Item[];
    cursor: string;
    isDone: boolean;
}>>;
export declare function paginateHandler(ctx: {
    db: DatabaseReader;
}, args: {
    limit: number;
    order: "asc" | "desc";
    cursor?: string;
    k1?: Key;
    k2?: Key;
    namespace?: Namespace;
}): Promise<{
    page: Item[];
    cursor: string;
    isDone: boolean;
}>;
export declare function paginateInNode(db: DatabaseReader, node: Id<"btreeNode">, limit: number, order: "asc" | "desc", cursor?: string, k1?: Key, k2?: Key): Promise<{
    page: Item[];
    cursor: string;
    isDone: boolean;
}>;
export declare const paginateNamespaces: import("convex/server").RegisteredQuery<"public", {
    limit: number;
    cursor?: string;
}, Promise<{
    page: any[];
    cursor: string | import("convex/values").GenericId<"btree">;
    isDone: boolean;
}>>;
export declare function paginateNamespacesHandler(ctx: {
    db: DatabaseReader;
}, args: {
    limit: number;
    cursor?: string;
}): Promise<{
    page: any[];
    cursor: string | import("convex/values").GenericId<"btree">;
    isDone: boolean;
}>;
export declare const aggregateBetweenBatch: import("convex/server").RegisteredQuery<"public", {
    queries: Array<{
        k1?: Key;
        k2?: Key;
        namespace?: Namespace;
    }>;
}, Promise<{
    count: number;
    sum: number | Record<string, number>;
}[]>>;
export declare function aggregateBetweenBatchHandler(ctx: {
    db: DatabaseReader;
}, args: {
    queries: Array<{
        k1?: Key;
        k2?: Key;
        namespace?: Namespace;
    }>;
}): Promise<{
    count: number;
    sum: number | Record<string, number>;
}[]>;
export declare const atOffsetBatch: import("convex/server").RegisteredQuery<"public", {
    queries: Array<{
        offset: number;
        k1?: Key;
        k2?: Key;
        namespace?: Namespace;
    }>;
}, Promise<Item[]>>;
export declare function atOffsetBatchHandler(ctx: {
    db: DatabaseReader;
}, args: {
    queries: Array<{
        offset: number;
        k1?: Key;
        k2?: Key;
        namespace?: Namespace;
    }>;
}): Promise<Item[]>;
//# sourceMappingURL=btree.d.ts.map