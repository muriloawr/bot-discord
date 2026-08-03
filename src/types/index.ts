export interface MeetingWindow {
  start: string;
  end: string;
  warningMinutes: number;
}

export interface AppConfig {
  timezone: string;
  meetingChannel: string;
  announceChannel: string;
  meetingWindows: MeetingWindow[];
  ignoredRoles: string[];
}
