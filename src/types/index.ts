export interface AppConfig {
  timezone: string;
  meetingChannel: string;
  meetingStart: string;
  meetingEnd: string;
  warningMinutes: number;
  ignoredRoles: string[];
}
