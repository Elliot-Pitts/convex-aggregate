/**
 * Example: Product Analytics with TableAggregate Multi-Sum
 *
 * This example demonstrates how to use TableAggregate with multi-sum aggregates
 * to track multiple metrics (views, purchases, revenue) for products over time.
 * Using a single aggregate for all metrics is more efficient than creating
 * separate aggregates for each metric.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server.js";
import { TableAggregate } from "../../src/client/index.js";
import { components } from "./_generated/api.js";

// Define your schema in schema.ts:
// productEvents: defineTable({
//   productId: v.string(),
//   timestamp: v.number(),
//   views: v.number(),
//   purchases: v.number(),
//   revenue: v.number(),
// }).index("by_product", ["productId", "timestamp"]),

// Create a TableAggregate for tracking product metrics
const productMetrics = new TableAggregate<{
  Key: [productId: string, timestamp: number];
  DataModel: any; // Replace with your actual DataModel type
  TableName: "productEvents";
}>(components.aggregate, {
  sortKey: (doc) => [doc.productId, doc.timestamp],
  sumValues: (doc) => ({
    views: doc.views,
    purchases: doc.purchases,
    revenue: doc.revenue,
  }),
});

/**
 * Record a product event (views, purchases, revenue)
 */
export const recordProductEvent = mutation({
  args: {
    productId: v.string(),
    views: v.number(),
    purchases: v.number(),
    revenue: v.number(),
  },
  handler: async (ctx, args) => {
    // Insert into the database
    const eventId = await ctx.db.insert("productEvents", {
      productId: args.productId,
      timestamp: Date.now(),
      views: args.views,
      purchases: args.purchases,
      revenue: args.revenue,
    });

    // Add to the aggregate
    const event = await ctx.db.get(eventId);
    if (event) {
      await productMetrics.insert(ctx, event);
    }
  },
});

/**
 * Get total metrics for a specific product
 */
export const getProductMetrics = query({
  args: { productId: v.string() },
  handler: async (ctx, args) => {
    const metrics = await productMetrics.sum(ctx, {
      bounds: {
        lower: { key: [args.productId, 0] },
        upper: { key: [args.productId, Infinity] },
      },
    });

    // metrics is Record<string, number> with all tracked metrics
    if (typeof metrics === "number") {
      // This would only happen if old single-sum data exists
      return { total: metrics };
    }

    return {
      totalViews: metrics.views ?? 0,
      totalPurchases: metrics.purchases ?? 0,
      totalRevenue: metrics.revenue ?? 0,
      conversionRate:
        metrics.views > 0
          ? ((metrics.purchases / metrics.views) * 100).toFixed(2) + "%"
          : "0%",
    };
  },
});

/**
 * Get metrics for a product within a time range
 */
export const getProductMetricsInRange = query({
  args: {
    productId: v.string(),
    startTime: v.number(),
    endTime: v.number(),
  },
  handler: async (ctx, args) => {
    const metrics = await productMetrics.sum(ctx, {
      bounds: {
        lower: { key: [args.productId, args.startTime] },
        upper: { key: [args.productId, args.endTime] },
      },
    });

    if (typeof metrics === "number") {
      return { total: metrics };
    }

    return {
      views: metrics.views ?? 0,
      purchases: metrics.purchases ?? 0,
      revenue: metrics.revenue ?? 0,
    };
  },
});

/**
 * Get metrics for multiple products in a single batch query
 */
export const getBatchProductMetrics = query({
  args: { productIds: v.array(v.string()) },
  handler: async (ctx, args) => {
    const allMetrics = await productMetrics.sumBatch(
      ctx,
      args.productIds.map((productId) => ({
        bounds: {
          lower: { key: [productId, 0] as [string, number] },
          upper: { key: [productId, Infinity] as [string, number] },
        },
      }))
    );

    // allMetrics is Array<number | Record<string, number>>
    return args.productIds.map((productId, i) => {
      const metrics = allMetrics[i];

      if (typeof metrics === "number") {
        return { productId, total: metrics };
      }

      return {
        productId,
        views: metrics.views ?? 0,
        purchases: metrics.purchases ?? 0,
        revenue: metrics.revenue ?? 0,
      };
    });
  },
});

/**
 * Get total event count for a product
 */
export const getProductEventCount = query({
  args: { productId: v.string() },
  handler: async (ctx, args) => {
    const count = await productMetrics.count(ctx, {
      bounds: {
        lower: { key: [args.productId, 0] },
        upper: { key: [args.productId, Infinity] },
      },
    });

    return count;
  },
});

/**
 * Update a product event (e.g., when correcting data)
 */
export const updateProductEvent = mutation({
  args: {
    eventId: v.id("productEvents"),
    views: v.number(),
    purchases: v.number(),
    revenue: v.number(),
  },
  handler: async (ctx, args) => {
    const oldEvent = await ctx.db.get(args.eventId);
    if (!oldEvent) {
      throw new Error("Event not found");
    }

    // Update the database
    await ctx.db.patch(args.eventId, {
      views: args.views,
      purchases: args.purchases,
      revenue: args.revenue,
    });

    const newEvent = await ctx.db.get(args.eventId);
    if (!newEvent) {
      throw new Error("Event not found after update");
    }

    // Replace in the aggregate
    await productMetrics.replace(ctx, oldEvent, newEvent);
  },
});

/**
 * Delete a product event
 */
export const deleteProductEvent = mutation({
  args: { eventId: v.id("productEvents") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    // Delete from the aggregate first
    await productMetrics.delete(ctx, event);

    // Then delete from the database
    await ctx.db.delete(args.eventId);
  },
});

/**
 * Get top performing products by revenue in a time range
 */
export const getTopProductsByRevenue = query({
  args: {
    startTime: v.number(),
    endTime: v.number(),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    // Get all unique product IDs in the time range
    const events = await ctx.db
      .query("productEvents")
      .filter((q) =>
        q.and(
          q.gte(q.field("timestamp"), args.startTime),
          q.lte(q.field("timestamp"), args.endTime)
        )
      )
      .collect();

    const uniqueProductIds = [
      ...new Set(events.map((event) => event.productId)),
    ];

    if (uniqueProductIds.length === 0) {
      return [];
    }

    // Batch query metrics for all products
    const allMetrics = await productMetrics.sumBatch(
      ctx,
      uniqueProductIds.map((productId) => ({
        bounds: {
          lower: { key: [productId, args.startTime] as [string, number] },
          upper: { key: [productId, args.endTime] as [string, number] },
        },
      }))
    );

    // Combine and sort by revenue
    const productStats = uniqueProductIds
      .map((productId, i) => {
        const metrics = allMetrics[i];
        if (typeof metrics === "number") {
          return { productId, revenue: metrics };
        }
        return {
          productId,
          views: metrics.views ?? 0,
          purchases: metrics.purchases ?? 0,
          revenue: metrics.revenue ?? 0,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, args.limit);

    return productStats;
  },
});
