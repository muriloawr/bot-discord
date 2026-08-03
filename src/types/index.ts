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
