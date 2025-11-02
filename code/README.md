# 🛡️ .Pax RiskFlow

> **AI-Powered Insurance Underwriting System** | Built for BaselHack 2025

A comprehensive, production-ready insurance underwriting platform that combines **AI-powered risk assessment**, **dynamic survey systems**, and **configurable rule engines** to deliver transparent, auditable, and efficient insurance decision-making.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Usage Guide](#-usage-guide)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

**RiskFlow** is an intelligent insurance underwriting system designed to revolutionize how insurance companies assess risk, process applications, and make underwriting decisions. The platform bridges the gap between human expertise and AI automation, providing a transparent, configurable, and efficient solution for modern insurance operations.

### What Problem Does It Solve?

Traditional insurance underwriting faces several challenges:
- **Manual processing** is time-consuming and error-prone
- **Inconsistent decision-making** across different underwriters
- **Opaque risk assessment** processes
- **Difficulty updating rules** requires developer involvement
- **Limited transparency** for applicants

RiskFlow addresses these by providing:
- ✅ **Automated risk assessment** using AI-powered classification
- ✅ **Deterministic decision logic** with full audit trails
- ✅ **Natural language rule configuration** (no coding required)
- ✅ **Visual rule visualization** for transparency
- ✅ **Multi-tier review workflow** for complex cases
- ✅ **AI-generated rule proposals** based on human feedback

---

## ✨ Key Features

### 🤖 AI-Powered Risk Assessment

- **Health Text Classification**: Converts unstructured health descriptions into standardized risk attributes using GPT-4o
- **Structured Output**: Transforms free text into categorized data (severity, status, impact)
- **Deterministic Results**: Temperature=0 ensures reproducible, consistent classifications

### 📝 Dynamic Survey System

- **Product-Based Questionnaires**: Different insurance products have customized survey flows
- **Flexible Input Types**: Supports text, number, yes/no, single choice, and multiple choice questions
- **Conditional Logic**: Questions can be shown/hidden based on previous answers
- **Data Normalization**: Automatically maps survey responses to evaluation context

### ⚙️ Configurable Rule Engine

- **Database-Backed Configuration**: All rules stored in PostgreSQL (no code changes needed)
- **Natural Language Rule Creation**: Describe rules in plain English via AI chat interface
- **Multiple Rule Types**:
  - **Risk Factors**: Adjust premium multipliers (BMI, smoking, age, health conditions)
  - **Decline Rules**: Automatically reject applications meeting certain conditions
  - **Gather Info Rules**: Trigger follow-up questions when information is missing
  - **Mortality Formulas**: Base premium calculation formulas

### 📊 Visual Rule Visualization

- **Interactive Graph Flow**: See exactly how each rule evaluates step-by-step
- **Input → Logic → Output**: Clear visualization of rule logic and data flow
- **Color-Coded Rules**: Different colors for different rule types
- **Example Calculations**: See how rules apply to real scenarios

### 👥 Multi-Tier Review Workflow

- **Underwriter Reviews**: Review system decisions, confirm, adjust, or escalate cases
- **Chief Underwriter Reviews**: Handle escalated cases and make final decisions
- **AI Rule Proposals**: System generates rule adjustment suggestions based on review feedback
- **Complete Audit Trail**: Every decision tracked with full reasoning

### 🎨 Modern User Interface

- **Product Selection Page**: Beautiful grid of available insurance products
- **Dynamic Forms**: Survey forms adapt to product configuration
- **Results Dashboard**: Clear decision outcomes with detailed breakdowns
- **Configuration Interface**: Intuitive rule management with chat and visualization

---

## 🏗️ Architecture

### System Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Customer Application                     │
│                  (Survey Form Submission)                    │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Evaluation System Pipeline                     │
│                                                             │
│  1. Health Text → LLM Classification (GPT-4o)             │
│     "Chronic back pain" → {severity: "moderate", ...}       │
│                                                             │
│  2. Decision Gates (Database Rules)                        │
│     • REJECT Gate → Check decline rules                    │
│     • GATHER_INFO Gate → Check info requirements            │
│                                                             │
│  3. Risk Factor Evaluation (Database Config)               │
│     • Load active risk factors                             │
│     • Evaluate expressions (BMI, smoking, age, health)     │
│     • Calculate total multiplier                            │
│                                                             │
│  4. Premium Calculation (Database Formulas)                │
│     • Base premium = coverage × mortality rate              │
│     • Risk-adjusted = base × total multiplier               │
│     • Final = risk-adjusted × margin                       │
│                                                             │
│  5. Decision Classification                                │
│     • REJECT / PENDING_INFO / ACCEPT / ACCEPT_WITH_PREMIUM │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    System Assessment                        │
│              (Stored in Database with Full                  │
│               Audit Trail and Risk Breakdown)                │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Underwriter Review (Optional)                  │
│     • Confirm system decision                               │
│     • Adjust premium/decision                               │
│     • Escalate to Chief Underwriter                         │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│          Chief Underwriter Review (If Escalated)            │
│     • Final decision                                        │
│     • Generate rule adjustment proposals                    │
└─────────────────────────────────────────────────────────────┘
```

### Configuration Flow

```
┌─────────────────────────────────────────────────────────────┐
│              Natural Language Rule Creation                  │
│     User: "Add BMI loading above 30, 2% per point"         │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              AI Parsing (GPT-4o)                            │
│     Extracts: rule type, expression, metadata                │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Database Storage (PostgreSQL)                   │
│     Saves: RiskFactor with expression                        │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Graph Visualization                            │
│     Interactive flow diagram of rule logic                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **React Flow** - Interactive graph visualization
- **Recharts** - Data visualization
- **Sonner** - Toast notifications

### Backend
- **Next.js Server Actions** - Server-side logic
- **Prisma** - Type-safe database ORM
- **PostgreSQL** - Primary database
- **OpenAI GPT-4o** - AI-powered text classification and rule parsing

### Development Tools
- **pnpm** - Fast, efficient package manager
- **ESLint** - Code linting
- **TypeScript** - Static type checking

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ (recommended: 20+)
- **pnpm** package manager ([install guide](https://pnpm.io/installation))
- **PostgreSQL** database (or use a managed service)
- **OpenAI API Key** (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd baselhack2025-riskflow/code
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the `code/` directory:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/riskflow?schema=public"
   
   # OpenAI API (for AI features)
   OPENAI_API_KEY="sk-your-api-key-here"
   
   # Optional: Node environment
   NODE_ENV="development"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma Client
   pnpm db:generate
   
   # Run migrations
   pnpm db:migrate
   
   # Seed initial data (products, default rules, etc.)
   pnpm db:seed
   ```

5. **Start the development server**
   ```bash
   pnpm dev
   ```

6. **Open your browser**
   - Application: [http://localhost:3000](http://localhost:3000)
   - Configuration: Navigate to `/configuration` (admin access)

### Quick Verification

After starting the server, you should see:
- ✅ Home page with product selection
- ✅ Products available in the database
- ✅ Navigation working correctly

---

## 📖 Usage Guide

### For Customers (Applicants)

#### 1. Select a Product
Navigate to the home page and choose an insurance product (e.g., "Term Life Insurance").

#### 2. Complete the Survey
Fill out the dynamic survey form:
- **Required fields**: Age, sex, coverage amount
- **Optional fields**: Height/weight (for BMI), smoking status, health history
- Questions adapt based on the selected product

#### 3. Review Results
After submission, you'll see:
- **Decision**: REJECT, PENDING_INFORMATION, ACCEPT, or ACCEPT_WITH_PREMIUM
- **Premium** (if applicable): Base premium, risk loadings, final premium
- **Risk Breakdown**: Detailed explanation of each risk factor
- **Audit Trail**: Complete technical details for transparency

### For Administrators

#### Configuration Interface

Navigate to `/configuration` to manage underwriting rules.

**Creating Rules via Chat:**
1. Type a natural language request: `"Add BMI loading above 30, 2% per point"`
2. AI parses and generates the rule expression
3. Review the preview
4. Click "Activate Rule" to save

**Rule Types:**
- **Risk Factors**: `"Add age loading, 1% per year above 30"`
- **Decline Rules**: `"Decline severe ongoing conditions"`
- **Gather Info Rules**: `"Ask for BMI if missing"`
- **Mortality Formulas**: `"Set male mortality rate to 0.0008 + age * 0.00002"`

**Visualizing Rules:**
- Click any rule in the sidebar to see its flow diagram
- Graph shows: Input Variables → Rule Logic → Output → Examples

### For Underwriters

#### Reviewing Cases

1. Navigate to the cases page
2. View system assessments and decisions
3. **Confirm**: Agree with system decision
4. **Adjust**: Override decision/premium with reasoning
5. **Escalate**: Send complex cases to Chief Underwriter

### For Chief Underwriters

#### Handling Escalations

1. Review escalated cases
2. Make final decisions
3. Provide feedback to underwriters
4. Generate rule adjustment proposals based on case patterns

---

## 📁 Project Structure

```
code/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── seed.ts                # Initial data seeding
│   └── migrations/            # Database migrations
│
├── src/
│   ├── app/
│   │   ├── (admin)/           # Admin routes (protected)
│   │   │   ├── (chief-underwriter)/
│   │   │   │   ├── configuration/  # Rule configuration
│   │   │   │   ├── reviews/         # Chief reviews
│   │   │   │   └── simulations/     # Rule simulation testing
│   │   │   └── cases/               # Case management
│   │   │
│   │   ├── (customer)/        # Customer-facing routes
│   │   │   └── survey/         # Survey forms and results
│   │   │
│   │   ├── api/               # API routes
│   │   │   └── configuration/
│   │   │       └── chat/       # AI chat endpoint
│   │   │
│   │   ├── page.tsx           # Home page (product selection)
│   │   ├── layout.tsx         # Root layout
│   │   └── globals.css        # Global styles
│   │
│   ├── components/
│   │   └── ui/                 # Reusable UI components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       └── ...
│   │
│   ├── features/
│   │   ├── cases/             # Case management features
│   │   ├── configuration/     # Rule configuration features
│   │   ├── survey/            # Survey features
│   │   ├── simulations/        # Simulation features
│   │   └── chief-reviews/      # Review workflow features
│   │
│   └── lib/
│       ├── client.ts          # Prisma client
│       ├── evaluation-system.ts  # Core evaluation logic
│       └── utils.ts           # Utility functions
│
├── public/                     # Static assets
├── package.json                # Dependencies
├── tsconfig.json              # TypeScript config
├── next.config.ts             # Next.js config
└── README.md                   # This file
```

---

## 🎓 Key Concepts

### Evaluation Decision Types

- **REJECT**: Application declined (triggered by decline rules)
- **PENDING_INFORMATION**: More information needed (triggered by gather info rules)
- **ACCEPT**: Approved at standard rates (no risk loadings)
- **ACCEPT_WITH_PREMIUM**: Approved with risk-adjusted premium

### Risk Factors

Risk factors multiply the base premium:
- Example: BMI factor `1 + max(0, (bmi - 25) * 0.02)`
- If BMI = 30: multiplier = 1.10 (+10% loading)
- All factors are multiplied together: `total = factor1 × factor2 × ...`

### Expression Language

Rules use the `expr-eval` syntax:
- **Operators**: `+`, `-`, `*`, `/`, `==`, `!=`, `>`, `<`, `&&`, `||`
- **Functions**: `max()`, `min()`, `isNaN()`
- **Variables**: `bmi`, `age`, `isSmoking`, `severity`, `status`, `impact`
- **Conditionals**: `condition ? valueIfTrue : valueIfFalse`

Example: `"isSmoking ? 1.5 : 1.0"` → 1.5 if smoking, 1.0 otherwise

---

## 🤝 Contributing

This project was built for **BaselHack 2025**. Contributions, suggestions, and improvements are welcome!

### Development Workflow

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Test thoroughly
4. Commit with clear messages
5. Push and create a pull request

### Code Style

- Follow TypeScript best practices
- Use ESLint for code quality
- Write meaningful commit messages
- Add comments for complex logic

---

## 📄 License

See [LICENSE](../license.txt) file for details.

---

## 🙏 Acknowledgments

- Built for **BaselHack 2025**
- Powered by **OpenAI GPT-4o** for AI features
- Built with **Next.js**, **Prisma**, and modern web technologies

---

## 📞 Support & Contact

For questions, issues, or contributions:
- Open an issue on the repository
- Contact the development team

---

<div align="center">

**Made with ❤️ for BaselHack 2025**

[⬆ Back to Top](#-pax-riskflow)

</div>
