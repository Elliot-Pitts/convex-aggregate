import { DocumentByName, GenericDataModel, GenericMutationCtx, GenericQueryCtx, TableNamesInDataModel } from "convex/server";
import { Key } from "../component/btree.js";
import { api } from "../component/_generated/api.js";
import { UseApi } from "./useApi.js";
import { Bound, Bounds } from "./positions.js";
import { GenericId, Value as ConvexValue } from "convex/values";
export type UsedAPI = UseApi<typeof api>;
export type RunQueryCtx = {
    runQuery: GenericQueryCtx<GenericDataModel>["runQuery"];
};
export type RunMutationCtx = {
    runMutation: GenericMutationCtx<GenericDataModel>["runMutation"];
};
export type Item<K extends Key, ID extends string> = {
    key: K;
    id: ID;
    sumValue: number;
    sumValues?: Record<string, number>;
};
export type { Key, Bound };
/**
 * Write data to be aggregated, and read aggregated data.
 *
 * The data structure is effectively a key-value store sorted by key, where the
 * value is an ID and an optional sumValue.
 * 1. The key can be any Convex value (number, string, array, etc.).
 * 2. The ID is a string which should be unique.
 * 3. The sumValue is a number which is aggregated by summing. If not provided,
 *    it's assumed to be zero.
 *
 * Once values have been added to the data structure, you can query for the
 * count and sum of items between a range of keys.
 */
export declare class Aggregate<K extends Key, ID extends string, Namespace extends ConvexValue | undefined = undefined> {
    protected component: UsedAPI;
    constructor(component: UsedAPI);
    /**
     * Counts items between the given bounds.
     */
    count(ctx: RunQueryCtx, ...opts: NamespacedOpts<{
        bounds?: Bounds<K, ID>;
    }, Namespace>): Promise<number>;
    /**
     * Batch version of count() - counts items for multiple bounds in a single call.
     */
    countBatch(ctx: RunQueryCtx, queries: NamespacedOptsBatch<{
        bounds?: Bounds<K, ID>;
    }, Namespace>): Promise<number[]>;
    /**
     * Adds up the sumValue of items between the given bounds.
     */
    sum(ctx: RunQueryCtx, ...opts: NamespacedOpts<{
        bounds?: Bounds<K, ID>;
    }, Namespace>): Promise<number | Record<string, number>>;
    /**
     * Batch version of sum() - sums items for multiple bounds in a single call.
     */
    sumBatch(ctx: RunQueryCtx, queries: NamespacedOptsBatch<{
        bounds?: Bounds<K, ID>;
    }, Namespace>): Promise<Array<number | Record<string, number>>>;
    /**
     * Returns the item at the given offset/index/rank in the order of key,
     * within the bounds. Zero-indexed, so at(0) is the smallest key within the
     * bounds.
     *
     * If offset is negative, it counts from the end of the list, so at(-1) is the
     * item with the largest key within the bounds.
     */
    at(ctx: RunQueryCtx, offset: number, ...opts: NamespacedOpts<{
        bounds?: Bounds<K, ID>;
    }, Namespace>): Promise<Item<K, ID>>;
    /**
     * Batch version of at() - returns items at multiple offsets in a single call.
     */
    atBatch(ctx: RunQueryCtx, queries: NamespacedOptsBatch<{
        offset: number;
        bounds?: Bounds<K, ID>;
    }, Namespace>): Promise<Item<K, ID>[]>;
    /**
     * Returns the rank/offset/index of the given key, within the bounds.
     * Specifically, it returns the index of the first item with
     *
     * - key >= the given key if `order` is "asc" (default)
     * - key <= the given key if `order` is "desc"
     */
    indexOf(ctx: RunQueryCtx, key: K, ...opts: NamespacedOpts<{
        id?: ID;
        bounds?: Bounds<K, ID>;
        order?: "asc" | "desc";
    }, Namespace>): Promise<number>;
    /**
     * @deprecated Use `indexOf` instead.
     */
    offsetOf(ctx: RunQueryCtx, key: K, namespace: Namespace, id?: ID, bounds?: Bounds<K, ID>): Promise<number>;
    /**
     * @deprecated Use `indexOf` instead.
     */
    offsetUntil(ctx: RunQueryCtx, key: K, namespace: Namespace, id?: ID, bounds?: Bounds<K, ID>): Promise<number>;
    /**
     * Gets the minimum item within the given bounds.
     */
    min(ctx: RunQueryCtx, ...opts: NamespacedOpts<{
        bounds?: Bounds<K, ID>;
    }, Namespace>): Promise<Item<K, ID> | null>;
    /**
     * Gets the maximum item within the given bounds.
     */
    max(ctx: RunQueryCtx, ...opts: NamespacedOpts<{
        bounds?: Bounds<K, ID>;
    }, Namespace>): Promise<Item<K, ID> | null>;
    /**
     * Gets a uniformly random item within the given bounds.
     */
    random(ctx: RunQueryCtx, ...opts: NamespacedOpts<{
        bounds?: Bounds<K, ID>;
    }, Namespace>): Promise<Item<K, ID> | null>;
    /**
     * Get a page of items between the given bounds, with a cursor to paginate.
     * Use `iter` to iterate over all items within the bounds.
     */
    paginate(ctx: RunQueryCtx, ...opts: NamespacedOpts<{
        bounds?: Bounds<K, ID>;
        cursor?: string;
        order?: "asc" | "desc";
        pageSize?: number;
    }, Namespace>): Promise<{
        page: Item<K, ID>[];
        cursor: string;
        isDone: boolean;
    }>;
    /**
     * Example usage:
     * ```ts
     * for await (const item of aggregate.iter(ctx, bounds)) {
     *   console.log(item);
     * }
     * ```
     */
    iter(ctx: RunQueryCtx, ...opts: NamespacedOpts<{
        bounds?: Bounds<K, ID>;
        order?: "asc" | "desc";
        pageSize?: number;
    }, Namespace>): AsyncGenerator<Item<K, ID>, void, undefined>;
    /** Write operations. See {@link DirectAggregate} for docstrings. */
    _insert(ctx: RunMutationCtx, namespace: Namespace, key: K, id: ID, summand?: number | Record<string, number>): Promise<void>;
    _delete(ctx: RunMutationCtx, namespace: Namespace, key: K, id: ID): Promise<void>;
    _replace(ctx: RunMutationCtx, currentNamespace: Namespace, currentKey: K, newNamespace: Namespace, newKey: K, id: ID, summand?: number | Record<string, number>): Promise<void>;
    _insertIfDoesNotExist(ctx: RunMutationCtx, namespace: Namespace, key: K, id: ID, summand?: number | Record<string, number>): Promise<void>;
    _deleteIfExists(ctx: RunMutationCtx, namespace: Namespace, key: K, id: ID): Promise<void>;
    _replaceOrInsert(ctx: RunMutationCtx, currentNamespace: Namespace, currentKey: K, newNamespace: Namespace, newKey: K, id: ID, summand?: number | Record<string, number>): Promise<void>;
    /**
     * (re-)initialize the data structure, removing all items if it exists.
     *
     * Change the maxNodeSize if provided, otherwise keep it the same.
     *   maxNodeSize is how you tune the data structure's width and depth.
     *   Larger values can reduce write contention but increase read latency.
     *   Default is 16.
     * Set rootLazy = false to eagerly compute aggregates on the root node, which
     *   improves aggregation latency at the expense of making all writes contend
     *   with each other, so it's only recommended for read-heavy workloads.
     *   Default is true.
     */
    clear(ctx: RunMutationCtx, ...opts: NamespacedOpts<{
        maxNodeSize?: number;
        rootLazy?: boolean;
    }, Namespace>): Promise<void>;
    /**
     * If rootLazy is false (the default is true but it can be set to false by
     * `clear`), the aggregates data structure writes to a single root node on
     * every insert/delete/replace, which can cause contention.
     *
     * If your data structure has frequent writes, you can reduce contention by
     * calling makeRootLazy, which removes the frequent writes to the root node.
     * With a lazy root node, updates will only contend with other updates to the
     * same shard of the tree. The number of shards is determined by maxNodeSize,
     * so larger maxNodeSize can also help.
     */
    makeRootLazy(ctx: RunMutationCtx, namespace: Namespace): Promise<void>;
    paginateNamespaces(ctx: RunQueryCtx, cursor?: string, pageSize?: number): Promise<{
        page: Namespace[];
        cursor: string;
        isDone: boolean;
    }>;
    iterNamespaces(ctx: RunQueryCtx, pageSize?: number): AsyncGenerator<Namespace, void, undefined>;
    clearAll(ctx: RunMutationCtx & RunQueryCtx, opts?: {
        maxNodeSize?: number;
        rootLazy?: boolean;
    }): Promise<void>;
    makeAllRootsLazy(ctx: RunMutationCtx & RunQueryCtx): Promise<void>;
}
export type DirectAggregateType<K extends Key, ID extends string, Namespace extends ConvexValue | undefined = undefined> = {
    Key: K;
    Id: ID;
    Namespace?: Namespace;
};
type AnyDirectAggregateType = DirectAggregateType<Key, string, ConvexValue | undefined>;
type DirectAggregateNamespace<T extends AnyDirectAggregateType> = "Namespace" extends keyof T ? T["Namespace"] : undefined;
/**
 * A DirectAggregate is an Aggregate where you can insert, delete, and replace
 * items directly, and keys and IDs can be customized.
 *
 * Contrast with TableAggregate, which follows a table with Triggers and
 * computes keys and sumValues from the table's documents.
 */
export declare class DirectAggregate<T extends AnyDirectAggregateType> extends Aggregate<T["Key"], T["Id"], DirectAggregateNamespace<T>> {
    /**
     * Insert a new key into the data structure.
     * The id should be unique.
     * If not provided, the sumValue is assumed to be zero.
     * If the tree does not exist yet, it will be initialized with the default
     * maxNodeSize and lazyRoot=true.
     * If the [key, id] pair already exists, this will throw.
     */
    insert(ctx: RunMutationCtx, args: NamespacedArgs<{
        key: T["Key"];
        id: T["Id"];
        sumValue?: number;
        sumValues?: Record<string, number>;
    }, DirectAggregateNamespace<T>>): Promise<void>;
    /**
     * Delete the key with the given ID from the data structure.
     * Throws if the given key and ID do not exist.
     */
    delete(ctx: RunMutationCtx, args: NamespacedArgs<{
        key: T["Key"];
        id: T["Id"];
    }, DirectAggregateNamespace<T>>): Promise<void>;
    /**
     * Update an existing item in the data structure.
     * This is effectively a delete followed by an insert, but it's performed
     * atomically so it's impossible to view the data structure with the key missing.
     */
    replace(ctx: RunMutationCtx, currentItem: NamespacedArgs<{
        key: T["Key"];
        id: T["Id"];
    }, DirectAggregateNamespace<T>>, newItem: NamespacedArgs<{
        key: T["Key"];
        sumValue?: number;
        sumValues?: Record<string, number>;
    }, DirectAggregateNamespace<T>>): Promise<void>;
    /**
     * Equivalents to `insert`, `delete`, and `replace` where the item may or may not exist.
     * This can be useful for live backfills:
     * 1. Update live writes to use these methods to write into the new Aggregate.
     * 2. Run a background backfill, paginating over existing data, calling `insertIfDoesNotExist` on each item.
     * 3. Once the backfill is complete, use `insert`, `delete`, and `replace` for live writes.
     * 4. Begin using the Aggregate read methods.
     */
    insertIfDoesNotExist(ctx: RunMutationCtx, args: NamespacedArgs<{
        key: T["Key"];
        id: T["Id"];
        sumValue?: number;
        sumValues?: Record<string, number>;
    }, DirectAggregateNamespace<T>>): Promise<void>;
    deleteIfExists(ctx: RunMutationCtx, args: NamespacedArgs<{
        key: T["Key"];
        id: T["Id"];
    }, DirectAggregateNamespace<T>>): Promise<void>;
    replaceOrInsert(ctx: RunMutationCtx, currentItem: NamespacedArgs<{
        key: T["Key"];
        id: T["Id"];
    }, DirectAggregateNamespace<T>>, newItem: NamespacedArgs<{
        key: T["Key"];
        sumValue?: number;
        sumValues?: Record<string, number>;
    }, DirectAggregateNamespace<T>>): Promise<void>;
}
export type TableAggregateType<K extends Key, DataModel extends GenericDataModel, TableName extends TableNamesInDataModel<DataModel>, Namespace extends ConvexValue | undefined = undefined> = {
    Key: K;
    DataModel: DataModel;
    TableName: TableName;
    Namespace?: Namespace;
};
type AnyTableAggregateType = TableAggregateType<Key, GenericDataModel, TableNamesInDataModel<GenericDataModel>, ConvexValue | undefined>;
type TableAggregateNamespace<T extends AnyTableAggregateType> = "Namespace" extends keyof T ? T["Namespace"] : undefined;
type TableAggregateDocument<T extends AnyTableAggregateType> = DocumentByName<T["DataModel"], T["TableName"]>;
type TableAggregateId<T extends AnyTableAggregateType> = GenericId<T["TableName"]>;
type TableAggregateTrigger<Ctx, T extends AnyTableAggregateType> = Trigger<Ctx, T["DataModel"], T["TableName"]>;
export declare class TableAggregate<T extends AnyTableAggregateType> extends Aggregate<T["Key"], GenericId<T["TableName"]>, TableAggregateNamespace<T>> {
    private options;
    constructor(component: UsedAPI, options: ({
        sortKey: (d: TableAggregateDocument<T>) => T["Key"];
    } & ({
        sumValue: (d: TableAggregateDocument<T>) => number;
        sumValues?: never;
    } | {
        sumValues: (d: TableAggregateDocument<T>) => Record<string, number>;
        sumValue?: never;
    } | {
        sumValue?: never;
        sumValues?: never;
    })) & (undefined extends TableAggregateNamespace<T> ? {
        namespace?: (d: TableAggregateDocument<T>) => TableAggregateNamespace<T>;
    } : {
        namespace: (d: TableAggregateDocument<T>) => TableAggregateNamespace<T>;
    }));
    insert(ctx: RunMutationCtx, doc: TableAggregateDocument<T>): Promise<void>;
    delete(ctx: RunMutationCtx, doc: TableAggregateDocument<T>): Promise<void>;
    replace(ctx: RunMutationCtx, oldDoc: TableAggregateDocument<T>, newDoc: TableAggregateDocument<T>): Promise<void>;
    insertIfDoesNotExist(ctx: RunMutationCtx, doc: TableAggregateDocument<T>): Promise<void>;
    deleteIfExists(ctx: RunMutationCtx, doc: TableAggregateDocument<T>): Promise<void>;
    replaceOrInsert(ctx: RunMutationCtx, oldDoc: TableAggregateDocument<T>, newDoc: TableAggregateDocument<T>): Promise<void>;
    /**
     * Returns the rank/offset/index of the given document, within the bounds.
     * This differs from `indexOf` in that it take the document rather than key.
     * Specifically, it returns the index of the first item with
     *
     * - key >= the given doc's key if `order` is "asc" (default)
     * - key <= the given doc's key if `order` is "desc"
     */
    indexOfDoc(ctx: RunQueryCtx, doc: TableAggregateDocument<T>, opts?: {
        id?: TableAggregateId<T>;
        bounds?: Bounds<T["Key"], TableAggregateId<T>>;
        order?: "asc" | "desc";
    }): Promise<number>;
    trigger<Ctx extends RunMutationCtx>(): TableAggregateTrigger<Ctx, T>;
    idempotentTrigger<Ctx extends RunMutationCtx>(): TableAggregateTrigger<Ctx, T>;
}
export type Trigger<Ctx, DataModel extends GenericDataModel, TableName extends TableNamesInDataModel<DataModel>> = (ctx: Ctx, change: Change<DataModel, TableName>) => Promise<void>;
export type Change<DataModel extends GenericDataModel, TableName extends TableNamesInDataModel<DataModel>> = {
    id: GenericId<TableName>;
} & ({
    operation: "insert";
    oldDoc: null;
    newDoc: DocumentByName<DataModel, TableName>;
} | {
    operation: "update";
    oldDoc: DocumentByName<DataModel, TableName>;
    newDoc: DocumentByName<DataModel, TableName>;
} | {
    operation: "delete";
    oldDoc: DocumentByName<DataModel, TableName>;
    newDoc: null;
});
export declare function btreeItemToAggregateItem<K extends Key, ID extends string>({ k, s, }: {
    k: unknown;
    s: number | Record<string, number>;
}): Item<K, ID>;
export type NamespacedArgs<Args, Namespace> = (Args & {
    namespace: Namespace;
}) | (Namespace extends undefined ? Args : never);
export type NamespacedOpts<Opts, Namespace> = [{
    namespace: Namespace;
} & Opts] | (undefined extends Namespace ? [Opts?] : never);
export type NamespacedOptsBatch<Opts, Namespace> = Array<undefined extends Namespace ? Opts : {
    namespace: Namespace;
} & Opts>;
//# sourceMappingURL=index.d.ts.map