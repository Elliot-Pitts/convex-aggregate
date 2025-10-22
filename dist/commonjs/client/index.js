import { positionToKey, boundToPosition, keyToPosition, boundsToPositions, } from "./positions.js";
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
export class Aggregate {
    component;
    constructor(component) {
        this.component = component;
    }
    /// Aggregate queries.
    /**
     * Counts items between the given bounds.
     */
    async count(ctx, ...opts) {
        const { count } = await ctx.runQuery(this.component.btree.aggregateBetween, {
            ...boundsToPositions(opts[0]?.bounds),
            namespace: namespaceFromOpts(opts),
        });
        return count;
    }
    /**
     * Batch version of count() - counts items for multiple bounds in a single call.
     */
    async countBatch(ctx, queries) {
        const queryArgs = queries.map((query) => {
            if (!query) {
                throw new Error("You must pass bounds and/or namespace");
            }
            const namespace = namespaceFromArg(query);
            const { k1, k2 } = boundsToPositions(query.bounds);
            return { k1, k2, namespace };
        });
        const results = await ctx.runQuery(this.component.btree.aggregateBetweenBatch, {
            queries: queryArgs,
        });
        return results.map((result) => result.count);
    }
    /**
     * Adds up the sumValue of items between the given bounds.
     */
    async sum(ctx, ...opts) {
        const { sum } = await ctx.runQuery(this.component.btree.aggregateBetween, {
            ...boundsToPositions(opts[0]?.bounds),
            namespace: namespaceFromOpts(opts),
        });
        return sum;
    }
    /**
     * Batch version of sum() - sums items for multiple bounds in a single call.
     */
    async sumBatch(ctx, queries) {
        const queryArgs = queries.map((query) => {
            if (!query) {
                throw new Error("You must pass bounds and/or namespace");
            }
            const namespace = namespaceFromArg(query);
            const { k1, k2 } = boundsToPositions(query.bounds);
            return { k1, k2, namespace };
        });
        const results = await ctx.runQuery(this.component.btree.aggregateBetweenBatch, {
            queries: queryArgs,
        });
        return results.map((result) => result.sum);
    }
    /**
     * Returns the item at the given offset/index/rank in the order of key,
     * within the bounds. Zero-indexed, so at(0) is the smallest key within the
     * bounds.
     *
     * If offset is negative, it counts from the end of the list, so at(-1) is the
     * item with the largest key within the bounds.
     */
    async at(ctx, offset, ...opts) {
        if (offset < 0) {
            const item = await ctx.runQuery(this.component.btree.atNegativeOffset, {
                offset: -offset - 1,
                namespace: namespaceFromOpts(opts),
                ...boundsToPositions(opts[0]?.bounds),
            });
            return btreeItemToAggregateItem(item);
        }
        const item = await ctx.runQuery(this.component.btree.atOffset, {
            offset,
            namespace: namespaceFromOpts(opts),
            ...boundsToPositions(opts[0]?.bounds),
        });
        return btreeItemToAggregateItem(item);
    }
    /**
     * Batch version of at() - returns items at multiple offsets in a single call.
     */
    async atBatch(ctx, queries) {
        const queryArgs = queries.map((q) => ({
            offset: q.offset,
            ...boundsToPositions(q.bounds),
            namespace: namespaceFromArg(q),
        }));
        const results = await ctx.runQuery(this.component.btree.atOffsetBatch, {
            queries: queryArgs,
        });
        return results.map((btreeItemToAggregateItem));
    }
    /**
     * Returns the rank/offset/index of the given key, within the bounds.
     * Specifically, it returns the index of the first item with
     *
     * - key >= the given key if `order` is "asc" (default)
     * - key <= the given key if `order` is "desc"
     */
    async indexOf(ctx, key, ...opts) {
        const { k1, k2 } = boundsToPositions(opts[0]?.bounds);
        if (opts[0]?.order === "desc") {
            return await ctx.runQuery(this.component.btree.offsetUntil, {
                key: boundToPosition("upper", {
                    key,
                    id: opts[0]?.id,
                    inclusive: true,
                }),
                k2,
                namespace: namespaceFromOpts(opts),
            });
        }
        return await ctx.runQuery(this.component.btree.offset, {
            key: boundToPosition("lower", { key, id: opts[0]?.id, inclusive: true }),
            k1,
            namespace: namespaceFromOpts(opts),
        });
    }
    /**
     * @deprecated Use `indexOf` instead.
     */
    async offsetOf(ctx, key, namespace, id, bounds) {
        return this.indexOf(ctx, key, { id, bounds, order: "asc", namespace });
    }
    /**
     * @deprecated Use `indexOf` instead.
     */
    async offsetUntil(ctx, key, namespace, id, bounds) {
        return this.indexOf(ctx, key, { id, bounds, order: "desc", namespace });
    }
    /**
     * Gets the minimum item within the given bounds.
     */
    async min(ctx, ...opts) {
        const { page } = await this.paginate(ctx, {
            namespace: namespaceFromOpts(opts),
            bounds: opts[0]?.bounds,
            order: "asc",
            pageSize: 1,
        });
        return page[0] ?? null;
    }
    /**
     * Gets the maximum item within the given bounds.
     */
    async max(ctx, ...opts) {
        const { page } = await this.paginate(ctx, {
            namespace: namespaceFromOpts(opts),
            bounds: opts[0]?.bounds,
            order: "desc",
            pageSize: 1,
        });
        return page[0] ?? null;
    }
    /**
     * Gets a uniformly random item within the given bounds.
     */
    async random(ctx, ...opts) {
        const count = await this.count(ctx, ...opts);
        if (count === 0) {
            return null;
        }
        const index = Math.floor(Math.random() * count);
        return await this.at(ctx, index, ...opts);
    }
    /**
     * Get a page of items between the given bounds, with a cursor to paginate.
     * Use `iter` to iterate over all items within the bounds.
     */
    async paginate(ctx, ...opts) {
        const order = opts[0]?.order ?? "asc";
        const pageSize = opts[0]?.pageSize ?? 100;
        const { page, cursor: newCursor, isDone, } = await ctx.runQuery(this.component.btree.paginate, {
            namespace: namespaceFromOpts(opts),
            ...boundsToPositions(opts[0]?.bounds),
            cursor: opts[0]?.cursor,
            order,
            limit: pageSize,
        });
        return {
            page: page.map((btreeItemToAggregateItem)),
            cursor: newCursor,
            isDone,
        };
    }
    /**
     * Example usage:
     * ```ts
     * for await (const item of aggregate.iter(ctx, bounds)) {
     *   console.log(item);
     * }
     * ```
     */
    async *iter(ctx, ...opts) {
        const order = opts[0]?.order ?? "asc";
        const pageSize = opts[0]?.pageSize ?? 100;
        const bounds = opts[0]?.bounds;
        const namespace = namespaceFromOpts(opts);
        let isDone = false;
        let cursor = undefined;
        while (!isDone) {
            const { page, cursor: newCursor, isDone: newIsDone, } = await this.paginate(ctx, {
                namespace,
                bounds,
                cursor,
                order,
                pageSize,
            });
            for (const item of page) {
                yield item;
            }
            isDone = newIsDone;
            cursor = newCursor;
        }
    }
    /** Write operations. See {@link DirectAggregate} for docstrings. */
    async _insert(ctx, namespace, key, id, summand) {
        await ctx.runMutation(this.component.public.insert, {
            key: keyToPosition(key, id),
            summand,
            value: id,
            namespace,
        });
    }
    async _delete(ctx, namespace, key, id) {
        await ctx.runMutation(this.component.public.delete_, {
            key: keyToPosition(key, id),
            namespace,
        });
    }
    async _replace(ctx, currentNamespace, currentKey, newNamespace, newKey, id, summand) {
        await ctx.runMutation(this.component.public.replace, {
            currentKey: keyToPosition(currentKey, id),
            newKey: keyToPosition(newKey, id),
            summand,
            value: id,
            namespace: currentNamespace,
            newNamespace,
        });
    }
    async _insertIfDoesNotExist(ctx, namespace, key, id, summand) {
        await this._replaceOrInsert(ctx, namespace, key, namespace, key, id, summand);
    }
    async _deleteIfExists(ctx, namespace, key, id) {
        await ctx.runMutation(this.component.public.deleteIfExists, {
            key: keyToPosition(key, id),
            namespace,
        });
    }
    async _replaceOrInsert(ctx, currentNamespace, currentKey, newNamespace, newKey, id, summand) {
        await ctx.runMutation(this.component.public.replaceOrInsert, {
            currentKey: keyToPosition(currentKey, id),
            newKey: keyToPosition(newKey, id),
            summand,
            value: id,
            namespace: currentNamespace,
            newNamespace,
        });
    }
    /// Initialization and maintenance.
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
    async clear(ctx, ...opts) {
        await ctx.runMutation(this.component.public.clear, {
            maxNodeSize: opts[0]?.maxNodeSize,
            rootLazy: opts[0]?.rootLazy,
            namespace: namespaceFromOpts(opts),
        });
    }
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
    async makeRootLazy(ctx, namespace) {
        await ctx.runMutation(this.component.public.makeRootLazy, { namespace });
    }
    async paginateNamespaces(ctx, cursor, pageSize = 100) {
        const { page, cursor: newCursor, isDone, } = await ctx.runQuery(this.component.btree.paginateNamespaces, {
            cursor,
            limit: pageSize,
        });
        return {
            page: page,
            cursor: newCursor,
            isDone,
        };
    }
    async *iterNamespaces(ctx, pageSize = 100) {
        let isDone = false;
        let cursor = undefined;
        while (!isDone) {
            const { page, cursor: newCursor, isDone: newIsDone, } = await this.paginateNamespaces(ctx, cursor, pageSize);
            for (const item of page) {
                yield item ?? undefined;
            }
            isDone = newIsDone;
            cursor = newCursor;
        }
    }
    async clearAll(ctx, opts) {
        for await (const namespace of this.iterNamespaces(ctx)) {
            await this.clear(ctx, { ...opts, namespace });
        }
        // In case there are no namespaces, make sure we create at least one tree,
        // at namespace=undefined. This is where the default settings are stored.
        await this.clear(ctx, { ...opts, namespace: undefined });
    }
    async makeAllRootsLazy(ctx) {
        for await (const namespace of this.iterNamespaces(ctx)) {
            await this.makeRootLazy(ctx, namespace);
        }
    }
}
/**
 * A DirectAggregate is an Aggregate where you can insert, delete, and replace
 * items directly, and keys and IDs can be customized.
 *
 * Contrast with TableAggregate, which follows a table with Triggers and
 * computes keys and sumValues from the table's documents.
 */
export class DirectAggregate extends Aggregate {
    /**
     * Insert a new key into the data structure.
     * The id should be unique.
     * If not provided, the sumValue is assumed to be zero.
     * If the tree does not exist yet, it will be initialized with the default
     * maxNodeSize and lazyRoot=true.
     * If the [key, id] pair already exists, this will throw.
     */
    async insert(ctx, args) {
        // Validation: can't provide both
        if (args.sumValue !== undefined && args.sumValues !== undefined) {
            throw new Error("Cannot provide both sumValue and sumValues");
        }
        // Determine what to pass as summand
        const summand = args.sumValues !== undefined ? args.sumValues : args.sumValue;
        await this._insert(ctx, namespaceFromArg(args), args.key, args.id, summand);
    }
    /**
     * Delete the key with the given ID from the data structure.
     * Throws if the given key and ID do not exist.
     */
    async delete(ctx, args) {
        await this._delete(ctx, namespaceFromArg(args), args.key, args.id);
    }
    /**
     * Update an existing item in the data structure.
     * This is effectively a delete followed by an insert, but it's performed
     * atomically so it's impossible to view the data structure with the key missing.
     */
    async replace(ctx, currentItem, newItem) {
        // Validation: can't provide both
        if (newItem.sumValue !== undefined && newItem.sumValues !== undefined) {
            throw new Error("Cannot provide both sumValue and sumValues");
        }
        const summand = newItem.sumValues !== undefined ? newItem.sumValues : newItem.sumValue;
        await this._replace(ctx, namespaceFromArg(currentItem), currentItem.key, namespaceFromArg(newItem), newItem.key, currentItem.id, summand);
    }
    /**
     * Equivalents to `insert`, `delete`, and `replace` where the item may or may not exist.
     * This can be useful for live backfills:
     * 1. Update live writes to use these methods to write into the new Aggregate.
     * 2. Run a background backfill, paginating over existing data, calling `insertIfDoesNotExist` on each item.
     * 3. Once the backfill is complete, use `insert`, `delete`, and `replace` for live writes.
     * 4. Begin using the Aggregate read methods.
     */
    async insertIfDoesNotExist(ctx, args) {
        // Validation: can't provide both
        if (args.sumValue !== undefined && args.sumValues !== undefined) {
            throw new Error("Cannot provide both sumValue and sumValues");
        }
        const summand = args.sumValues !== undefined ? args.sumValues : args.sumValue;
        await this._insertIfDoesNotExist(ctx, namespaceFromArg(args), args.key, args.id, summand);
    }
    async deleteIfExists(ctx, args) {
        await this._deleteIfExists(ctx, namespaceFromArg(args), args.key, args.id);
    }
    async replaceOrInsert(ctx, currentItem, newItem) {
        // Validation: can't provide both
        if (newItem.sumValue !== undefined && newItem.sumValues !== undefined) {
            throw new Error("Cannot provide both sumValue and sumValues");
        }
        const summand = newItem.sumValues !== undefined ? newItem.sumValues : newItem.sumValue;
        await this._replaceOrInsert(ctx, namespaceFromArg(currentItem), currentItem.key, namespaceFromArg(newItem), newItem.key, currentItem.id, summand);
    }
}
export class TableAggregate extends Aggregate {
    options;
    constructor(component, options) {
        super(component);
        this.options = options;
    }
    async insert(ctx, doc) {
        // Determine what to pass as summand
        const summand = this.options.sumValues?.(doc) ?? this.options.sumValue?.(doc);
        await this._insert(ctx, this.options.namespace?.(doc), this.options.sortKey(doc), doc._id, summand);
    }
    async delete(ctx, doc) {
        await this._delete(ctx, this.options.namespace?.(doc), this.options.sortKey(doc), doc._id);
    }
    async replace(ctx, oldDoc, newDoc) {
        const summand = this.options.sumValues?.(newDoc) ?? this.options.sumValue?.(newDoc);
        await this._replace(ctx, this.options.namespace?.(oldDoc), this.options.sortKey(oldDoc), this.options.namespace?.(newDoc), this.options.sortKey(newDoc), newDoc._id, summand);
    }
    async insertIfDoesNotExist(ctx, doc) {
        const summand = this.options.sumValues?.(doc) ?? this.options.sumValue?.(doc);
        await this._insertIfDoesNotExist(ctx, this.options.namespace?.(doc), this.options.sortKey(doc), doc._id, summand);
    }
    async deleteIfExists(ctx, doc) {
        await this._deleteIfExists(ctx, this.options.namespace?.(doc), this.options.sortKey(doc), doc._id);
    }
    async replaceOrInsert(ctx, oldDoc, newDoc) {
        const summand = this.options.sumValues?.(newDoc) ?? this.options.sumValue?.(newDoc);
        await this._replaceOrInsert(ctx, this.options.namespace?.(oldDoc), this.options.sortKey(oldDoc), this.options.namespace?.(newDoc), this.options.sortKey(newDoc), newDoc._id, summand);
    }
    /**
     * Returns the rank/offset/index of the given document, within the bounds.
     * This differs from `indexOf` in that it take the document rather than key.
     * Specifically, it returns the index of the first item with
     *
     * - key >= the given doc's key if `order` is "asc" (default)
     * - key <= the given doc's key if `order` is "desc"
     */
    async indexOfDoc(ctx, doc, opts) {
        const key = this.options.sortKey(doc);
        return this.indexOf(ctx, key, {
            namespace: this.options.namespace?.(doc),
            ...opts,
        });
    }
    trigger() {
        return async (ctx, change) => {
            if (change.operation === "insert") {
                await this.insert(ctx, change.newDoc);
            }
            else if (change.operation === "update") {
                await this.replace(ctx, change.oldDoc, change.newDoc);
            }
            else if (change.operation === "delete") {
                await this.delete(ctx, change.oldDoc);
            }
        };
    }
    idempotentTrigger() {
        return async (ctx, change) => {
            if (change.operation === "insert") {
                await this.insertIfDoesNotExist(ctx, change.newDoc);
            }
            else if (change.operation === "update") {
                await this.replaceOrInsert(ctx, change.oldDoc, change.newDoc);
            }
            else if (change.operation === "delete") {
                await this.deleteIfExists(ctx, change.oldDoc);
            }
        };
    }
}
export function btreeItemToAggregateItem({ k, s, }) {
    const { key, id } = positionToKey(k);
    if (typeof s === "number") {
        return {
            key: key,
            id: id,
            sumValue: s,
        };
    }
    else {
        return {
            key: key,
            id: id,
            sumValue: 0,
            sumValues: s,
        };
    }
}
function namespaceFromArg(args) {
    if ("namespace" in args) {
        return args["namespace"];
    }
    return undefined;
}
function namespaceFromOpts(opts) {
    if (opts.length === 0) {
        // Only possible if Namespace extends undefined, so undefined is the only valid namespace.
        return undefined;
    }
    const [{ namespace }] = opts;
    return namespace;
}
//# sourceMappingURL=index.js.map