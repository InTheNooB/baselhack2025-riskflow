# Insurance Underwriting System - Complete Documentation

## Table of Contents

1. [Introduction](#1-introduction)
2. [System Architecture](#2-system-architecture)
3. [Core Components](#3-core-components)
4. [Database Schema](#4-database-schema)
5. [How It Works: Step-by-Step](#5-how-it-works-step-by-step)
6. [Configuration System Deep Dive](#6-configuration-system-deep-dive)
7. [Expression Language](#7-expression-language)
8. [Setup & Installation](#8-setup--installation)
9. [Usage Guide](#9-usage-guide)
10. [Examples & Use Cases](#10-examples--use-cases)
11. [API Reference](#11-api-reference)
12. [Advanced Topics](#12-advanced-topics)
13. [Troubleshooting](#13-troubleshooting)
14. [Best Practices](#14-best-practices)
15. [Future Enhancements](#15-future-enhancements)
16. [Glossary](#16-glossary)
17. [Appendix](#17-appendix)

---

## 1. Introduction

### 1.1 What is This System?

This is a proof-of-concept (POC) insurance underwriting system that combines:

- **AI-powered health text classification** - Uses GPT-4o to normalize free-text health descriptions into structured risk attributes
- **Deterministic decision logic** - Configurable rules that make transparent, auditable underwriting decisions
- **Natural language configuration** - AI chatbot interface that lets non-technical users configure rules without writing code
- **Visual rule visualization** - Graph-based interface showing how individual rules work

### 1.2 Key Features

✅ **Automated Risk Assessment**
- Evaluates applicants based on BMI, age, smoking status, and health history
- Returns one of four outcomes: REJECT, PENDING_INFORMATION, ACCEPT, or ACCEPT_WITH_PREMIUM

✅ **AI Health Classification**
- Converts unstructured health text into standardized categories (severity, status, impact)
- Uses temperature=0 for deterministic, reproducible results

✅ **Database-Backed Configuration**
- All rules stored in Prisma/SQLite database
- No code changes needed to modify underwriting logic
- Version-controlled configuration

✅ **Natural Language Rule Creation**
- Chat interface converts plain English to executable expressions
- Example: "Add 2% loading per BMI point above 30" → generates expression

✅ **Visual Rule Flow**
- Interactive graph showing how each rule evaluates
- Shows inputs → logic → outputs for individual rules

✅ **Transparent Audit Trail**
- Every decision includes full reasoning
- Risk factors clearly explained
- Premium calculation breakdown

### 1.3 Use Cases

- **Insurance Companies**: Automated underwriting for life/health insurance
- **Product Teams**: Quickly test different risk models and pricing strategies
- **Actuaries**: Configure risk factors without developer involvement
- **Compliance Teams**: Transparent, auditable decision-making process

### 1.4 Architecture Overview

```
User Input (Form)
    ↓
Server Action (actions.ts)
    ↓
Evaluation System (evaluation-system.ts)
    ├─→ Health Text → LLM Classification
    ├─→ Decision Gates (REJECT/PENDING_INFO)
    ├─→ Risk Factor Evaluation (database config)
    └─→ Premium Calculation (database config)
    ↓
Result Display with Full Audit Trail
```

**Configuration Flow:**
```
Chat Interface → AI Parsing → Database Save → Graph Visualization
```

---

## 2. System Architecture

### 2.1 High-Level Overview

The system consists of three main parts:

1. **Application Interface** (`/`) - User-facing form and results
2. **Configuration Interface** (`/config`) - Admin rule management
3. **Evaluation Engine** - Core logic for risk assessment

### 2.2 Component Structure

```
src/app/
├── page.tsx                    # Main application form
├── actions.ts                   # Server actions for form submission
├── evaluation-system.ts         # Core evaluation logic
└── config/
    ├── page.tsx                 # Configuration UI
    ├── chat-interface.tsx       # AI chat component
    ├── rule-graph.tsx           # Graph visualization
    ├── rule-list.tsx            # Rule list sidebar
    ├── actions.ts               # Configuration server actions
    └── types.ts                 # TypeScript types

src/lib/
├── db.ts                        # Prisma client
└── config-loader.ts             # Load rules from database

prisma/
├── schema.prisma                # Database schema
└── seed.ts                      # Initial data seeding
```

### 2.3 Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: SQLite (Prisma ORM)
- **AI/LLM**: OpenAI GPT-4o via Vercel AI SDK
- **Expression Evaluation**: expr-eval library
- **Visualization**: React Flow (@xyflow/react)
- **Styling**: Tailwind CSS
- **Language**: TypeScript

### 2.4 Data Flow

```
┌─────────────┐
│ User Input  │
│  (Form)     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Server      │
│ Action      │
└──────┬──────┘
       │
       ▼
┌─────────────────────────┐
│ Evaluation System       │
│                         │
│ 1. Normalize Health     │
│    (LLM → structured)   │
│                         │
│ 2. Check Gates          │
│    (REJECT? INFO?)      │
│                         │
│ 3. Evaluate Risk        │
│    (Load from DB)       │
│                         │
│ 4. Calculate Premium    │
│    (DB formulas)        │
│                         │
│ 5. Classify Decision    │
│    (ACCEPT/REJECT)      │
└──────┬──────────────────┘
       │
       ▼
┌─────────────┐
│ Result +    │
│ Audit Trail │
└─────────────┘
```

### 2.5 Decision Pipeline

The system follows a strict priority order:

1. **DECLINE Gate** - Check if fundamentally uninsurable
2. **GATHER_INFO Gate** - Check if more information needed
3. **Risk Evaluation** - Calculate risk multipliers
4. **Premium Calculation** - Compute base + loadings
5. **Decision Classification** - ACCEPT vs ACCEPT_WITH_PREMIUM

---

## 3. Core Components

### 3.1 Evaluation System

Location: `src/app/evaluation-system.ts`

The evaluation system is the heart of the application. It processes applicant data through multiple stages.

#### 3.1.1 Health Text Normalization (LLM)

**Function**: `normalizeHealthText(pastInjuries: string)`

Converts free-text health descriptions into structured data using GPT-4o.

**Input Examples:**
- "Broke my wrist 4 years ago, fully healed"
- "Lower back pain, physio 2x/mo, still hurts when lifting"
- "Lung cancer last year, still on chemo"

**Output Structure:**
```typescript
{
  severity: "minor" | "moderate" | "severe",
  status: "resolved" | "ongoing" | "unclear",
  impact: "none" | "partial" | "major"
}
```

**Key Features:**
- Temperature = 0 (deterministic)
- Uses structured output (Zod schema)
- Includes examples in prompt for consistency

#### 3.1.2 Decision Gates

**REJECT Gate**: `shouldDecline(data, health)`

Checks configurable decline rules from database. Returns true if any active decline rule matches.

**GATHER_INFO Gate**: `shouldGatherInfo(data, health)`

Checks configurable gather-info rules. Returns questions to ask if conditions met.

#### 3.1.3 Risk Factor Evaluation

**Function**: `evaluateRiskFactors(data, health)`

1. Loads all active risk factors from database
2. Evaluates each expression with applicant data
3. Multiplies all multipliers together
4. Returns total multiplier + detailed breakdown

**Multiplier Math:**
```
totalMultiplier = factor1 × factor2 × factor3 × ...
```

Example:
- BMI: 1.14
- Smoker: 1.5
- Age: 1.15
- **Total: 1.14 × 1.5 × 1.15 = 1.9665**

#### 3.1.4 Premium Calculation

**Function**: `calculatePremium(age, sex, coverageCHF, totalMultiplier)`

1. Loads mortality rate formula from database (or uses fallback)
2. Calculates base premium: `coverage × mortalityRate`
3. Applies risk multiplier: `base × totalMultiplier`
4. Adds margin (10%): `riskAdjusted × 1.1`
5. Returns final premium in CHF/year

### 3.2 Configuration System

#### 3.2.1 Database-Backed Configuration

All configuration lives in the database:
- Risk factors (expressions)
- Decline rules (conditions)
- Gather info rules (conditions + questions)
- Mortality formulas

**Benefits:**
- No code deployment needed for rule changes
- Version control via ConfigVersion table
- Instant activation/deactivation
- Full audit trail

#### 3.2.2 AI Chat Interface

**Location**: `src/app/config/chat-interface.tsx`

Users describe rules in natural language:
```
User: "Add BMI loading above 30, 2% per point"
AI: Parses → Creates expression → Shows preview → User activates
```

**How it works:**
1. User types natural language request
2. `parseRuleFromNaturalLanguage()` uses GPT-4o to extract:
   - Rule type (risk_factor, decline_rule, etc.)
   - Expression/condition
   - Metadata (label, description, priority)
3. Shows preview with explanation
4. User clicks "Activate Rule"
5. Saves to database via `saveRule()`
6. Graph automatically updates

#### 3.2.3 Graph Visualization

**Location**: `src/app/config/rule-graph.tsx`

Shows **one rule at a time** as a flow:

```
Evaluation Start
    ↓
Input Variables (bmi, age, etc.)
    ↓
Rule Logic (expression/condition)
    ↓
Output (multiplier/decision)
    ↓
Example Calculations (for risk factors)
```

**Node Colors:**
- 🟢 Green = Risk Factors
- 🔴 Red = Decline Rules
- 🟡 Yellow = Gather Info Rules
- 🟣 Purple = Mortality Formulas

#### 3.2.4 Rule Management

**Rule List Component**: Shows all rules, filterable by type
- Click rule to visualize it
- See expression, status (active/inactive)
- Organized by type

### 3.3 User Interface

#### 3.3.1 Application Form

**Location**: `src/app/page.tsx`

Simple form collecting:
- Age, Sex, Coverage amount (required)
- Height, Weight (optional, for BMI)
- Smoking status (checkbox)
- Health history (free text)

**Features:**
- Real-time BMI calculation preview
- Validation with error messages
- Loading states during evaluation

#### 3.3.2 Results Display

Shows decision with color-coded UI:
- **Red** = REJECT
- **Yellow** = PENDING_INFORMATION
- **Green** = ACCEPT
- **Blue** = ACCEPT_WITH_PREMIUM

**Includes:**
- Decision explanation
- Premium breakdown (if applicable)
- Risk factor analysis with percentages
- Health classification visualization
- Premium calculation step-by-step

#### 3.3.3 Audit Trail

**Technical Audit Trail** (collapsible):
- All input data
- Health classification results
- System versions (model, config)
- Total multiplier
- Triggered rules

**Full JSON** (nested, for deep inspection)

---

## 4. Database Schema

### 4.1 RiskFactor Model

Stores risk multiplier configurations.

```prisma
model RiskFactor {
  id          String   @id @default(cuid())
  name        String   @unique  // e.g., "bmi", "smoker"
  label       String            // Display name
  expression  String            // expr-eval expression
  description String?            // Optional explanation
  isActive    Boolean  @default(true)
  order       Int      @default(0)  // Evaluation order
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Example:**
```javascript
{
  name: "bmi",
  label: "BMI loading: +2% per BMI point above 25",
  expression: "1 + max(0, (bmi - 25) * 0.02)",
  isActive: true,
  order: 1
}
```

### 4.2 DeclineRule Model

Stores conditions that result in automatic rejection.

```prisma
model DeclineRule {
  id          String   @id @default(cuid())
  name        String   @unique
  label       String
  expression  String    // Boolean expression
  description String?
  reason      String    // Message shown to applicant
  isActive    Boolean   @default(true)
  priority    Int       @default(0)  // Lower = checked first
  createdAt DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Example:**
```javascript
{
  name: "severe_ongoing",
  label: "Severe Ongoing Condition",
  expression: "severity == 'severe' && status == 'ongoing'",
  reason: "Severe ongoing conditions are not eligible for coverage.",
  priority: 1
}
```

### 4.3 GatherInfoRule Model

Stores conditions that trigger follow-up questions.

```prisma
model GatherInfoRule {
  id          String   @id @default(cuid())
  name        String   @unique
  label       String
  condition   String   // Boolean expression
  description String?
  isActive    Boolean  @default(true)
  priority    Int      @default(0)
  questions   GatherInfoQuestion[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Relationships:**
- Has many `GatherInfoQuestion` records

### 4.4 GatherInfoQuestion Model

Questions associated with gather-info rules.

```prisma
model GatherInfoQuestion {
  id           String        @id @default(cuid())
  ruleId       String
  questionText String
  inputType    String        @default("text")  // "text", "number", "yesno"
  isRequired   Boolean       @default(true)
  order        Int           @default(0)
  rule         GatherInfoRule @relation(...)
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
}
```

### 4.5 MortalityRateFormula Model

Base premium calculation formulas.

```prisma
model MortalityRateFormula {
  id          String   @id @default(cuid())
  sex         String   @unique  // "male" or "female"
  formula     String            // Expression using "age" variable
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Example:**
```javascript
{
  sex: "male",
  formula: "0.0008 + age * 0.00002",
  description: "Base mortality rate for males"
}
```

### 4.6 SystemConfig Model

Global system settings (key-value pairs).

```prisma
model SystemConfig {
  id          String   @id @default(cuid())
  key         String   @unique
  value       String   // JSON string for complex values
  type        String   @default("string")  // "string", "number", "boolean", "json"
  description String?
  updatedAt   DateTime @updatedAt
}
```

### 4.7 ConfigVersion Model

Tracks configuration versions for audit purposes.

```prisma
model ConfigVersion {
  id          String   @id @default(cuid())
  version     String   @unique  // e.g., "2025-01-31"
  description String?
  createdAt   DateTime @default(now())
}
```

### 4.8 Relationships

- `GatherInfoRule` → `GatherInfoQuestion` (one-to-many)
- All other models are independent (no foreign keys)

---

## 5. How It Works: Step-by-Step

### 5.1 Application Submission Flow

#### 5.1.1 User Input

User fills out form at `/`:
- Age: 45
- Sex: Male
- Coverage: 500,000 CHF
- Height: 180 cm
- Weight: 85 kg
- Smoking: Yes
- Health: "Chronic back pain, ongoing physio"

#### 5.1.2 Data Collection

Form submission triggers `receiveResults()` server action:
- Validates required fields
- Calculates BMI: `85 / (1.8²) = 26.2`
- Calls evaluation system

#### 5.1.3 BMI Calculation

```typescript
if (heightCm && weightKg) {
  const heightM = heightCm / 100;
  bmi = weightKg / (heightM * heightM);
  bmi = Math.round(bmi * 10) / 10;  // Round to 1 decimal
}
```

### 5.2 Evaluation Pipeline

#### 5.2.1 Step A: Data Normalization

Raw input is already structured (numbers, booleans). No normalization needed here.

#### 5.2.2 Step B: Health Text Classification (LLM)

**Function**: `normalizeHealthText("Chronic back pain, ongoing physio")`

**LLM Process:**
1. Sends prompt to GPT-4o with:
   - Health description
   - Classification examples
   - Structured output schema
2. LLM returns:
   ```json
   {
     "severity": "moderate",
     "status": "ongoing",
     "impact": "partial"
   }
   ```
3. This replaces the free text with structured categories

**Why This Matters:**
- Free text: "back pain, physio" → Can't run if/else on this
- Structured: `{status: "ongoing"}` → Can evaluate `status == 'ongoing'`

#### 5.2.3 Step C: Decision Gates

**C.1 REJECT Gate**

Checks all active `DeclineRule` records from database:

```typescript
const declineRules = await getDeclineRules();
// Example rule: "severity == 'severe' && status == 'ongoing'"

for (const rule of declineRules) {
  const triggered = evaluateDeclineRule(rule.expression, context);
  if (triggered) {
    return { decision: "REJECT", reason: rule.reason };
  }
}
```

**In our example:**
- Severity: "moderate" (not "severe")
- Condition: `"severe" && "ongoing"` → **False**
- Continue to next gate

**C.2 GATHER_INFO Gate**

Checks all active `GatherInfoRule` records:

```typescript
const gatherInfoRules = await getGatherInfoRules();
// Example rule: "isNaN(bmi) || bmi == null"

for (const rule of gatherInfoRules) {
  const triggered = evaluateGatherInfoCondition(rule.condition, context);
  if (triggered) {
    questions.push(...rule.questions);
  }
}
```

**In our example:**
- BMI: 26.2 (exists)
- Condition: `isNaN(26.2) || null` → **False**
- Continue to risk evaluation

#### 5.2.4 Step D: Risk Factor Evaluation

**Process:**

1. Load all active risk factors from database (ordered by `order` field)

2. For each factor, evaluate expression:
   ```typescript
   // Context variables available:
   const context = {
     bmi: 26.2,
     age: 45,
     isSmoking: true,
     severity: "moderate",
     status: "ongoing",
     impact: "partial",
     max: Math.max,
     min: Math.min
   };
   
   // Example: BMI factor
   expression: "1 + max(0, (bmi - 25) * 0.02)"
   // Evaluates to: 1 + max(0, (26.2 - 25) * 0.02)
   //              = 1 + max(0, 1.2 * 0.02)
   //              = 1 + 0.024
   //              = 1.024
   ```

3. Multiply all multipliers:
   ```
   BMI: 1.024 (26.2 - 25 = 1.2, × 0.02 = 0.024)
   Smoker: 1.5
   Age: 1.15 (45 - 30 = 15, × 0.01 = 0.15)
   Health Severity: 1.1 (moderate)
   Health Status: 1.2 (ongoing)
   Health Impact: 1.1 (partial)
   
   Total: 1.024 × 1.5 × 1.15 × 1.1 × 1.2 × 1.1
        = 2.565
   ```

#### 5.2.5 Step E: Premium Calculation

**Process:**

1. Load mortality formula for sex:
   ```typescript
   // Male formula from DB: "0.0008 + age * 0.00002"
   const baseRate = evaluateFormula("0.0008 + age * 0.00002", { age: 45 });
   // = 0.0008 + 45 * 0.00002
   // = 0.0008 + 0.0009
   // = 0.0017 (0.17%)
   ```

2. Calculate base premium:
   ```
   basePremium = coverage × baseRate
              = 500,000 × 0.0017
              = 850 CHF/year
   ```

3. Apply risk multiplier:
   ```
   riskAdjusted = basePremium × totalMultiplier
                = 850 × 2.565
                = 2,180 CHF/year
   ```

4. Add margin (10%):
   ```
   finalPremium = riskAdjusted × 1.1
                = 2,180 × 1.1
                = 2,398 CHF/year
   ```

#### 5.2.6 Step F: Decision Classification

```typescript
if (totalMultiplier === 1.0) {
  decision = "ACCEPT";  // Standard risk
} else {
  decision = "ACCEPT_WITH_PREMIUM";  // Rated risk
}
```

**In our example:**
- Total multiplier: 2.565 (> 1.0)
- **Decision: ACCEPT_WITH_PREMIUM**
- Premium: 2,398 CHF/year
- Loadings: +156.5%

### 5.3 Decision Outcomes

#### 5.3.1 REJECT

**Triggered when:**
- Any active `DeclineRule` condition evaluates to true

**What happens:**
- Evaluation stops immediately
- No premium calculation
- Returns reason from decline rule

**Example:**
```
Health: "Stage 4 cancer, still on chemo"
LLM → {severity: "severe", status: "ongoing"}
Decline rule: "severity == 'severe' && status == 'ongoing'" → TRUE
Result: REJECT with reason
```

#### 5.3.2 PENDING_INFORMATION

**Triggered when:**
- Any active `GatherInfoRule` condition evaluates to true

**What happens:**
- Evaluation stops
- Returns list of questions from triggered rules
- No premium calculation (incomplete data)

**Example:**
```
BMI: null (not provided)
Gather info rule: "isNaN(bmi) || bmi == null" → TRUE
Result: PENDING_INFORMATION with questions
```

#### 5.3.3 ACCEPT

**Triggered when:**
- Passed all gates
- Total risk multiplier = 1.0 (no loadings)

**What happens:**
- Returns premium at standard rates
- Shows base premium only

#### 5.3.4 ACCEPT_WITH_PREMIUM

**Triggered when:**
- Passed all gates
- Total risk multiplier > 1.0

**What happens:**
- Returns premium with risk loadings
- Shows breakdown of all contributing factors
- Premium calculation with examples

---

## 6. Configuration System Deep Dive

### 6.1 Natural Language Rule Creation

#### 6.1.1 How AI Parses Requests

**Function**: `parseRuleFromNaturalLanguage(userInput, context)`

**Process:**

1. **User Input**: "Add BMI loading above 30, 2% per point"

2. **AI Prompt** includes:
   - User's request
   - Examples of similar rules
   - Existing rules (for context)
   - Expression syntax guide

3. **AI Returns** structured object:
   ```json
   {
     "intent": "create_risk_factor",
     "rule": {
       "type": "risk_factor",
       "name": "bmi_loading_30",
       "label": "BMI loading: +2% per BMI point above 30",
       "expression": "1 + max(0, (bmi - 30) * 0.02)",
       "isActive": true,
       "order": 1
     },
     "confidence": 0.95
   }
   ```

4. **Validation**: Confidence must be > 0.7

5. **User Review**: Shows preview, asks to activate

#### 6.1.2 Expression Generation

The AI understands common patterns:

**Pattern: "X% per Y above Z"**
```
"2% per BMI point above 30"
→ "1 + max(0, (bmi - 30) * 0.02)"
```

**Pattern: "If X then multiply by Y"**
```
"Smoking multiplies premium by 1.5"
→ "isSmoking ? 1.5 : 1.0"
```

**Pattern: "Decline if X and Y"**
```
"Decline severe ongoing conditions"
→ "severity == 'severe' && status == 'ongoing'"
```

#### 6.1.3 Rule Validation

Before saving, system:
- Validates expression syntax (can parse with expr-eval)
- Checks for required fields
- Ensures unique names
- Validates rule type matches expression format

### 6.2 Rule Types

#### 6.2.1 Risk Factors

**Purpose**: Adjust premium multiplier based on applicant characteristics

**Expression Returns**: Number (multiplier)

**Examples:**
- BMI: `1 + max(0, (bmi - 25) * 0.02)` → Returns 1.0 to ~1.5
- Smoking: `isSmoking ? 1.5 : 1.0` → Returns 1.0 or 1.5
- Age: `1 + max(0, (age - 30) * 0.01)` → Returns 1.0 to ~1.7

**Combined Effect:**
All multipliers are multiplied together.

#### 6.2.2 Decline Rules

**Purpose**: Automatically reject applications meeting certain conditions

**Expression Returns**: Boolean (true = decline)

**Evaluation Order**: By `priority` field (lower = checked first)

**Examples:**
```javascript
// Severe ongoing
"severity == 'severe' && status == 'ongoing'"

// Extreme BMI
"bmi > 45"

// High-risk combination
"(severity == 'severe' || impact == 'major') && age < 40"
```

**When Triggered:**
- Evaluation stops immediately
- Returns `REJECT` decision
- Shows reason from `reason` field

#### 6.2.3 Gather Info Rules

**Purpose**: Trigger follow-up questions when information is missing or unclear

**Condition Returns**: Boolean (true = gather info)

**Associated Questions**: Stored in `GatherInfoQuestion` table

**Examples:**
```javascript
// Missing BMI
"isNaN(bmi) || bmi == null"

// Unclear status
"status == 'unclear'"

// Vague description
"severity == 'unclear' || (status == 'unclear' && impact != 'none')"
```

**When Triggered:**
- Evaluation stops
- Returns `PENDING_INFORMATION`
- Shows all questions from triggered rules

#### 6.2.4 Mortality Formulas

**Purpose**: Calculate base premium before risk loadings

**Formula Returns**: Decimal (mortality rate, e.g., 0.0017)

**Variables Available**: `age` only

**Examples:**
```javascript
// Male
"0.0008 + age * 0.00002"
// At age 45: 0.0017 (0.17%)

// Female
"0.0006 + age * 0.000015"
// At age 45: 0.001275 (0.1275%)
```

**Used In:**
```
basePremium = coverage × mortalityRate
```

### 6.3 Graph Visualization

#### 6.3.1 Single Rule Flow

The graph shows **one rule at a time** (not all rules together).

**Flow Structure:**
```
┌─────────────────┐
│ Evaluation      │
│ Start           │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Input Variables  │
│ • bmi            │
│ • age            │
│ • isSmoking      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Rule Logic      │
│ Expression:     │
│ 1 + max(0, ...) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Output          │
│ Risk Multiplier │
│ Examples        │
└─────────────────┘
```

#### 6.3.2 Node Types

**Evaluation Start**: Blue, system node

**Input Variables**: Light blue, shows what data the rule uses

**Rule Logic**: Colored by type:
- Green = Risk Factor
- Red = Decline Rule
- Yellow = Gather Info
- Purple = Mortality Formula

**Output**: Dark gray, shows what the rule returns

**Examples**: Light gray, shows calculation examples (risk factors only)

#### 6.3.3 Edge Relationships

- **Solid arrows**: Data flow
- **Labels**: Show active/inactive status
- **Colors**: Match node type

**Interaction:**
- Click rule in list → Graph updates to show that rule
- Hover nodes → See details
- Use controls → Zoom, pan, fit view

---

## 7. Expression Language

### 7.1 Expr-Eval Syntax

The system uses the `expr-eval` library for safe expression evaluation.

#### 7.1.1 Operators

**Arithmetic:**
- `+` addition
- `-` subtraction
- `*` multiplication
- `/` division
- `%` modulo

**Comparison:**
- `==` equals (use `==`, not `===`)
- `!=` not equals
- `>` greater than
- `<` less than
- `>=` greater than or equal
- `<=` less than or equal

**Logical:**
- `and` AND
- `or` OR
- `!` NOT

**Ternary:**
- `condition ? valueIfTrue : valueIfFalse`

#### 7.1.2 Functions

**Built-in:**
- `max(a, b, ...)` - Returns maximum value
- `min(a, b, ...)` - Returns minimum value

**Available in context:**
- `isNaN(value)` - Check if not a number

#### 7.1.3 Variables

Available variables depend on context:

**Risk Factors:**
- `bmi` (number)
- `age` (number)
- `isSmoking` (boolean)
- `severity` (string: "minor", "moderate", "severe")
- `status` (string: "resolved", "ongoing", "unclear")
- `impact` (string: "none", "partial", "major")

**Decline/Gather Info Rules:**
- Same as above

**Mortality Formulas:**
- `age` (number only)

#### 7.1.4 Examples

**Simple arithmetic:**
```javascript
"1 + 0.5"  // Returns 1.5
```

**Conditional:**
```javascript
"isSmoking ? 1.5 : 1.0"  // 1.5 if smoking, 1.0 otherwise
```

**Complex conditional:**
```javascript
"severity == 'severe' ? 1.3 : (severity == 'moderate' ? 1.1 : 1.0)"
// Nested ternary
```

**With functions:**
```javascript
"1 + max(0, (bmi - 25) * 0.02)"
// If BMI < 25, max() returns 0, so multiplier = 1.0
// If BMI > 25, calculates percentage loading
```

**String comparison:**
```javascript
"status == 'ongoing' ? 1.2 : 1.0"
// Use == not ===
// Strings: 'ongoing' or "ongoing" both work
```

**Logical operators:**
```javascript
"severity == 'severe' && status == 'ongoing'"
// Both must be true
```

### 7.2 Available Context Variables

#### 7.2.1 Applicant Data

- `age`: Number (18-100 typically)
- `sex`: Not directly available (use mortality formula's sex field)
- `bmi`: Number or null
- `isSmoking`: Boolean

#### 7.2.2 Health Classification

From LLM normalization:

- `severity`: String - "minor" | "moderate" | "severe"
- `status`: String - "resolved" | "ongoing" | "unclear"
- `impact`: String - "none" | "partial" | "major"

#### 7.2.3 Helper Functions

Always available:
- `max(...values)` - Maximum
- `min(...values)` - Minimum
- `isNaN(value)` - Check if not a number

**Example usage:**
```javascript
"isNaN(bmi) || bmi == null"
// Returns true if BMI is missing/invalid
```

---

## 8. Setup & Installation

### 8.1 Prerequisites

- **Node.js**: 18+ recommended
- **pnpm**: Package manager
- **OpenAI API Key**: For LLM features
- **Git**: Version control (optional)

### 8.2 Installation Steps

1. **Clone/Navigate to project**
   ```bash
   cd blackbox-v0
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   # .env file should contain:
   DATABASE_URL="file:./dev.db"
   OPENAI_API_KEY="sk-..."
   ```

4. **Generate Prisma Client**
   ```bash
   pnpm db:generate
   ```

5. **Create database and tables**
   ```bash
   pnpm db:push
   ```

6. **Seed initial data**
   ```bash
   pnpm db:seed
   ```

7. **Start development server**
   ```bash
   pnpm dev
   ```

8. **Open browser**
   - Application: http://localhost:3000
   - Configuration: http://localhost:3000/config

### 8.3 Database Setup

**Initial Setup:**
- SQLite database created at `prisma/dev.db`
- Tables created automatically via `db:push`

**Seed Data Includes:**
- 6 Risk Factors (BMI, smoking, age, health factors)
- 2 Decline Rules (severe ongoing, severe major impact)
- 3 Gather Info Rules (missing BMI, unclear status, vague description)
- 2 Mortality Formulas (male, female)
- System config entries

**Verify Setup:**
```bash
# Check database exists
ls -la prisma/dev.db

# Open Prisma Studio to browse data
pnpm db:studio
```

### 8.4 Environment Variables

**Required:**

```bash
# Database connection
DATABASE_URL="file:./dev.db"

# OpenAI API key for LLM features
OPENAI_API_KEY="sk-your-key-here"
```

**Optional:**
```bash
# Node environment
NODE_ENV="development"
```

### 8.5 Running the Application

**Development:**
```bash
pnpm dev
# Opens http://localhost:3000
```

**Production Build:**
```bash
pnpm build
pnpm start
```

**Other Commands:**
```bash
pnpm db:generate  # Generate Prisma client
pnpm db:push     # Push schema to database
pnpm db:seed     # Seed initial data
pnpm db:studio   # Open Prisma Studio
pnpm lint        # Run linter
```

---

## 9. Usage Guide

### 9.1 For Applicants

#### 9.1.1 Filling Out the Form

**Required Fields:**
- **Age**: Must be 18-100
- **Sex**: Male or Female
- **Coverage Amount**: Minimum 10,000 CHF

**Optional Fields:**
- **Height & Weight**: For BMI calculation (both or neither)
- **Smoking Status**: Check if you smoke
- **Health History**: Free text description of health issues

**Tips:**
- Be honest about health conditions
- Provide specific details (dates, treatments, current status)
- Both height and weight needed for BMI

#### 9.1.2 Understanding Results

**Decision Types:**

1. **REJECT (Red)**
   - Application declined
   - Reason provided
   - No premium quote

2. **PENDING_INFORMATION (Yellow)**
   - More information needed
   - Questions listed
   - Answer and resubmit

3. **ACCEPT (Green)**
   - Approved at standard rates
   - No risk loadings
   - Premium shown

4. **ACCEPT_WITH_PREMIUM (Blue)**
   - Approved with adjusted premium
   - Risk loadings applied
   - Full breakdown shown

**Reading the Breakdown:**

**Risk Factor Analysis:**
- Each factor shows:
  - What it checks
  - How it was evaluated
  - Impact percentage
  - Multiplier value

**Premium Calculation:**
- Base premium: Before risk adjustments
- Risk loadings: Additional % based on risk factors
- Final premium: Base + loadings + margin

#### 9.1.3 Reading the Audit Trail

**Health Classification:**
- Shows how your health text was categorized
- Severity, Status, Impact breakdown

**Technical Audit Trail:**
- All input data
- Classification results
- Which rules triggered
- System versions used

**Raw JSON:**
- Complete technical details
- For compliance/audit purposes

### 9.2 For Administrators

#### 9.2.1 Accessing Configuration

Navigate to `/config` or click "⚙️ Configure Rules" on home page.

**Interface Layout:**
- **Left Panel (1/3)**: Chat interface (top) + Rule list (bottom)
- **Right Panel (2/3)**: Graph visualization

#### 9.2.2 Creating Rules via Chat

**Process:**

1. **Type natural language request:**
   ```
   Add BMI loading above 30, 2% per point
   ```

2. **AI responds with:**
   - What rule it will create
   - Expression it generated
   - Preview of behavior

3. **Click "✓ Activate Rule":**
   - Rule saved to database
   - Immediately active
   - Appears in rule list
   - Graph updates

**Common Requests:**
```
"Add smoking loading of 50%"
"Decline BMI above 45"
"Ask for clarification when health status is unclear"
"Change BMI threshold to 30"
"Add age loading, 1% per year above 30"
```

**Best Practices:**
- Be specific: "BMI above 30" not "BMI thing"
- Include percentages: "2% per point"
- Specify thresholds: "above 25" not "high BMI"

#### 9.2.3 Understanding the Graph

**Selecting a Rule:**
- Click rule in left panel
- Graph updates to show that rule's flow

**What You See:**
1. **Evaluation Start** (blue) - System entry point
2. **Input Variables** (light blue) - Data the rule uses
3. **Rule Logic** (colored by type) - The expression/condition
4. **Output** (dark gray) - What the rule returns
5. **Examples** (gray) - Calculation examples (risk factors only)

**Colors:**
- 🟢 Green = Risk Factor
- 🔴 Red = Decline Rule
- 🟡 Yellow = Gather Info Rule
- 🟣 Purple = Mortality Formula

#### 9.2.4 Modifying Rules

**Via Chat:**
```
"Change the BMI threshold from 25 to 30"
"Disable the severe ongoing decline rule"
"Update smoking loading to 75%"
```

AI will parse and update existing rules.

**Via Prisma Studio:**
```bash
pnpm db:studio
```
- Navigate to table
- Edit fields directly
- Changes take effect after cache expires (1 minute)

**Via Database:**
```typescript
await prisma.riskFactor.update({
  where: { name: "bmi" },
  data: {
    expression: "1 + max(0, (bmi - 30) * 0.02)",
    label: "BMI loading: +2% per BMI point above 30"
  }
});
```

#### 9.2.5 Managing Rules in Database

**View All Rules:**
```bash
pnpm db:studio
```

**Or programmatically:**
```typescript
import { prisma } from "./lib/db";

const riskFactors = await prisma.riskFactor.findMany({
  where: { isActive: true },
  orderBy: { order: "asc" }
});
```

**Activate/Deactivate:**
```typescript
await prisma.riskFactor.update({
  where: { name: "bmi" },
  data: { isActive: false }  // Disable rule
});
```

**Delete Rule:**
```typescript
await prisma.riskFactor.delete({
  where: { name: "bmi" }
});
```

---

## 10. Examples & Use Cases

### 10.1 Common Rule Patterns

#### 10.1.1 BMI Loading

**Request:**
```
Add 2% loading per BMI point above 25
```

**Generated Expression:**
```javascript
"1 + max(0, (bmi - 25) * 0.02)"
```

**How it works:**
- BMI 25 or below → Multiplier 1.0 (no loading)
- BMI 30 → 1 + (30-25)×0.02 = 1.10 (+10%)
- BMI 35 → 1 + (35-25)×0.02 = 1.20 (+20%)

**Variations:**
```
"BMI loading above 30, 1% per point"
→ "1 + max(0, (bmi - 30) * 0.01)"

"No loading until BMI 30, then 3% per point"
→ "bmi > 30 ? (1 + (bmi - 30) * 0.03) : 1.0"
```

#### 10.1.2 Smoking Loading

**Request:**
```
Smoking adds 50% to premium
```

**Generated Expression:**
```javascript
"isSmoking ? 1.5 : 1.0"
```

**How it works:**
- Non-smoker → 1.0 (no loading)
- Smoker → 1.5 (+50% loading)

**Variations:**
```
"Smoking adds 75%"
→ "isSmoking ? 1.75 : 1.0"

"Smoking multiplies by 2"
→ "isSmoking ? 2.0 : 1.0"
```

#### 10.1.3 Age-Based Loading

**Request:**
```
Add 1% loading per year above age 30
```

**Generated Expression:**
```javascript
"1 + max(0, (age - 30) * 0.01)"
```

**How it works:**
- Age 30 or below → 1.0 (no loading)
- Age 40 → 1 + (40-30)×0.01 = 1.10 (+10%)
- Age 50 → 1 + (50-30)×0.01 = 1.20 (+20%)

**Variations:**
```
"Age loading starts at 40"
→ "1 + max(0, (age - 40) * 0.01)"

"Exponential age loading"
→ "1 + max(0, (age - 30) * (age - 30) * 0.0001)"
```

#### 10.1.4 Health Condition Rules

**Request:**
```
Decline severe ongoing conditions
```

**Generated Condition:**
```javascript
"severity == 'severe' && status == 'ongoing'"
```

**Request:**
```
Add 30% loading for severe health conditions
```

**Generated Expression:**
```javascript
"severity == 'severe' ? 1.3 : 1.0"
```

**Request:**
```
Add 20% loading for ongoing conditions
```

**Generated Expression:**
```javascript
"status == 'ongoing' ? 1.2 : 1.0"
```

**Complex Examples:**
```
"Severe OR major impact adds 30%"
→ "(severity == 'severe' || impact == 'major') ? 1.3 : 1.0"

"Ongoing moderate conditions add 15%"
→ "(status == 'ongoing' && severity == 'moderate') ? 1.15 : 1.0"
```

### 10.2 Real-World Scenarios

#### 10.2.1 Standard Risk Applicant

**Input:**
- Age: 35, Male
- Coverage: 500,000 CHF
- BMI: 24
- Smoking: No
- Health: "I'm healthy, no issues"

**Evaluation:**
1. Health: `{severity: "minor", status: "resolved", impact: "none"}`
2. Gates: Pass (no severe ongoing, no missing data)
3. Risk Factors:
   - BMI: 1.0 (below 25)
   - Smoking: 1.0 (non-smoker)
   - Age: 1.05 (+5%)
   - Health: All 1.0
   - **Total: 1.05**
4. Premium:
   - Base: 500,000 × 0.00145 = 725 CHF
   - Adjusted: 725 × 1.05 = 761 CHF
   - Final: 761 × 1.1 = 837 CHF/year

**Decision: ACCEPT_WITH_PREMIUM** (small age loading)

#### 10.2.2 High-Risk Applicant

**Input:**
- Age: 50, Male
- Coverage: 500,000 CHF
- BMI: 32
- Smoking: Yes
- Health: "High blood pressure, ongoing medication"

**Evaluation:**
1. Health: `{severity: "moderate", status: "ongoing", impact: "partial"}`
2. Gates: Pass
3. Risk Factors:
   - BMI: 1.14 (+14%)
   - Smoking: 1.5 (+50%)
   - Age: 1.20 (+20%)
   - Health Severity: 1.1 (+10%)
   - Health Status: 1.2 (+20%)
   - Health Impact: 1.1 (+10%)
   - **Total: 2.49**
4. Premium:
   - Base: 500,000 × 0.0018 = 900 CHF
   - Adjusted: 900 × 2.49 = 2,241 CHF
   - Final: 2,241 × 1.1 = 2,465 CHF/year

**Decision: ACCEPT_WITH_PREMIUM** (+149% loadings)

#### 10.2.3 Declined Applicant

**Input:**
- Age: 45, Male
- Coverage: 500,000 CHF
- BMI: 28
- Smoking: No
- Health: "Stage 4 cancer, currently on chemotherapy"

**Evaluation:**
1. Health: `{severity: "severe", status: "ongoing", impact: "major"}`
2. Decline Gate:
   - Rule: `"severity == 'severe' && status == 'ongoing'"` → **TRUE**
3. **STOP** - Decision: REJECT

**Result:**
- Decision: REJECT
- Reason: "Severe ongoing conditions are not eligible for coverage"
- No premium calculated

#### 10.2.4 Information Gathering

**Input:**
- Age: 40, Female
- Coverage: 300,000 CHF
- BMI: null (no height/weight)
- Smoking: No
- Health: "Had some back issues years ago, not sure if resolved"

**Evaluation:**
1. Health: `{severity: "moderate", status: "unclear", impact: "none"}`
2. Gather Info Gate:
   - Rule 1: `"isNaN(bmi) || bmi == null"` → TRUE
   - Rule 2: `"status == 'unclear'"` → TRUE
3. **STOP** - Decision: PENDING_INFORMATION

**Result:**
- Decision: PENDING_INFORMATION
- Questions:
  - "Please confirm your current weight (kg) and height (cm)."
  - "Could you provide more details about the status of your health condition?"
- No premium calculated

---

## 11. API Reference

### 11.1 Server Actions

#### 11.1.1 receiveResults

**Location**: `src/app/actions.ts`

**Signature:**
```typescript
export async function receiveResults(
  age: number,
  sex: "male" | "female",
  coverageCHF: number,
  heightCm: number | null,
  weightKg: number | null,
  isSmoking: boolean,
  pastInjuries: string
): Promise<EvaluationResult>
```

**Parameters:**
- `age`: Applicant age (18-100)
- `sex`: "male" or "female"
- `coverageCHF`: Coverage amount (minimum 10,000)
- `heightCm`: Height in centimeters (optional)
- `weightKg`: Weight in kilograms (optional)
- `isSmoking`: Boolean smoking status
- `pastInjuries`: Free text health description

**Returns**: `EvaluationResult` with decision, premium (if applicable), and audit trail

**Example:**
```typescript
const result = await receiveResults(
  45,           // age
  "male",       // sex
  500000,       // coverage
  180,          // height
  85,           // weight
  true,         // smoking
  "Back pain"   // health
);
```

#### 11.1.2 parseRuleFromNaturalLanguage

**Location**: `src/app/config/actions.ts`

**Signature:**
```typescript
export async function parseRuleFromNaturalLanguage(
  userInput: string,
  context?: {
    existingRules?: Array<{ name: string; type: string; label: string }>;
    intent?: string;
  }
): Promise<RuleParseResult | null>
```

**Parameters:**
- `userInput`: Natural language description of rule
- `context`: Optional context (existing rules, intent hints)

**Returns**: Parsed rule configuration or null if parsing fails

**Example:**
```typescript
const rule = await parseRuleFromNaturalLanguage(
  "Add BMI loading above 30, 2% per point"
);
// Returns: { type: "risk_factor", name: "bmi_loading_30", expression: "...", ... }
```

#### 11.1.3 saveRule

**Location**: `src/app/config/actions.ts`

**Signature:**
```typescript
export async function saveRule(
  rule: RuleParseResult
): Promise<{ success: boolean; id?: string; error?: string }>
```

**Parameters:**
- `rule`: Parsed rule configuration

**Returns**: Success status with ID or error message

**Example:**
```typescript
const result = await saveRule({
  type: "risk_factor",
  name: "bmi",
  label: "BMI loading",
  expression: "1 + max(0, (bmi - 25) * 0.02)",
  isActive: true,
  order: 1
});
```

#### 11.1.4 loadAllRules

**Location**: `src/app/config/actions.ts`

**Signature:**
```typescript
export async function loadAllRules(): Promise<any[]>
```

**Returns**: Array of all rules (risk factors, decline rules, gather info rules, mortality formulas)

**Example:**
```typescript
const rules = await loadAllRules();
// Returns array with all rule types combined
```

### 11.2 Evaluation Functions

#### 11.2.1 evaluateApplicant

**Location**: `src/app/evaluation-system.ts`

**Main entry point** for evaluation.

**Signature:**
```typescript
export async function evaluateApplicant(
  data: ApplicantData
): Promise<EvaluationResult>
```

**Parameters:**
```typescript
interface ApplicantData {
  age: number;
  sex: "male" | "female";
  coverageCHF: number;
  bmi: number | null;
  isSmoking: boolean;
  pastInjuries: string;
}
```

**Returns**: Complete evaluation result

**Process:**
1. Normalize health text
2. Check decline gates
3. Check gather-info gates
4. Evaluate risk factors
5. Calculate premium
6. Classify decision

#### 11.2.2 normalizeHealthText

**Location**: `src/app/evaluation-system.ts`

Converts free text to structured health data.

**Signature:**
```typescript
async function normalizeHealthText(
  pastInjuries: string
): Promise<ParsedHealthData>
```

**Returns:**
```typescript
{
  severity: "minor" | "moderate" | "severe",
  status: "resolved" | "ongoing" | "unclear",
  impact: "none" | "partial" | "major"
}
```

#### 11.2.3 shouldDecline

**Location**: `src/app/evaluation-system.ts`

Checks if applicant should be declined.

**Signature:**
```typescript
async function shouldDecline(
  data: ApplicantData,
  health: ParsedHealthData
): Promise<{ should: boolean; rule?: DeclineRuleConfig; reason?: string }>
```

**Returns**: Whether to decline and which rule triggered

#### 11.2.4 shouldGatherInfo

**Location**: `src/app/evaluation-system.ts`

Checks if more information needed.

**Signature:**
```typescript
async function shouldGatherInfo(
  data: ApplicantData,
  health: ParsedHealthData
): Promise<{ should: boolean; questions: string[]; triggeredRules: string[] }>
```

**Returns**: Questions to ask and which rules triggered

#### 11.2.5 evaluateRiskFactors

**Location**: `src/app/evaluation-system.ts`

Evaluates all risk factors and calculates total multiplier.

**Signature:**
```typescript
async function evaluateRiskFactors(
  data: ApplicantData,
  health: ParsedHealthData
): Promise<{
  totalMultiplier: number;
  riskFactors: string[];
  riskFactorDetails: RiskFactorDetail[];
}>
```

**Returns**: Total multiplier, factor list, detailed breakdown

#### 11.2.6 calculatePremium

**Location**: `src/app/evaluation-system.ts`

Calculates final premium.

**Signature:**
```typescript
async function calculatePremium(
  age: number,
  sex: "male" | "female",
  coverageCHF: number,
  totalMultiplier: number
): Promise<{
  basePremiumCHF: number;
  loadedPremiumCHF: number;
  loadingsPercent: number;
}>
```

**Returns**: Base premium, final premium, loading percentage

---

## 12. Advanced Topics

### 12.1 Expression Patterns

#### 12.1.1 Conditional Logic

**Simple if-then:**
```javascript
"bmi > 30 ? 1.2 : 1.0"
```

**Nested conditionals:**
```javascript
"bmi > 30 ? 1.3 : (bmi > 25 ? 1.1 : 1.0)"
```

**Multiple conditions:**
```javascript
"(bmi > 30 && age > 50) ? 1.5 : 1.0"
```

**Complex logic:**
```javascript
"severity == 'severe' ? 1.3 : (severity == 'moderate' ? 1.1 : (severity == 'minor' ? 1.0 : 1.05))"
```

#### 12.1.2 Mathematical Operations

**Linear scaling:**
```javascript
"1 + (bmi - 25) * 0.02"
```

**Capped scaling:**
```javascript
"1 + max(0, min((bmi - 25) * 0.02, 0.5))"
// Caps at 50% loading
```

**Threshold-based:**
```javascript
"bmi > 30 ? (1 + (bmi - 30) * 0.03) : 1.0"
// Only loads if BMI > 30
```

**Exponential:**
```javascript
"1 + (age - 30) * (age - 30) * 0.0001"
// Age loading increases quadratically
```

#### 12.1.3 Complex Expressions

**Multiple variables:**
```javascript
"(bmi > 30 && age > 50) ? 1.4 : (bmi > 30 ? 1.2 : 1.0)"
```

**Combining conditions:**
```javascript
"(severity == 'severe' || impact == 'major') && status == 'ongoing' ? 1.5 : 1.0"
```

**Null safety:**
```javascript
"(bmi != null && bmi > 30) ? 1.2 : 1.0"
```

### 12.2 Rule Priority & Ordering

#### 12.2.1 Decline Rule Priority

**How it works:**
- Rules checked in `priority` order (ascending)
- Lower priority = checked first
- First rule that triggers = immediate REJECT

**Example:**
```typescript
// Rule 1 (priority: 1) - Checked first
"severity == 'severe' && status == 'ongoing'"

// Rule 2 (priority: 2) - Checked if rule 1 doesn't match
"bmi > 45"
```

**Best practice:**
- Put most critical/expensive checks first (priority 1)
- Put edge cases later (priority 10+)

#### 12.2.2 Gather Info Priority

Same as decline rules - checked in priority order.

**Strategy:**
- Missing critical data: Priority 1
- Unclear information: Priority 2
- Nice-to-have clarifications: Priority 5+

#### 12.2.3 Risk Factor Order

**How it works:**
- Evaluated in `order` field order (ascending)
- Order affects display, not calculation (all multiplied together)

**Best practice:**
- Order 1-10: Core risk factors (BMI, smoking, age)
- Order 11-20: Health-related factors
- Order 21+: Specialized factors

**Note:** Order doesn't affect multiplier calculation (multiplication is commutative)

### 12.3 Caching & Performance

#### 12.3.1 Configuration Caching

**Location**: `src/app/evaluation-system.ts`

**Cache implementation:**
```typescript
let configCache: {
  riskFactors?: RiskFactorConfig[];
  declineRules?: DeclineRuleConfig[];
  gatherInfoRules?: GatherInfoRuleConfig[];
  mortalityFormulas?: Record<"male" | "female", any>;
  lastUpdated?: number;
} = {};

const CACHE_TTL = 60 * 1000; // 1 minute
```

**How it works:**
- First call loads from database
- Subsequent calls use cache if < 1 minute old
- After 1 minute, refreshes from database

**Benefits:**
- Reduces database queries
- Faster evaluation
- Still responsive to changes (1 min delay)

#### 12.3.2 Cache Invalidation

**Automatic:**
- Cache expires after 1 minute
- Next evaluation loads fresh data

**Manual (if needed):**
- Restart server
- Clear cache variable
- Modify `lastUpdated` timestamp

**For production:**
- Consider Redis for distributed caching
- Longer TTL (5-10 minutes)
- Manual invalidation webhooks

---

## 13. Troubleshooting

### 13.1 Common Issues

#### 13.1.1 Expression Errors

**Error**: `Error: unexpected TOP: =`

**Cause**: Using `===` instead of `==`

**Fix**: Use `==` for comparisons in expressions
```javascript
// ❌ Wrong
"severity === 'severe'"

// ✅ Correct
"severity == 'severe'"
```

**Error**: `Error evaluating risk factor: ...`

**Cause**: Syntax error or undefined variable

**Fix**: 
- Check expression syntax
- Verify all variables exist in context
- Test expression in Prisma Studio or manually

#### 13.1.2 LLM Classification Failures

**Error**: Classification returns unexpected values

**Cause**: LLM didn't follow schema or prompt unclear

**Fix**:
- Check OpenAI API key is valid
- Verify model access (GPT-4o)
- Review prompt in `normalizeHealthText()`
- Temperature = 0 ensures deterministic results

**Error**: API timeout or rate limit

**Fix**:
- Check API quota
- Add retry logic
- Consider fallback to default values

#### 13.1.3 Database Connection Issues

**Error**: `PrismaClientInitializationError`

**Fix**:
```bash
# Regenerate Prisma client
pnpm db:generate

# Verify database exists
ls prisma/dev.db

# Check .env file
cat .env | grep DATABASE_URL
```

**Error**: Tables don't exist

**Fix**:
```bash
# Push schema to database
pnpm db:push

# Or run migrations
pnpm prisma migrate dev
```

### 13.2 Debugging

#### 13.2.1 Checking Rule Activation

**Via UI:**
- Go to `/config`
- Check rule list - should show "Inactive" badge if disabled
- Click rule to see details

**Via Database:**
```typescript
const rule = await prisma.riskFactor.findUnique({
  where: { name: "bmi" }
});
console.log(rule?.isActive); // Should be true
```

**Via Graph:**
- Active rules appear in graph
- Inactive rules don't appear

#### 13.2.2 Validating Expressions

**Test in code:**
```typescript
import { Parser } from "expr-eval";

const parser = new Parser();
const expr = parser.parse("1 + max(0, (bmi - 25) * 0.02)");
const result = expr.evaluate({ bmi: 30, max: Math.max });
console.log(result); // Should be 1.1
```

**Test manually:**
```javascript
// In browser console or Node
const bmi = 30;
const result = 1 + Math.max(0, (bmi - 25) * 0.02);
console.log(result); // 1.1
```

#### 13.2.3 Testing Rules

**Test evaluation end-to-end:**
```typescript
const result = await evaluateApplicant({
  age: 45,
  sex: "male",
  coverageCHF: 500000,
  bmi: 32,
  isSmoking: true,
  pastInjuries: "Back pain"
});

console.log(result.decision);
console.log(result.annualPremiumCHF);
```

**Test specific rule:**
```typescript
// Load rule
const rule = await prisma.declineRule.findUnique({
  where: { name: "severe_ongoing" }
});

// Evaluate condition
const context = {
  severity: "severe",
  status: "ongoing"
};
const parser = new Parser();
const expr = parser.parse(rule.expression);
const triggered = expr.evaluate(context);
console.log(triggered); // true or false
```

---

## 14. Best Practices

### 14.1 Rule Design

#### 14.1.1 Naming Conventions

**Risk Factors:**
- Use descriptive names: `bmi`, `smoking`, `age`
- Avoid: `rule1`, `factor_x`

**Decline Rules:**
- Use descriptive condition names: `severe_ongoing`, `extreme_bmi`
- Avoid: `decline1`, `rule_a`

**Labels:**
- User-friendly: "BMI loading: +2% per BMI point above 25"
- Avoid: "BMI factor" or technical jargon

#### 14.1.2 Expression Best Practices

**Keep it simple:**
```javascript
// ✅ Good
"isSmoking ? 1.5 : 1.0"

// ❌ Avoid unnecessary complexity
"isSmoking == true ? 1.5 : (isSmoking == false ? 1.0 : 1.0)"
```

**Use max/min for safety:**
```javascript
// ✅ Good - Prevents negative multipliers
"1 + max(0, (bmi - 25) * 0.02)"

// ❌ Risky - Could go negative
"1 + (bmi - 25) * 0.02"
```

**Test edge cases:**
- BMI = null → Expression should handle gracefully
- Age = 0 or very high → Check bounds
- Boolean variables → Use proper comparison

#### 14.1.3 Testing Rules Before Activation

**Manual testing:**
```typescript
// Test with various inputs
const testCases = [
  { bmi: 25, expected: 1.0 },
  { bmi: 30, expected: 1.1 },
  { bmi: 35, expected: 1.2 }
];

for (const test of testCases) {
  const parser = new Parser();
  const expr = parser.parse("1 + max(0, (bmi - 25) * 0.02)");
  const result = expr.evaluate({ bmi: test.bmi, max: Math.max });
  console.assert(result === test.expected, `Failed: ${result} !== ${test.expected}`);
}
```

**Create with isActive: false first:**
- Test expression manually
- Verify logic is correct
- Then set isActive: true

### 14.2 Configuration Management

#### 14.2.1 Version Control

**Use ConfigVersion table:**
```typescript
await prisma.configVersion.create({
  data: {
    version: "2025-02-01",
    description: "Updated BMI threshold to 30"
  }
});
```

**Document changes:**
- Update `description` fields
- Add notes in ConfigVersion
- Keep changelog

#### 14.2.2 Change Documentation

**Before making changes:**
1. Document what you're changing
2. Note why (business reason)
3. Test in non-production first

**Example:**
```
Changed BMI threshold from 25 to 30.
Reason: Actuarial analysis shows BMI 25-30 is standard risk.
Impact: Reduces loading for applicants BMI 25-30.
Tested: Verified with 10 sample applicants.
```

#### 14.2.3 Rollback Strategies

**Quick disable:**
```typescript
// Disable rule without deleting
await prisma.riskFactor.update({
  where: { name: "bmi" },
  data: { isActive: false }
});
```

**Version-based rollback:**
- Keep old expressions in database
- Use ConfigVersion to track
- Restore previous version's rules

**Database backup:**
```bash
# Backup before major changes
cp prisma/dev.db prisma/dev.db.backup

# Restore if needed
cp prisma/dev.db.backup prisma/dev.db
```

---

## 15. Future Enhancements

### 15.1 Potential Features

#### 15.1.1 Underwriter Workflow

**Manual Review:**
- Underwriters can approve/decline after system assessment
- Add comments/notes
- Override system decisions (with audit trail)

**Queue Management:**
- List of cases needing review
- Filter by decision type, risk level
- Assign to underwriters

**Implementation:**
```typescript
// Add to schema
model UnderwriterDecision {
  applicationId String
  underwriterId String
  decision      UnderwriterDecision  // APPROVE, DECLINE, REQUEST_REVIEW
  notes         String?
  createdAt     DateTime
}
```

#### 15.1.2 A/B Testing Rules

**Split Testing:**
- Test two different rule sets
- Randomly assign applicants
- Compare outcomes

**Implementation:**
- Add `variant` field to rules
- Route applicants to variants
- Track metrics per variant

#### 15.1.3 Analytics Dashboard

**Metrics:**
- Application volume
- Acceptance/rejection rates
- Average premiums
- Rule trigger frequency

**Visualizations:**
- Charts of decisions over time
- Risk factor impact analysis
- Premium distribution

#### 15.1.4 Rule Templates

**Pre-built Templates:**
- Common risk factor patterns
- Standard decline rules
- Mortality rate tables by region

**Template Library:**
- Browse templates
- One-click application
- Customize parameters

#### 15.1.5 Multi-Product Support

**Product Configuration:**
- Different rule sets per product
- Product-specific mortality tables
- Custom coverage limits

**Implementation:**
```typescript
model Product {
  id        String
  name      String
  rules     ProductRule[]
  // ...
}
```

### 15.2 Technical Improvements

**Performance:**
- Redis caching
- Database query optimization
- Batch processing for bulk evaluations

**Reliability:**
- Retry logic for LLM calls
- Fallback expressions
- Error monitoring

**Scalability:**
- PostgreSQL for production
- Connection pooling
- Read replicas for config reads

---

## 16. Glossary

**Applicant**: Person applying for insurance coverage

**Assessment**: System's automated evaluation of an applicant (distinct from final underwriter decision)

**Base Premium**: Premium before risk loadings, calculated from mortality rate

**BMI**: Body Mass Index, calculated as weight(kg) / height(m)²

**Decline Rule**: Configurable condition that results in automatic rejection

**Expression**: Mathematical/logical formula evaluated by expr-eval library

**Gather Info Rule**: Condition that triggers follow-up questions

**Health Classification**: Structured categorization of free-text health descriptions (severity, status, impact)

**Loading**: Additional premium percentage added due to risk factors

**Multiplier**: Factor applied to base premium (1.0 = no change, 1.5 = +50%)

**Mortality Rate**: Base probability of death used in premium calculation

**Risk Factor**: Configurable expression that adjusts premium multiplier

**Risk Multiplier**: Combined multiplier from all risk factors (multiplicative)

**Underwriter**: Human who makes final approval/decline decisions (future feature)

---

## 17. Appendix

### 17.1 File Structure

```
blackbox-v0/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Initial data
├── src/
│   ├── app/
│   │   ├── page.tsx           # Main application form
│   │   ├── actions.ts         # Form submission
│   │   ├── evaluation-system.ts  # Core logic
│   │   └── config/
│   │       ├── page.tsx       # Config UI
│   │       ├── chat-interface.tsx
│   │       ├── rule-graph.tsx
│   │       ├── rule-list.tsx
│   │       ├── actions.ts    # Config server actions
│   │       └── types.ts
│   └── lib/
│       ├── db.ts              # Prisma client
│       └── config-loader.ts   # Load config from DB
├── package.json
├── .env                       # Environment variables
└── README.md
```

### 17.2 Code Examples

#### Complete Evaluation Flow

```typescript
// User submits form
const result = await receiveResults(
  45, "male", 500000, 180, 85, true, "Back pain"
);

// Behind the scenes:
// 1. Calculate BMI: 85 / 1.8² = 26.2
// 2. Normalize health: "Back pain" → {severity: "moderate", status: "unclear", impact: "none"}
// 3. Check gates: Pass
// 4. Evaluate factors: 1.024 × 1.5 × 1.15 × ... = 2.565
// 5. Calculate premium: 850 × 2.565 × 1.1 = 2,398 CHF
// 6. Decision: ACCEPT_WITH_PREMIUM

console.log(result.decision); // "ACCEPT_WITH_PREMIUM"
console.log(result.annualPremiumCHF); // 2398
```

#### Creating a Rule Programmatically

```typescript
// Via Prisma
await prisma.riskFactor.create({
  data: {
    name: "blood_pressure",
    label: "Blood Pressure Loading",
    expression: "systolicBP > 140 ? 1.2 : 1.0",
    description: "High blood pressure adds 20% loading",
    isActive: true,
    order: 7
  }
});

// Or via chat interface
// User: "Add blood pressure loading, 20% if above 140"
// AI parses and saves automatically
```

#### Testing a Rule Expression

```typescript
import { Parser } from "expr-eval";

const parser = new Parser();
const expr = parser.parse("1 + max(0, (bmi - 25) * 0.02)");

const testCases = [
  { bmi: 20, expected: 1.0 },
  { bmi: 25, expected: 1.0 },
  { bmi: 30, expected: 1.1 },
  { bmi: 35, expected: 1.2 }
];

testCases.forEach(({ bmi, expected }) => {
  const result = expr.evaluate({ bmi, max: Math.max });
  console.log(`BMI ${bmi}: ${result} (expected: ${expected})`);
});
```

### 17.3 Database Migrations

**Initial Setup:**
```bash
pnpm db:push
```

**For Production (PostgreSQL):**
```bash
# Create migration
pnpm prisma migrate dev --name init

# Apply migration
pnpm prisma migrate deploy
```

**Schema Changes:**
1. Edit `prisma/schema.prisma`
2. Run `pnpm db:push` (dev) or create migration (prod)
3. Regenerate client: `pnpm db:generate`

### 17.4 Seed Data Reference

**Default Risk Factors:**
- BMI: `1 + max(0, (bmi - 25) * 0.02)`
- Smoking: `isSmoking ? 1.5 : 1.0`
- Age: `1 + max(0, (age - 30) * 0.01)`
- Health Severity: `severity == 'severe' ? 1.3 : (severity == 'moderate' ? 1.1 : 1.0)`
- Health Status: `status == 'ongoing' ? 1.2 : 1.0`
- Health Impact: `impact == 'major' ? 1.25 : (impact == 'partial' ? 1.1 : 1.0)`

**Default Decline Rules:**
- Severe Ongoing: `severity == 'severe' && status == 'ongoing'`
- Severe Major Impact: `severity == 'severe' && impact == 'major'`

**Default Gather Info Rules:**
- Missing BMI: `isNaN(bmi) || bmi == null`
- Unclear Status: `status == 'unclear'`

**Default Mortality Formulas:**
- Male: `0.0008 + age * 0.00002`
- Female: `0.0006 + age * 0.000015`

---

## Conclusion

This system demonstrates how AI can be used to handle unstructured input (health text) while maintaining deterministic, auditable decision-making through configurable rules. The natural language configuration interface makes it accessible to non-technical users while the graph visualization provides clear understanding of how rules work.

The architecture separates concerns cleanly:
- **LLM handles**: Text → structured data conversion
- **Rules handle**: Structured data → decisions/pricing
- **Database handles**: Configuration management
- **UI handles**: User experience

This makes the system both powerful and maintainable, suitable for production use with proper security, testing, and compliance measures added.

---

**Version**: 1.0 (POC)
**Last Updated**: 2025-01-31
**Author**: System Documentation

