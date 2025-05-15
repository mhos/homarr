import { observable } from "@trpc/server/observable";

import type { UpsMonitorIntegration } from "@homarr/integrations";
import { createIntegrationAsync } from "@homarr/integrations";

import { createOneIntegrationMiddleware } from "../../middlewares/integration";
import { createTRPCRouter, publicProcedure } from "../../trpc";

export const upsMonitorRouter = createTRPCRouter({
  getUpsStatus: publicProcedure
    .concat(createOneIntegrationMiddleware("query", "upsMonitor"))
    .query(async ({ ctx }) => {
      const integration = await createIntegrationAsync({
        ...ctx.integration,
        kind: "upsMonitor",
      }) as UpsMonitorIntegration;
      
      const status = await integration.getHealthMonitoringAsync();
      
      return {
        integrationId: ctx.integration.id,
        integrationName: ctx.integration.name,
        upsData: status.upsData,
        updatedAt: new Date(),
      };
    }),
  
  subscribeUpsStatus: publicProcedure
    .concat(createOneIntegrationMiddleware("query", "upsMonitor"))
    .subscription(({ ctx }) => {
      return observable<{
        integrationId: string;
        upsData: any;
        timestamp: Date;
      }>((emit) => {
        // Set up polling interval
        const intervalId = setInterval(async () => {
          try {
            const integration = await createIntegrationAsync({
              ...ctx.integration,
              kind: "upsMonitor",
            }) as UpsMonitorIntegration;
            
            const status = await integration.getHealthMonitoringAsync();
            
            emit.next({
              integrationId: ctx.integration.id,
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