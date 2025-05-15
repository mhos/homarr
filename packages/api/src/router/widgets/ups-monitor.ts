import { observable } from "@trpc/server/observable";
import { z } from "zod";

import { decryptSecret } from "@homarr/common/server";
import { eq } from "@homarr/db";
import { integrations } from "@homarr/db/schema";
import type { UpsMonitorIntegration } from "@homarr/integrations";
import { createIntegrationAsync } from "@homarr/integrations";

import { createOneIntegrationMiddleware } from "../../middlewares/integration";
import { createTRPCRouter, publicProcedure } from "../../trpc";

export const upsMonitorRouter = createTRPCRouter({
  getUpsStatus: publicProcedure
    .input(
      z.object({
        integrationId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Get the integration from the database
      const integration = await ctx.db.query.integrations.findFirst({
        where: (integrations, { eq }) => eq(integrations.id, input.integrationId),
        with: {
          secrets: true,
        },
      });

      if (!integration || integration.kind !== "upsMonitor") {
        throw new Error("Invalid integration");
      }

      // Create the integration instance
      const upsIntegration = await createIntegrationAsync({
        ...integration,
        kind: "upsMonitor",
        decryptedSecrets: integration.secrets.map((secret) => ({
          ...secret,
          value: decryptSecret(secret.value),
        })),
      }) as UpsMonitorIntegration;
      
      const status = await upsIntegration.getHealthMonitoringAsync();
      
      return {
        integrationId: integration.id,
        integrationName: integration.name,
        upsData: status.upsData,
        updatedAt: new Date(),
      };
    }),
  
  subscribeUpsStatus: publicProcedure
    .input(
      z.object({
        integrationId: z.string(),
      })
    )
    .subscription(({ input, ctx }) => {
      return observable<{
        integrationId: string;
        upsData: any;
        timestamp: Date;
      }>((emit) => {
        // Set up polling interval
        const intervalId = setInterval(async () => {
          try {
            const integration = await ctx.db.query.integrations.findFirst({
              where: (integrations, { eq }) => eq(integrations.id, input.integrationId),
              with: {
                secrets: true,
              },
            });

            if (!integration || integration.kind !== "upsMonitor") {
              return;
            }

            const upsIntegration = await createIntegrationAsync({
              ...integration,
              kind: "upsMonitor",
              decryptedSecrets: integration.secrets.map((secret) => ({
                ...secret,
                value: decryptSecret(secret.value),
              })),
            }) as UpsMonitorIntegration;
            
            const status = await upsIntegration.getHealthMonitoringAsync();
            
            emit.next({
              integrationId: integration.id,
              upsData: status.upsData,
              timestamp: new Date(),
            });
          } catch (error) {
            console.error("Error fetching UPS status:", error);
          }
        }, 30000); // Poll every 30 seconds
        
        // Return cleanup function
        return () => {
          clearInterval(intervalId);
        };
      });
    }),
});