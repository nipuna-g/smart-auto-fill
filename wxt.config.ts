import { defineConfig, defineRunnerConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  extensionApi: "chrome",
  modules: ["@wxt-dev/module-react"],
  browser: "chrome",
  manifest: {
    name: "Smart Form Filler",
    permissions: ["sidePanel", "aiLanguageModelOriginTrial", "storage"],
    trial_tokens: [
      "AonzUekOoTdze95zc9b235ReoSGEtr+cAWrE7L4E/0V9h5ocfjHVMY0gA+B53x8kBVVLDUeoyDjOAPEqZogjogcAAAB4eyJvcmlnaW4iOiJjaHJvbWUtZXh0ZW5zaW9uOi8vamVhaWFjcGxhbmNjYmxsYW9hamJiaGFhYWNvaWZuam8iLCJmZWF0dXJlIjoiQUlQcm9tcHRBUElGb3JFeHRlbnNpb24iLCJleHBpcnkiOjE3NjA0ODYzOTl9",
    ],
    key: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA2t5jAaEPIEDDB32h4uRt3XvmJ75xHk/UTHPQWeDJwgFqwfEV8aK0jmuflpCLvLuukeArwvj7m+gIO2G0iBGu8Jd/U/7m171xutUSrXQ5IBP3kNAuv+3BKr7CuKdAjVnqRpjlS1BugyVtNPl5wpcKnOirCKWua8JSvRr6XakOMkjXHBO8HB0GGVeTji8TS2DcjZM/pH1x+cXGL1D14Yjt9S5ztAh6UpZyQMWhjaKV5z5qBiR1x5tgn0XWl0n6DZs0A0CQJDPsFR3CikeDD7FdEwHbQQC4g87uTxXnrch3QVQ9lLY2q35Rii1kiWarNoz29fTGBd4mVDJnRAUBFdaKNwIDAQAB",
  },
  dev: {
    server: {
      port: 3000,
    },
  },
  runner: {
    disabled: true,
  },
});
