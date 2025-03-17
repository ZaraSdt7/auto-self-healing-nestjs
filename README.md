# Auto-Self-Healing-NestJS 🚀

![NestJS](https://img.shields.io/badge/NestJS-v11-red?style=flat-square&logo=nestjs) ![TypeScript](https://img.shields.io/badge/TypeScript-v5-blue?style=flat-square&logo=typescript) ![License](https://img.shields.io/badge/License-UNLICENSED-green?style=flat-square)

**A cutting-edge NestJS package designed to make your applications smarter, stronger, and self-sustaining.**  
Say goodbye to manual debugging and hello to automated error detection, self-fixing, performance optimization, and GitHub synchronization—all in one sleek package!

---

## ✨ What is Auto-Self-Healing-NestJS?

This is not just a package—it's your app's personal superhero. Built with NestJS, it empowers your projects with:
- **Error Detection & Prediction**: Spots issues before they escalate using AI-powered analysis.
- **Self-Fixing**: Automatically resolves common problems without human intervention.
- **Performance Monitoring**: Keeps your app running at peak efficiency.
- **Security Patching**: Stays ahead of vulnerabilities.
- **GitHub Sync**: Seamlessly integrates with your repositories for real-time updates.
- **Health Checks**: Monitors module health and alerts you to slowdowns.

Whether you're building a small API or a massive enterprise app, this package has your back.

---

## 🌟 Features

- **AI-Driven Insights**: Analyzes logs and code to predict and prevent errors.
- **GitHub Integration**: Syncs with your repos for code updates and audits.
- **Email Notifications**: Alerts you when something needs attention.
- **Resource Optimization**: Fine-tunes queries and resource usage.
- **Rollback Management**: Safely reverts changes if things go south.
- **Scheduled Tasks**: Runs health checks and audits on autopilot.
- **Plug-and-Play**: Works out of the box with any NestJS project.

---

## 🛠 Installation

Get started in minutes:

1. **Install the package**:
   ```bash
   npm install auto-self-healing-nestjs

2. **Add it to your NestJS app:**:

```typescript

import { Module } from '@nestjs/common';
import { AutoSelfHealingModule } from 'auto-self-healing-nestjs';

@Module({
  imports: [AutoSelfHealingModule],
})
export class AppModule {}

```

3. **Configure your environment (see below).**

## ⚙️ Configuration
This package uses environment variables for flexibility. Create a .env file in your project root and add the following:

```bash

# GitHub Integration (Required)
GITHUB_TOKEN=ghp_YourPersonalAccessTokenHere
GITHUB_OWNER=YourGitHubUsername
GITHUB_REPO=YourRepoName

# Email Notifications (Required)
EMAIL_USER=your_email@example.com

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587 

SMTP_PASS=**************
EMAIL_FROM=Your-mail@gmail.com
EMAIL_TO=user-mail@gmail.com

```

4. **How to Get a GitHub Token**

1.Go to [GitHub Settings > Developer Settings > Personal Access Tokens.](https://github.com/settings/tokens)

2.Generate a new token with repo scope.

3.Copy it into your .env file.


## 📚 Usage
Once installed and configured, the package kicks in automatically. Here’s how to tap into its power:

**Accessing Services**
You can inject any exported service into your app:

```typescript
import { Injectable } from '@nestjs/common';
import { GithubSyncService, ModuleHealthCheck } from 'auto-self-healing-nestjs';

@Injectable()
export class MyService {
  constructor(
    private readonly githubSyncService: GithubSyncService,
    private readonly healthCheck: ModuleHealthCheck,
  ) {}

  async checkStatus() {
    const repoData = this.githubSyncService.getRepoData();
    const health = this.healthCheck.getStatus();
    return { repo: repoData?.full_name, health };
  }
}
```

**Example Controller**
```typescript
import { Controller, Get } from '@nestjs/common';
import { MyService } from './my.service';

@Controller('status')
export class MyController {
  constructor(private readonly myService: MyService) {}

  @Get()
  async getStatus() {
    return this.myService.checkStatus();
  }
}
```
Run your app and hit http://localhost:3000/status to see it in action!

## 🔍 What Happens Under the Hood?

1.On Startup: Initializes AI analyzers, syncs with GitHub, and starts monitoring.

2.Every 5 Minutes: Runs health checks and logs performance metrics.

3.When Issues Arise: Detects errors, predicts potential failures, and applies fixes or rolls back as needed.

4.Check your logs for real-time updates:

```bash
{"level":"info","message":"Synced repo: username-github/auto-self-healing-nestjs (ID: 12345678)","timestamp":"..."}
{"level":"warn","message":"Module health issues detected: Slow response time: 1559ms","timestamp":"..."}

```
## 🧪 Testing
Test the package locally:

```bash
npm run build  # Build the package
npm install /path/to/auto-self-healing-nestjs  # Install in a test project
```

## 🛠 Development
Want to contribute or tweak it? Here’s how:

1.Clone the repo (if public):

```bash
git clone https://github.com/ZaraSdt7/auto-self-healing-nestjs.git
cd auto-self-healing-nestjs
```

2.Install dependencies:
```bash
npm install
```
3.Build and test:
```bash
npm run build
npm run test
```
## 📦 Dependencies
@nestjs/core, @nestjs/common: Core NestJS framework.

@nestjs/config: Environment variable management.

@nestjs/axios: HTTP requests for GitHub sync.

@nestjs/schedule: Task scheduling.

winston: Powerful logging.

nodemailer: Email notifications.

And more! Check package.json for the full list.

## 🤝 Contributing

Got ideas? Found a bug? Open an issue or submit a PR—we’d love to hear from you!

## 👩‍💻 Author

Zahra

**Turning chaos into code, one self-healing app at a time.**

[GitHub](https://github.com/ZaraSdt7) 

## 📜 License

This project is currently UNLICENSED. Stay tuned for updates!