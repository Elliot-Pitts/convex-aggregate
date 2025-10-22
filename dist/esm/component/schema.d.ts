import { Value as ConvexValue, Infer } from "convex/values";
export type Item = {
    k: ConvexValue;
    v: ConvexValue;
    s: number | Record<string, number>;
};
export declare const itemValidator: import("convex/values").VObject<{
    k: any;
    v: any;
    s: number | Record<string, number>;
}, {
    k: import("convex/values").VAny<any, "required", string>;
    v: import("convex/values").VAny<any, "required", string>;
    s: import("convex/values").VUnion<number | Record<string, number>, [import("convex/values").VFloat64<number, "required">, import("convex/values").VRecord<Record<string, number>, import("convex/values").VString<string, "required">, import("convex/values").VFloat64<number, "required">, "required", string>], "required", string>;
}, "required", "k" | "v" | "s" | `k.${string}` | `v.${string}` | `s.${string}`>;
export declare const aggregate: import("convex/values").VObject<{
    count: number;
    sum: number | Record<string, number>;
}, {
    count: import("convex/values").VFloat64<number, "required">;
    sum: import("convex/values").VUnion<number | Record<string, number>, [import("convex/values").VFloat64<number, "required">, import("convex/values").VRecord<Record<string, number>, import("convex/values").VString<string, "required">, import("convex/values").VFloat64<number, "required">, "required", string>], "required", string>;
}, "required", "count" | "sum" | `sum.${string}`>;
export type Aggregate = Infer<typeof aggregate>;
declare const _default: import("convex/server").SchemaDefinition<{
    btree: import("convex/server").TableDefinition<import("convex/values").VObject<{
        namespace?: any;
        sumType?: "single" | "multi" | undefined;
        root: import("convex/values").GenericId<"btreeNode">;
        maxNodeSize: number;
    }, {
        root: import("convex/values").VId<import("convex/values").GenericId<"btreeNode">, "required">;
        namespace: import("convex/values").VAny<any, "optional", string>;
        maxNodeSize: import("convex/values").VFloat64<number, "required">;
        sumType: import("convex/values").VUnion<"single" | "multi" | undefined, [import("convex/values").VLiteral<"single", "required">, import("convex/values").VLiteral<"multi", "required">], "optional", never>;
    }, "required", "root" | "namespace" | "maxNodeSize" | "sumType" | `namespace.${string}`>, {
        by_namespace: ["namespace", "_creationTime"];
    }, {}, {}>;
    btreeNode: import("convex/server").TableDefinition<import("convex/values").VObject<{
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
    }, {
        items: import("convex/values").VArray<{
            k: any;
            v: any;
            s: number | Record<string, number>;
        }[], import("convex/values").VObject<{
            k: any;
            v: any;
            s: number | Record<string, number>;
        }, {
            k: import("convex/values").VAny<any, "required", string>;
            v: import("convex/values").VAny<any, "required", string>;
            s: import("convex/values").VUnion<number | Record<string, number>, [import("convex/values").VFloat64<number, "required">, import("convex/values").VRecord<Record<string, number>, import("convex/values").VString<string, "required">, import("convex/values").VFloat64<number, "required">, "required", string>], "required", string>;
        }, "required", "k" | "v" | "s" | `k.${string}` | `v.${string}` | `s.${string}`>, "required">;
        subtrees: import("convex/values").VArray<import("convex/values").GenericId<"btreeNode">[], import("convex/values").VId<import("convex/values").GenericId<"btreeNode">, "required">, "required">;
        aggregate: import("convex/values").VObject<{
            count: number;
            sum: number | Record<string, number>;
        } | undefined, {
            count: import("convex/values").VFloat64<number, "required">;
            sum: import("convex/values").VUnion<number | Record<string, number>, [import("convex/values").VFloat64<number, "required">, import("convex/values").VRecord<Record<string, number>, import("convex/values").VString<string, "required">, import("convex/values").VFloat64<number, "required">, "required", string>], "required", string>;
        }, "optional", "count" | "sum" | `sum.${string}`>;
    }, "required", "items" | "subtrees" | "aggregate" | "aggregate.count" | "aggregate.sum" | `aggregate.sum.${string}`>, {}, {}, {}>;
}, true>;
export default _default;
//# sourceMappingURL=schema.d.ts.map