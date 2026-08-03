import type { GuildMember } from "discord.js";
import { appConfig } from "../config";

export function isIgnoredMember(member: GuildMember): boolean {
  return member.roles.cache.some((role) => appConfig.ignoredRoles.includes(role.id));
}
