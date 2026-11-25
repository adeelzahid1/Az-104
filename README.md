# AZ-104 Prep

An Angular study app for the **AZ-104 Microsoft Azure Administrator** exam: 1,222 original practice
questions in real exam formats, timed mock exams weighted like the real exam, and weak-area tracking.

Questions are written from Microsoft Learn documentation against the official skills outline
(skills measured as of April 17, 2026). They are not exam dumps. Every answer has an
explanation and a Microsoft Learn link.

## Features

- **Practice** — filter by domain, difficulty and question type; each answer is checked immediately
  with an explanation.
- **Cheat sheet** — traps, keywords, comparisons, numbers and commands on one searchable, printable page.
- **Mock exam** — 10–60 questions split across domains by the official weights, optional timer
  (2 minutes per question), answers revealed only after you submit.
- **Results** — estimated score out of 1000 (pass mark 700), per-domain accuracy, and a review of
  every question.
- **Weak areas** — accuracy per domain and subtopic, and a mistakes pool you can drill until each
  question is answered correctly.
- **Question types** — single answer, choose 2 or 3, yes/no series, ordering, drop-down (hot area)
  with inline choices in commands and templates, matching, code and output reading (Bicep, ARM,
  KQL, CLI, PowerShell), and 10 multi-part case studies.
- Mock exams of 30+ questions end with a case study section, like the real exam.
- Options are shuffled every session, so the position of the correct answer carries no meaning.

Progress is stored in your browser's `localStorage` only.

## Run it

```bash
npm install
```

```bash
npm start
```

Then open http://localhost:4200/.

## Build and test

```bash
npm run build
```

```bash
npm test
```

Check the question bank for structural errors (IDs, answer keys, drop-down markers, case studies):

```bash
npm run validate:bank
```

## Project layout

| Path | Contents |
|---|---|
| `src/app/data/` | Question bank as JSON (240+ per domain), case studies (`cases.json`) and the `schema.ts` data model |
| `scripts/validate-bank.mjs` | Structural checks for the question bank |
| `src/app/core/` | Question loading, quiz engine, scoring and progress tracking |
| `src/app/shared/question-view.*` | Renders all four question types and the answer feedback |
| `src/app/features/` | Dashboard, practice/mock setup, quiz, results and weak-areas pages |
| `study-notes/` | Exam cheat sheets for each domain |
| `question-bank/` | The original 250 questions as readable markdown (October 2023 outline, not updated since) |

## Exam domains

| Domain | Weight |
|---|---|
| Manage Azure identities and governance | 20–25% |
| Implement and manage storage | 15–20% |
| Deploy and manage Azure compute resources | 20–25% |
| Implement and manage virtual networking | 15–20% |
| Monitor and maintain Azure resources | 10–15% |

Source: [AZ-104 study guide](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-104).
