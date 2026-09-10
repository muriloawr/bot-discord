import type { ChatInputCommandInteraction, Collection, SlashCommandBuilder } from "discord.js";

export interface MeetingWindow {
  start: string;
  end: string;
  warningMinutes: number;
  closeMessage: string;
}

export interface AppConfig {
  timezone: string;
  meetingChannel: string;
  announceChannel: string;
  meetingWindows: MeetingWindow[];
  ignoredRoles: string[];
}

export interface Command {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction<"cached">) => Promise<void>;
}

declare module "discord.js" {
  interface Client {
    commands: Collection<string, Command>;
  }
}
