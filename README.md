# Apex Capital AI (DiDi) 🏦 

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-SOTA-emerald)
![AI](https://img.shields.io/badge/AI-Gemini%203%20Pro-purple)

**The World's First Open-Source Autonomous Private Equity Firm.**

Apex Capital AI (internally "DiDi") is a State-of-the-Art (SOTA) agentic system designed to automate the end-to-end investment lifecycle. It utilizes a swarm of specialized AI agents to source deals, perform deep diligence, build complex LBO models, and generate investment committee marketing materials without human intervention.

Built on **Google's Gemini 3 & 2.5** ecosystem, it features "Thinking" capabilities for complex reasoning, Search Grounding for live data triangulation, and high-fidelity image generation for deliverables.

---

## 🧠 The Neural Agent Swarm

The system is not a chatbot; it is a rigid, role-based multi-agent system. Each agent possesses a specific system instruction, toolset, and cognitive model optimized for their task.

| Agent Name | Role | Model | Capability |
|:---|:---|:---|:---|
| **Athena** | Managing Director (MD) | `gemini-3-pro-preview` | **Reasoning & Strategy.** Uses "Thinking" capabilities (CoT) to formulate investment theses, assess risk, and make final GO/NO-GO decisions. |
| **Marcus** | Vice President (VP) | `gemini-2.5-flash` | **Orchestration.** Managing task queues, dispatching sub-agents, and selecting targets from sourcing lists. |
| **Ken** | Associate | `gemini-3-pro-preview` | **Modeling.** Specialized in Financial Engineering. Generates 3-statement models, LBOs, and Sensitivity tables with mathematical consistency checks. |
| **Scout-Alpha** | Sourcing | `gemini-2.5-flash` | **Live Web Mining.** Uses `googleSearch` tools to scan the live web for targets fitting specific mandates. |
| **Sarah** | Diligence | `gemini-3-pro-preview` | **Forensic Analysis.** Ingests PDFs, Excel, and CIMs. Extracts unstructured data to structured JSON. Identifies "fine print" risks. |
| **Sienna** | Design Director | `gemini-3-pro-image-preview` | **Visuals.** Generates high-fidelity slide decks and branding assets using generative imagery. |

---

## ⚡ Core Capabilities & Workflows

### 1. Autonomous Sourcing & Screening
*   **Mandate-Driven Search:** You define the firm's strategy (e.g., "B2B SaaS < $10M EBITDA in Midwest").
*   **Triangulation:** The Scout agent validates targets by cross-referencing news, funding history, and employee counts (via LinkedIn/Glassdoor proxies) to estimate revenue when private data is missing.
*   **Maps Verification:** Uses `googleMaps` grounding to verify HQ locations and operational footprint.

### 2. Deep Diligence & "Gap Filling"
*   **Document Ingestion:** Drag-and-drop a 50-page Confidential Information Memorandum (CIM) or a messy Excel dump.
*   **Intelligent Extraction:** The system parses text and tables to extract EBITDA, Revenue, and margins.
*   **Gap Filling Logic:** If data is missing (common in private markets), the Associate Agent uses sector benchmarks to infer missing line items (e.g., estimating OpEx based on headcount), explicitly flagging these as estimates in the model.

### 3. Financial Modeling Engine
*   **Instant LBOs:** Automatically generates a Leverage Buyout model including:
    *   Sources & Uses (Debt/Equity split)
    *   Debt Schedule (Senior/Mezzanine paydown)
    *   Returns Analysis (IRR/MOIC)
    *   Sensitivity Tables (Entry vs. Exit Multiple impact on IRR)
*   **Exportable Data:** All models can be exported to CSV/Excel for human auditing.

### 4. Automated Deliverables
*   **Slide Generation:** The Design Agent writes content structure (Titles, Bullets) and generates visual directives.
*   **Generative Assets:** Uses `gemini-3-pro-image-preview` to render 16:9 photorealistic slides, charts, and cover art based on the deal context, ensuring no generic stock photos are used.

### 5. Portfolio Command
*   **Ingestion:** Upload spreadsheet dumps of portfolio holdings.
*   **Normalization:** The system maps column headers (e.g., "Rev LTM" -> "revenue") and standardizes statuses (Active vs. Realized).
*   **Analytics:** visualizes sector exposure and aggregate fund performance.

---

## 🛠️ Technical Architecture

### Tech Stack
*   **Framework:** React 19 (RC) + Vite
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS + Lucide React
*   **Data Viz:** Recharts
*   **File Parsing:** SheetJS (`xlsx`) for client-side Excel processing.

### AI Implementation Details
*   **SDK:** `@google/genai`
*   **JSON Repair:** Custom regex-based JSON repair logic to handle LLM token truncation or malformed JSON responses ensuring UI stability.
*   **Prompt Engineering:**
    *   *Context Injection:* Agents are fed "System Time", "Active Mandate", and "Portfolio Context" on every turn.
    *   *Thinking Config:* `gemini-3-pro` is configured with a `thinkingBudget` of 1024-8192 tokens for complex tasks (LBO creation, Final Opinions).
    *   *Tool Use:* Functional calls for `googleSearch` (Sourcing) and `googleMaps` (Diligence).

---

## 🚀 Getting Started

### Prerequisites
1.  **Node.js** (v18 or higher)
2.  **Google Cloud Project** with Gemini API enabled.
3.  **API Key** with access to `gemini-3-pro-preview` and `gemini-2.5-flash`.

### Installation

1.  **Clone the Repo**
    ```bash
    git clone https://github.com/yourusername/apex-capital-ai.git
    cd apex-capital-ai
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment**
    Create a `.env` file in the root:
    ```env
    API_KEY=AIzaSy...YourKeyHere
    ```

4.  **Run Development Server**
    ```bash
    npm run dev
    ```

---

## 📖 Usage Guide

### The "Golden Path" Demo
1.  **Pipeline View:** Click "New Deal Room".
2.  **Chat Interface:** Type: *"Find me 3 profitable healthcare services companies in Texas."*
3.  **Watch the Swarm:**
    *   **MD** analyzes the request against your mandate.
    *   **VP** dispatches **Scout** to search Google.
    *   **Scout** returns targets.
    *   **VP** selects the best fit.
    *   **Scout** performs a Deep Dive (Revenue/EBITDA triangulation).
    *   **Associate** builds the LBO model.
4.  **Deal Dashboard:** Click into the new Deal card. Review the "Financials" and "LBO" tabs.
5.  **Deliverables:** Go to the "Deliverables" tab and click "+ Pitch Deck". Watch the **Design Agent** render slides in real-time.

### Uploading a CIM
1.  In the Chat Interface, click the **Paperclip** icon.
2.  Select a PDF (Text-based) or Excel file.
3.  Prompt: *"Analyze this CIM. Extract EBITDA and tell me if I should buy it."*
4.  **Sarah (Diligence)** will read the file, extract the data, and pass it to **Ken (Associate)** to model it.

---

## 🛡️ Disclaimer
This software is a **Proof of Concept (PoC)** AI agent system. It performs financial calculations based on LLM outputs which can hallucinate. **Do not make real investment decisions based solely on this tool.** Always verify model outputs with human due diligence.

## 📄 License
MIT License.
