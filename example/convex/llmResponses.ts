/**
 * Example: Tracking LLM Response Metrics with Multi-Sum Aggregates
 *
 * This example demonstrates how to use multi-sum aggregates to track multiple
 * metrics (citations and mentions) from LLM responses in a single B-tree.
 * This is more efficient than creating separate aggregates for each metric.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server.js";
import { DirectAggregate } from "../../src/client/index.js";
import { components } from "./_generated/api.js";

// Define the key structure: [userId, timestamp]
type LLMResponseKey = [userId: string, timestamp: number];

// Create a DirectAggregate for tracking LLM response metrics
const llmMetrics = new DirectAggregate<{
  Key: LLMResponseKey;
  Id: string;
}>(components.aggregate);

/**
 * Add a new LLM response with multiple metrics
 */
export const addResponse = mutation({
  args: {
    userId: v.string(),
    responseId: v.string(),
    citations: v.number(),
    mentions: v.number(),
  },
  handler: async (ctx, args) => {
    await llmMetrics.insert(ctx, {
      key: [args.userId, Date.now()],
      id: args.responseId,
      sumValues: {
        citations: args.citations,
        mentions: args.mentions,
      },
    });
  },
});

/**
 * Get total metrics for a specific user
 */
export const getUserMetrics = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const metrics = await llmMetrics.sum(ctx, {
      bounds: {
        lower: { key: [args.userId, 0] },
        upper: { key: [args.userId, Infinity] },
      },
    });

    // metrics is Record<string, number> with all tracked metrics
    if (typeof metrics === "number") {
      // This would only happen if old single-sum data exists
      return { total: metrics };
    }

    return {
      totalCitations: metrics.citations ?? 0,
      totalMentions: metrics.mentions ?? 0,
    };
  },
});

/**
 * Get metrics for a user within a time range
 */
export const getUserMetricsInRange = query({
  args: {
    userId: v.string(),
    startTime: v.number(),
    endTime: v.number(),
  },
  handler: async (ctx, args) => {
    const metrics = await llmMetrics.sum(ctx, {
      bounds: {
        lower: { key: [args.userId, args.startTime] },
        upper: { key: [args.userId, args.endTime] },
      },
    });

    if (typeof metrics === "number") {
      return { total: metrics };
    }

    return {
      citations: metrics.citations ?? 0,
      mentions: metrics.mentions ?? 0,
    };
  },
});

/**
 * Get metrics for multiple users in a single batch query
 */
export const getBatchUserMetrics = query({
  args: { userIds: v.array(v.string()) },
  handler: async (ctx, args) => {
    const allMetrics = await llmMetrics.sumBatch(
      ctx,
      args.userIds.map((userId) => ({
        bounds: {
          lower: { key: [userId, 0] as LLMResponseKey },
          upper: { key: [userId, Infinity] as LLMResponseKey },
        },
      }))
    );

    // allMetrics is Array<number | Record<string, number>>
    return args.userIds.map((userId, i) => {
      const metrics = allMetrics[i];

      if (typeof metrics === "number") {
        return { userId, total: metrics };
      }

      return {
        userId,
        citations: metrics.citations ?? 0,
        mentions: metrics.mentions ?? 0,
      };
    });
  },
});

/**
 * Count total responses for a user
 */
export const getUserResponseCount = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const count = await llmMetrics.count(ctx, {
      bounds: {
        lower: { key: [args.userId, 0] },
        upper: { key: [args.userId, Infinity] },
      },
    });

    return count;
  },
});

/**
 * Delete a response (e.g., when user deletes a conversation)
 */
export const deleteResponse = mutation({
  args: {
    userId: v.string(),
    responseId: v.string(),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    await llmMetrics.delete(ctx, {
      key: [args.userId, args.timestamp],
      id: args.responseId,
    });
  },
});

/**
 * Update a response's metrics (using replace)
 */
export const updateResponse = mutation({
  args: {
    userId: v.string(),
    responseId: v.string(),
    oldTimestamp: v.number(),
    newTimestamp: v.number(),
    citations: v.number(),
    mentions: v.number(),
  },
  handler: async (ctx, args) => {
    await llmMetrics.replace(
      ctx,
      {
        key: [args.userId, args.oldTimestamp],
        id: args.responseId,
      },
      {
        key: [args.userId, args.newTimestamp],
        sumValues: {
          citations: args.citations,
          mentions: args.mentions,
        },
      }
    );
  },
});
