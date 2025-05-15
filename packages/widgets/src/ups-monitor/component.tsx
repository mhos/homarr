"use client";

import { Box, Card, Group, Progress, Stack, Text, Badge, Title } from "@mantine/core";
import { IconBolt, IconBattery, IconTemperature, IconPlugConnected } from "@tabler/icons-react";

import { clientApi } from "@homarr/api/client";
import { useI18n } from "@homarr/translation/client";

import type { WidgetComponentProps } from "../definition";

export default function UpsMonitorWidget(props: WidgetComponentProps<"upsMonitor">) {
  const t = useI18n();
  const [integrations] = clientApi.integration.byIds.useSuspenseQuery(props.integrationIds);
  
  const upsIntegration = integrations.find((integration) => integration.kind === "upsMonitor");
  
  if (!upsIntegration) {
    return (
      <Card>
        <Text>No UPS Monitor integration configured</Text>
      </Card>
    );
  }

  // Fetch UPS data using the integration
  const { data, isLoading, error } = clientApi.widget.upsMonitor.getUpsStatus.useQuery({
    integrationId: upsIntegration.id,
  });

  if (isLoading) {
    return <Card><Text>Loading...</Text></Card>;
  }

  if (error || !data) {
    return <Card><Text>Error loading UPS data</Text></Card>;
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