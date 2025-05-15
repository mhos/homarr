"use client";

import { Box, Card, Group, Progress, Stack, Text, Badge, Title, Loader } from "@mantine/core";
import { IconBolt, IconBattery, IconTemperature, IconPlugConnected } from "@tabler/icons-react";

import { clientApi } from "@homarr/api/client";
import { useI18n } from "@homarr/translation/client";

import type { WidgetComponentProps } from "../definition";

export default function UpsMonitorWidget({ integrationIds }: WidgetComponentProps<"upsMonitor">) {
  const t = useI18n();
  
  // Debug logging
  console.log("UPS Monitor Widget - Integration IDs:", integrationIds);
  
  // Check if we have any integration IDs
  if (!integrationIds || integrationIds.length === 0) {
    return (
      <Card h="100%">
        <Text c="dimmed">No integration selected. Please select a UPS Monitor integration.</Text>
      </Card>
    );
  }

  // Fetch UPS data using the first integration ID
  const { data, isLoading, error } = clientApi.widget.upsMonitor.getUpsStatus.useQuery(
    {
      integrationId: integrationIds[0],
    },
    {
      enabled: integrationIds.length > 0 && !!integrationIds[0],
    }
  );

  if (isLoading) {
    return (
      <Card h="100%">
        <Group justify="center" h="100%">
          <Loader />
        </Group>
      </Card>
    );
  }

  if (error) {
    console.error("UPS Monitor Widget Error:", error);
    return (
      <Card h="100%">
        <Text c="dimmed">Error loading UPS data: {error.message}</Text>
      </Card>
    );
  }

  if (!data || !data.upsData) {
    return (
      <Card h="100%">
        <Text c="dimmed">No UPS data available</Text>
      </Card>
    );
  }

  const upsData = data.upsData;
  console.log("UPS Data:", upsData);

  const getStatusBadgeColor = (status: string) => {
    if (!status) return "gray";
    if (status.includes("OL")) return "green"; // Online
    if (status.includes("OB")) return "yellow"; // On Battery
    if (status.includes("LB")) return "red"; // Low Battery
    return "gray";
  };

  const getStatusText = (status: string) => {
    if (!status) return "Unknown";
    if (status.includes("OL")) return t("widget.upsMonitor.statusOnline");
    if (status.includes("OB")) return t("widget.upsMonitor.statusOnBattery");
    if (status.includes("LB")) return t("widget.upsMonitor.statusLowBattery");
    return status;
  };

  const formatRuntime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "N/A";
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
              <Text size="sm" fw={500}>{upsData.batteryCharge || 0}%</Text>
            </Group>
            <Progress value={upsData.batteryCharge || 0} color="green" />
          </Box>

          <Box>
            <Group justify="space-between" mb={5}>
              <Group gap="xs">
                <IconPlugConnected size={16} />
                <Text size="sm">{t("widget.upsMonitor.load")}</Text>
              </Group>
              <Text size="sm" fw={500}>{upsData.load || 0}%</Text>
            </Group>
            <Progress value={upsData.load || 0} color="blue" />
          </Box>

          <Group justify="space-between">
            <Text size="sm">{t("widget.upsMonitor.runtime")}</Text>
            <Text size="sm" fw={500}>{formatRuntime(upsData.batteryRuntime)}</Text>
          </Group>

          <Group justify="space-between">
            <Text size="sm">{t("widget.upsMonitor.inputVoltage")}</Text>
            <Text size="sm" fw={500}>{upsData.inputVoltage || 0}V</Text>
          </Group>

          <Group justify="space-between">
            <Text size="sm">{t("widget.upsMonitor.outputVoltage")}</Text>
            <Text size="sm" fw={500}>{upsData.outputVoltage || 0}V</Text>
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
          <Text size="xs" c="dimmed">{upsData.manufacturer || "Unknown"}</Text>
          <Text size="xs" c="dimmed">{upsData.model || "Unknown"}</Text>
        </Group>
      </Stack>
    </Card>
  );
}