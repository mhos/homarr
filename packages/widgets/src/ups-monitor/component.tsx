"use client";

import { Box, Card, Group, Progress, Stack, Text, Badge, Title, Loader } from "@mantine/core";
import { IconBolt, IconBattery, IconTemperature, IconPlugConnected } from "@tabler/icons-react";

import { clientApi } from "@homarr/api/client";
import { useI18n } from "@homarr/translation/client";

import type { WidgetComponentProps } from "../definition";

export default function UpsMonitorWidget({ integrationIds }: WidgetComponentProps<"upsMonitor">) {
  const t = useI18n();
  
  // Check if we have any integration IDs
  if (!integrationIds || integrationIds.length === 0) {
    return (
      <Card h="100%">
        <Text c="dimmed">{t("widget.common.error.noIntegrationSelected")}</Text>
      </Card>
    );
  }

  const { data: integrations, isLoading: integrationsLoading } = clientApi.integration.byIds.useQuery(integrationIds);
  
  const upsIntegration = integrations?.find((integration) => integration.kind === "upsMonitor");
  
  if (integrationsLoading) {
    return (
      <Card h="100%">
        <Group justify="center" h="100%">
          <Loader />
        </Group>
      </Card>
    );
  }
  
  if (!upsIntegration) {
    return (
      <Card h="100%">
        <Text c="dimmed">No UPS Monitor integration found</Text>
      </Card>
    );
  }

  // Fetch UPS data using the first integration
  const { data, isLoading, error } = clientApi.widget.upsMonitor.getUpsStatus.useQuery({
    integrationId: integrationIds[0],
  });

  if (isLoading) {
    return (
      <Card h="100%">
        <Group justify="center" h="100%">
          <Loader />
        </Group>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card h="100%">
        <Text c="dimmed">Error loading UPS data</Text>
      </Card>
    );
  }

  const upsData = data.upsData;

  const getStatusBadgeColor = (status: string) => {
    if (status.includes("OL")) return "green"; // Online
    if (status.includes("OB")) return "yellow"; // On Battery
    if (status.includes("LB")) return "red"; // Low Battery
    return "gray";
  };

  const getStatusText = (status: string) => {
    if (status.includes("OL")) return t("widget.upsMonitor.statusOnline");
    if (status.includes("OB")) return t("widget.upsMonitor.statusOnBattery");
    if (status.includes("LB")) return t("widget.upsMonitor.statusLowBattery");
    return status;
  };

  const formatRuntime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <Card h="100%">
      <Stack h="100%" justify="space-between">
        <Group justify="space-between" mb="md">
          <Title order={4}>
            <Group gap="xs">
              <IconBolt size={20} />
              {t("widget.upsMonitor.title")}
            </Group>
          </Title>
          <Badge color={getStatusBadgeColor(upsData.status)}>{getStatusText(upsData.status)}</Badge>
        </Group>

        <Stack gap="sm">
          <Box>
            <Group justify="space-between" mb={5}>
              <Group gap="xs">
                <IconBattery size={16} />
                <Text size="sm">{t("widget.upsMonitor.batteryCharge")}</Text>
              </Group>
              <Text size="sm" fw={500}>{upsData.batteryCharge}%</Text>
            </Group>
            <Progress value={upsData.batteryCharge} color="green" />
          </Box>

          <Box>
            <Group justify="space-between" mb={5}>
              <Group gap="xs">
                <IconPlugConnected size={16} />
                <Text size="sm">{t("widget.upsMonitor.load")}</Text>
              </Group>
              <Text size="sm" fw={500}>{upsData.load}%</Text>
            </Group>
            <Progress value={upsData.load} color="blue" />
          </Box>

          <Group justify="space-between">
            <Text size="sm">{t("widget.upsMonitor.runtime")}</Text>
            <Text size="sm" fw={500}>{formatRuntime(upsData.batteryRuntime)}</Text>
          </Group>

          <Group justify="space-between">
            <Text size="sm">{t("widget.upsMonitor.inputVoltage")}</Text>
            <Text size="sm" fw={500}>{upsData.inputVoltage}V</Text>
          </Group>

          <Group justify="space-between">
            <Text size="sm">{t("widget.upsMonitor.outputVoltage")}</Text>
            <Text size="sm" fw={500}>{upsData.outputVoltage}V</Text>
          </Group>

          {upsData.temperature && (
            <Group justify="space-between">
              <Group gap="xs">
                <IconTemperature size={16} />
                <Text size="sm">{t("widget.upsMonitor.temperature")}</Text>
              </Group>
              <Text size="sm" fw={500}>{upsData.temperature}°C</Text>
            </Group>
          )}
        </Stack>

        <Group justify="space-between" mt="sm">
          <Text size="xs" c="dimmed">{upsData.manufacturer}</Text>
          <Text size="xs" c="dimmed">{upsData.model}</Text>
        </Group>
      </Stack>
    </Card>
  );
}