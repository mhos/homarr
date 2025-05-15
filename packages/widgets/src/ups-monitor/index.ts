import { IconBolt } from "@tabler/icons-react";

import { createWidgetDefinition } from "../definition";
import { optionsBuilder } from "../options";

export const { definition, withDynamicImport } = createWidgetDefinition("upsMonitor", {
  icon: IconBolt,
  supportedIntegrations: ["upsMonitor"],
  integrationsRequired: true,
  createOptions: (settings) => ({
    refreshInterval: optionsBuilder.number({
      defaultValue: settings.defaultOptions?.refreshInterval ?? 30,
      label: "widget.upsMonitor.option.refreshInterval.label",
      description: "widget.upsMonitor.option.refreshInterval.description",
      min: 10,
      step: 5,
    }),
    showAdvanced: optionsBuilder.switch({
      defaultValue: settings.defaultOptions?.showAdvanced ?? false,
      label: "widget.upsMonitor.option.showAdvanced.label",
      description: "widget.upsMonitor.option.showAdvanced.description",
    }),
  }),
});