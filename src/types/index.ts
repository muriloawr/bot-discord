export interface AppConfig {
  timezone: string;
  meetingChannel: string;
  announceChannel: string;
  meetingStart: string;
  meetingEnd: string;
  warningMinutes: number;
  ignoredRoles: string[];
}
