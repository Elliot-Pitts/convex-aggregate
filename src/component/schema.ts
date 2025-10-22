import { defineSchema, defineTable } from "convex/server";
import { Value as ConvexValue, Infer, v } from "convex/values";

const item = v.object({
  // key, usually an index key.
  k: v.any(),
  // value, usually an id.
  v: v.any(),
  // summand, to be aggregated by summing.
  s: v.union(v.number(), v.record(v.string(), v.number())),
});

export type Item = {
  k: ConvexValue;
  v: ConvexValue;
  s: number | Record<string, number>;
};

export const itemValidator = v.object({
  k: v.any(),
  v: v.any(),
  s: v.union(v.number(), v.record(v.string(), v.number())),
});

export const aggregate = v.object({
  count: v.number(),
  sum: v.union(v.number(), v.record(v.string(), v.number())),
});

export type Aggregate = Infer<typeof aggregate>;

export default defineSchema({
  // One per namespace
  btree: defineTable({
    root: v.id("btreeNode"),
    namespace: v.optional(v.any()),
    maxNodeSize: v.number(),
    sumType: v.optional(v.union(v.literal("single"), v.literal("multi"))),
  }).index("by_namespace", ["namespace"]),
  btreeNode: defineTable({
    items: v.array(item),
    subtrees: v.array(v.id("btreeNode")),
    aggregate: v.optional(aggregate),
  }),
});
