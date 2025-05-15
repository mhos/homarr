import { IconBolt } from "@tabler/icons-react";

import { createWidgetDefinition } from "../definition";
import { optionsBuilder } from "../options";

export const { definition, componentLoader } = createWidgetDefinition("upsMonitor", {
  icon: IconBolt,
  supportedIntegrations: ["upsMonitor"],
  integrationsRequired: true,
  createOptions() {
    return optionsBuilder.from((factory) => ({
      refreshInterval: factory.number({
        defaultValue: 30,
        label: "widget.upsMonitor.option.refreshInterval.label",
        withDescription: true,
        min: 10,
        step: 5,
      }),
      showAdvanced: factory.switch({
        defaultValue: false,
        label: "widget.upsMonitor.option.showAdvanced.label",
        withDescription: true,
      }),
    }));
  },
}).withDynamicImport(() => import("./component"));