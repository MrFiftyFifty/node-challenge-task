import { z } from 'zod';

// Zod schema for token price update message
export const tokenPriceUpdateMessageSchema = z.object({
  tokenId: z.string().uuid(),
  symbol: z.string().min(1),
  oldPrice: z.number().nonnegative(),
  newPrice: z.number().nonnegative(),
  timestamp: z.date(),
});

// Type derived from the schema
export type TokenPriceUpdateMessage = z.infer<typeof tokenPriceUpdateMessageSchema>;

// Helper function to create a validated message
export function createTokenPriceUpdateMessage(data: {
  tokenId: string;
  symbol: string;
  oldPrice: number;
  newPrice: number;
  timestamp?: Date;
}): TokenPriceUpdateMessage {
  return tokenPriceUpdateMessageSchema.parse({
    ...data,
    timestamp: data.timestamp || new Date(),
  });
}
