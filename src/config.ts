import raw from "../apps.json";
import type { HubApp, HubConfig } from "./types";

export const config = raw as HubConfig;

/** Where the user lands when opening an app card. */
export function appUrl(app: HubApp): string {
  if (app.status === "planned") return app.repo;
  if (config.site.routing === "path") return `/apps/${app.slug}/`;
  return `https://${app.slug}.${config.site.domain}`;
}
