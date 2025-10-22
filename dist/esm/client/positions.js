/**
 * The Aggregate API uses keys and IDs, where the keys are for sorting and
 * IDs are for tie-breaking uniqueness. The component's BTree API uses
 * positions, which are unique keys.
 */
// IDs are strings so in the Convex ordering, null < IDs < arrays.
const BEFORE_ALL_IDS = null;
const AFTER_ALL_IDS = [];
function explodeKey(key) {
    if (Array.isArray(key)) {
        const exploded = [""];
        for (const item of key) {
            exploded.push(item);
            exploded.push("");
        }
        return exploded;
    }
    return key;
}
function implodeKey(k) {
    if (Array.isArray(k)) {
        const imploded = [];
        for (let i = 1; i < k.length; i += 2) {
            imploded.push(k[i]);
        }
        return imploded;
    }
    return k;
}
export function keyToPosition(key, id) {
    return [explodeKey(key), id, ""];
}
export function positionToKey(position) {
    return { key: implodeKey(position[0]), id: position[1] };
}
export function boundsToPositions(bounds) {
    if (bounds === undefined) {
        return {};
    }
    if ("prefix" in bounds) {
        const prefix = bounds.prefix;
        const exploded = [];
        for (const item of prefix) {
            exploded.push("");
            exploded.push(item);
        }
        return {
            k1: [exploded.concat([BEFORE_ALL_IDS]), BEFORE_ALL_IDS, BEFORE_ALL_IDS],
            k2: [exploded.concat([AFTER_ALL_IDS]), AFTER_ALL_IDS, AFTER_ALL_IDS],
        };
    }
    return {
        k1: boundToPosition("lower", bounds.lower),
        k2: boundToPosition("upper", bounds.upper),
    };
}
export function boundToPosition(direction, bound) {
    if (bound === undefined) {
        return undefined;
    }
    if (direction === "lower") {
        return [
            explodeKey(bound.key),
            bound.id ?? (bound.inclusive ? BEFORE_ALL_IDS : AFTER_ALL_IDS),
            bound.inclusive ? BEFORE_ALL_IDS : AFTER_ALL_IDS,
        ];
    }
    else {
        return [
            explodeKey(bound.key),
            bound.id ?? (bound.inclusive ? AFTER_ALL_IDS : BEFORE_ALL_IDS),
            bound.inclusive ? AFTER_ALL_IDS : BEFORE_ALL_IDS,
        ];
    }
}
//# sourceMappingURL=positions.js.map