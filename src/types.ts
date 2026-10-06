export type AppStatus = "live" | "beta" | "planned";

export interface HubApp {
  slug: string;
  name: string;
  description: string;
  repo: string;
  tags: string[];
  type: "node" | "static";
  port?: number;
  start?: string;
  build?: string;
  /** For static apps: folder inside the repo containing built files */
  dist?: string;
  status: AppStatus;
}

export interface HubSite {
  name: string;
  tagline: string;
  domain: string;
  routing: "subdomain" | "path";
  github: string;
  appsRoot: string;
  hubRoot: string;
}

export interface HubConfig {
  site: HubSite;
  apps: HubApp[];
}
