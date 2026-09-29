# SentinelOS — SIEM Security Dashboard

SentinelOS is a modern Security Information and Event Management (SIEM) dashboard designed to provide a centralized interface for monitoring security events, alerts, assets, and security operations.

The project provides a SOC-style dashboard experience with authentication, security event monitoring, severity-based filtering, asset discovery, notifications, report generation, and security workspace management.

## 🚀 Features

* 🔐 User authentication with Sign Up and Sign In
* 📊 SIEM security operations dashboard
* 🚨 Security alerts and event monitoring
* 🔎 Event search and severity filtering
* 🖥️ Asset monitoring and discovery
* 📋 Security reports generation
* 🔔 Security notifications
* 📄 PDF report generation
* ⚙️ Workspace and security settings
* 🛡️ SOC-style security monitoring interface
* 📱 Responsive dashboard interface

## 🛠️ Tech Stack

* Next.js
* React
* TypeScript
* Tailwind CSS
* Better Auth
* PostgreSQL
* Drizzle ORM
* Lucide React
* jsPDF
* Mammoth
* Vercel Analytics

## 📂 Project Structure

```text
sentinel-os-siem-dashboard/
│
├── app/
│   ├── api/
│   │   └── auth/
│   ├── sign-in/
│   ├── sign-up/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   ├── auth-form.tsx
│   ├── siem-dashboard.tsx
│   └── ui/
│
├── lib/
│   ├── auth.ts
│   ├── auth-client.ts
│   └── utils.ts
│
├── public/
│
├── data/
│
├── package.json
├── next.config.mjs
├── tsconfig.json
└── .gitignore
```

## ⚙️ Installation

Clone the repository:

```bash
git clone https://github.com/YOUR-USERNAME/sentinel-os-siem-dashboard.git
```

Go to the project directory:

```bash
cd sentinel-os-siem-dashboard
```

Install dependencies:

```bash
pnpm install
```

Create a local environment file:

```text
.env.local
```

Add the required environment variables according to your authentication and database configuration.

Start the development server:

```bash
pnpm dev
```

Open:

```text
http://localhost:3000
```

## 🔐 Authentication

The application includes:

* User registration
* User login
* Session-based authentication
* Protected dashboard access
* User profile information

Unauthenticated users are redirected to the sign-in page.

## 📊 SIEM Dashboard

The dashboard provides a SOC-style view of security operations, including:

* Security events
* Alert severity
* Event sources
* IP addresses
* Event status
* Security assets
* Notifications
* Reports

Example security event categories include:

* Failed SSH login attempts
* Unusual outbound data transfers
* Privilege escalation
* New administrator account creation
* Malware signature matches

## 📄 Security Reports

The application supports generating security reports from dashboard information and exporting reports as PDF.

## 🎯 Project Objective

The primary objective of SentinelOS is to provide a centralized security monitoring interface that demonstrates how a Security Operations Center (SOC) environment can be represented through a modern web application.

The project can be extended with real SIEM integrations, log ingestion, threat intelligence, detection rules, and automated incident response.

## 🔮 Future Improvements

Possible future enhancements include:

* Real-time log ingestion
* Elasticsearch integration
* Wazuh integration
* Splunk integration
* Microsoft Sentinel integration
* Real-time WebSocket alerts
* Threat intelligence APIs
* MITRE ATT&CK mapping
* Automated incident response
* IP reputation checking
* Real endpoint telemetry
* Advanced security analytics
* Role-based access control
* Machine-learning based anomaly detection

## ⚠️ Disclaimer

This project is intended for educational, demonstration, and portfolio purposes. The security events shown in the dashboard are demonstration data unless connected to a real security monitoring infrastructure.

## 👨‍💻 Author

**Manish Kushwaha**

M.Sc. IT — Cyber Security & Forensics

Cybersecurity | SOC | Digital Forensics | Web Development

---

⭐ If you find this project useful, consider giving the repository a star.
