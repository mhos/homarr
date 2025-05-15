import { fetchWithTrustedCertificatesAsync } from "@homarr/certificates/server";
import net from "net";

import { Integration } from "../base/integration";
import type { HealthMonitoring } from "../interfaces/health-monitoring/healt-monitoring";

export class UpsMonitorIntegration extends Integration {
  private nutPort = 3493; // Standard NUT port

  public async testConnectionAsync(): Promise<void> {
    // Test connection to NUT server
    return new Promise((resolve, reject) => {
      const client = new net.Socket();
      
      const timeout = setTimeout(() => {
        client.destroy();
        reject(new Error("Connection timeout"));
      }, 5000);

      client.connect(this.nutPort, this.getHost(), () => {
        clearTimeout(timeout);
        client.write("LIST UPS\n");
      });

      client.on("data", (data) => {
        const response = data.toString();
        if (response.includes("BEGIN LIST UPS") || response.includes("UPS")) {
          client.end();
          resolve();
        } else {
          client.end();
          reject(new Error("Invalid NUT server response"));
        }
      });

      client.on("error", (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  }

  public async getUpsListAsync(): Promise<string[]> {
    return this.executeNutCommand("LIST UPS").then((response) => {
      const lines = response.split("\n");
      const upsList: string[] = [];
      
      lines.forEach((line) => {
        const match = line.match(/^UPS\s+(\S+)\s+"(.+)"/);
        if (match) {
          upsList.push(match[1]);
        }
      });
      
      return upsList;
    });
  }

  public async getUpsStatusAsync(upsName?: string): Promise<Record<string, string>> {
    // If no UPS name provided, get the first one
    if (!upsName) {
      const upsList = await this.getUpsListAsync();
      if (upsList.length === 0) {
        throw new Error("No UPS found");
      }
      upsName = upsList[0];
    }

    const response = await this.executeNutCommand(`LIST VAR ${upsName}`);
    const lines = response.split("\n");
    const status: Record<string, string> = {};
    
    lines.forEach((line) => {
      const match = line.match(/^VAR\s+\S+\s+(\S+)\s+"(.+)"/);
      if (match) {
        status[match[1]] = match[2];
      }
    });
    
    return status;
  }

  public async getHealthMonitoringAsync(): Promise<Partial<HealthMonitoring> & {
    upsData: {
      status: string;
      batteryCharge: number;
      batteryRuntime: number;
      inputVoltage: number;
      outputVoltage: number;
      load: number;
      temperature?: number;
      model: string;
      manufacturer: string;
    }
  }> {
    const status = await this.getUpsStatusAsync();
    
    // Map NUT data to health monitoring format
    return {
      upsData: {
        status: status["ups.status"] || "Unknown",
        batteryCharge: parseFloat(status["battery.charge"]) || 0,
        batteryRuntime: parseInt(status["battery.runtime"]) || 0,
        inputVoltage: parseFloat(status["input.voltage"]) || 0,
        outputVoltage: parseFloat(status["output.voltage"]) || 0,
        load: parseFloat(status["ups.load"]) || 0,
        temperature: status["ups.temperature"] ? parseFloat(status["ups.temperature"]) : undefined,
        model: status["ups.model"] || "Unknown",
        manufacturer: status["ups.mfr"] || "Unknown",
      }
    };
  }

  private getHost(): string {
    const url = new URL(this.integration.url);
    return url.hostname;
  }

  private executeNutCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const client = new net.Socket();
      let response = "";
      
      const timeout = setTimeout(() => {
        client.destroy();
        reject(new Error("Command timeout"));
      }, 10000);

      client.connect(this.nutPort, this.getHost(), () => {
        clearTimeout(timeout);
        client.write(command + "\n");
      });

      client.on("data", (data) => {
        response += data.toString();
        
        // Check if we received the end marker
        if (response.includes("END LIST")) {
          client.end();
          resolve(response);
        }
      });

      client.on("error", (err) => {
        clearTimeout(timeout);
        reject(err);
      });

      client.on("end", () => {
        clearTimeout(timeout);
        resolve(response);
      });
    });
  }
}