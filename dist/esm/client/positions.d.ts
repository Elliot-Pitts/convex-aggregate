/**
 * The Aggregate API uses keys and IDs, where the keys are for sorting and
 * IDs are for tie-breaking uniqueness. The component's BTree API uses
 * positions, which are unique keys.
 */
import { Key } from "../component/btree.js";
export type Bound<K extends Key, ID extends string> = {
    key: K;
    id?: ID;
    inclusive: boolean;
};
export type SideBounds<K extends Key, ID extends string> = {
    lower?: Bound<K, ID>;
    upper?: Bound<K, ID>;
};
export type TuplePrefix<K extends unknown[], P extends unknown[] = []> = P["length"] extends K["length"] ? P : P | TuplePrefix<K, [...P, K[P["length"]]]>;
export type Bounds<K extends Key, ID extends string> = SideBounds<K, ID> | {
    prefix: TuplePrefix<Extract<K, unknown[]>>;
};
export type Position = [Key, string | null | never[], "" | null | never[]];
export declare function keyToPosition<K extends Key, ID extends string>(key: K, id: ID): Position;
export declare function positionToKey<K extends Key, ID extends string>(position: Position): {
    key: K;
    id: ID;
};
export declare function boundsToPositions<K extends Key, ID extends string>(bounds?: Bounds<K, ID>): {
    k1?: Position;
    k2?: Position;
};
export declare function boundToPosition<K extends Key, ID extends string>(direction: "lower" | "upper", bound: Bound<K, ID>): Position;
export declare function boundToPosition(direction: "lower" | "upper"): undefined;
export declare function boundToPosition<K extends Key, ID extends string>(direction: "lower" | "upper", bound?: Bound<K, ID>): Position | undefined;
//# sourceMappingURL=positions.d.ts.map