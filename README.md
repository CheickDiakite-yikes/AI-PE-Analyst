# DiDi AI - Autonomous Private Equity Agent

DiDi AI (internally dubbed "Apex Capital AI") is an open-source, state-of-the-art Autonomous Private Equity Agent System. It utilizes a multi-agent architecture to automate the entire deal lifecycle—from sourcing and screening to deep diligence, financial modeling, and investment committee memo generation.

Powered by **Google Gemini 3 & 2.5**, this system mimics a high-performing investment team.

## 🚀 Core Capabilities

### 🧠 Multi-Agent Swarm Architecture
- **Athena (MD):** Strategy formulation, risk assessment, and final Investment Committee (IC) decisions.
- **Marcus (VP):** Task orchestration, process management, and target selection.
- **Ken (Associate):** Complex financial modeling (LBO, 3-Statement), sensitivity analysis, and memo writing.
- **Scout-Alpha:** High-speed market scanning, deal sourcing, and data triangulation from the live web.
- **Sarah (Diligence):** Deep document analysis (PDF/Excel), risk extraction, and forensic accounting.
- **Comps-Beta:** Comparable company analysis and trading multiple spreading.
- **Sienna (Design):** Generation of high-fidelity marketing materials (Teasers, CIMs, Pitch Decks).

### 💼 Features
- **Autonomous Sourcing:** Give the system a mandate (e.g., "B2B SaaS under $50M EV"), and it scans the market, filters targets, and selects the best fit.
- **Deep Diligence Engine:** Drag & drop CIMs, Teasers, or Excel models. The AI extracts unstructured data, identifies risks, and normalizes financials.
- **Instant Financial Modeling:** Automatically generates LBO models, Debt Schedules, and Sensitivity Tables based on sparse data or uploaded documents.
- **Automated Deliverables:** Generates slide decks (Teasers, CIMs) with structure, content, and AI-generated visual assets using Imagen 3.
- **Portfolio Command:** Ingest portfolio company data to track aggregate performance and sector exposure.

## 🛠️ Tech Stack
- **Frontend:** React 19, Vite, TypeScript
- **Styling:** Tailwind CSS, Lucide React
- **AI/LLM:** Google Gemini API (`gemini-3-pro-preview`, `gemini-2.5-flash`) via `@google/genai` SDK
- **Visuals:** Gemini Image Generation (`gemini-3-pro-image-preview`)
- **Data Processing:** SheetJS (XLSX) for client-side spreadsheet parsing

## ⚡ Getting Started

### Prerequisites
- Node.js (v18+)
- Google Gemini API Key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/didi-ai.git
   cd didi-ai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Environment Variables:
   Create a `.env` file in the root directory (or ensure your environment provides `API_KEY`):
   ```env
   API_KEY=your_google_gemini_api_key_here
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

## 🛡️ License
MIT License
