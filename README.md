# Happy Habits Buddy (General habits)

A phone app that helps a person start a change they chose themselves.

The person says what they want to change, in their own words, and picks a moment of their day. The AI companion **Buddy** answers with one small habit for that moment, in three sizes. It is not a chatbot.

This is a research prototype. It runs on a developer's computer and a test phone, not in an app store.

There is a second version about sustainable food habits: [habit-buddy](https://github.com/TeuSalii/habit-buddy). The two projects share no files.

## Purpose

Most intentions fail for two reasons: they are too big, and they have no place in the day. Buddy works on both.

- **The person decides what to change.** Change holds when it comes from the person's own motivation. Buddy never suggests what is worth changing and never judges the wish.
- **Buddy adds the how.** How small the change can start, and where in the day it fits.
- **Three sizes.** A minimum for a hard day, a standard for a normal day, and an advanced one for later. Every size counts as done.
- **Anchored.** The habit belongs to a moment that already happens, for example "after I take off my shoes at home".

Buddy is not a therapist, a doctor or a crisis service. Habits that harm the person, such as smoking, drinking or gambling, are in scope. Self-harm, eating disorders, illegal drugs and medical conditions are not: there Buddy declines and says so.

## What you need

| What | Why | Needed for |
| --- | --- | --- |
| [Node.js](https://nodejs.org) with npm | Runs the development server on your computer | Everything |
| [Expo Go](https://expo.dev/go) on an Android phone | Shows the app on the phone, without building or installing it | Using the app |
| Phone and computer on the same Wi-Fi | The phone loads the app from your computer | Using the app |
| An Anthropic API key | Buddy's offers are written by Claude | Using the app |
| [Ollama](https://ollama.com) with the model `gemma4:12b` | Runs Gemma on your computer, so nothing leaves the machine | Only if you switch the app to Gemma |

The app works without Ollama and Gemma. To try Gemma, set `OFFER_MODEL` to `"gemma"` in `src/client/ask-buddy.ts`.

## Run it

1. Install the packages:

   ```bash
   npm install
   ```

2. Create a file named `.env.local` in the project folder with your key. Git ignores this file, so the key stays on your computer.

   ```
   ANTHROPIC_API_KEY=your-key
   ```

3. Start the development server:

   ```bash
   npx expo start
   ```

4. Open Expo Go on the phone and scan the QR code from the terminal.

For Gemma, install Ollama, download the model once and keep the Ollama app running:

```bash
ollama pull gemma4:12b
```

## How it works

### For the person

1. **Introduction.** Two short steps: why a change needs more than wanting it, and who decides what.
2. **Your change.** One question at a time: what you want to change, why it matters to you, and the moment of your day it could hang on. Someone who cannot name a change yet gets two questions about their own day, not a list of goals.
3. **Buddy's idea.** One habit for that moment in three sizes, with one sentence on why it fits. The person can accept it or ask for another idea.
4. **Check-offs.** An accepted habit becomes a plan with one box per day.
5. **Day map.** All changes are shown at the part of the day they belong to: morning, midday, afternoon or evening.

From two open changes on, the form says that starting many habits at once is how none of them sticks. It does not forbid a further one.

### Under the hood

```
Phone (Expo Go)  →  API routes on your computer  →  rule sheet + model  →  offer  →  phone
```

- **The app and its server are one project.** The screens run on the phone. The files in `src/app/api/` run on your computer, inside the Expo development server. The API key never reaches the phone.
- **The rule sheet decides how Buddy answers.** It is plain Markdown in `rules/`: purpose, behavior science, voice, guardrails and the rules for offers. The files are read on every request, so an edit takes effect without a restart.
- **Two models, one contract.** Claude and Gemma receive the same rules and must reply in the same JSON shape. The app uses Claude.
- **The data stays on the phone.** Changes, plans and check-offs are stored on the device. There is no account. Several test persons can share one phone, and switching between them never deletes anything.
- **A log on your computer.** Every offer and check-off is written to `data/log.jsonl` with a random ID instead of a name. Git ignores the `data/` folder.

## Project layout

| Folder | Content |
| --- | --- |
| `rules/` | The rule sheet (design material) |
| `src/app/` | The one screen, and the API routes in `src/app/api/` |
| `src/client/` | Asking Buddy for an offer |
| `src/components/` | The parts the screen is built from |
| `src/content/` | The example shown in the introduction and on the empty day map |
| `src/server/` | Code that runs only on the computer: models, rule sheet, log |
| `src/shared/` | The contract between the app and the server |
| `src/storage/` | What the app saves on the phone |

## Commands

| Command | What it does |
| --- | --- |
| `npx expo start` | Starts the development server |
| `npx tsc --noEmit` | Checks the TypeScript types |

## Built with

Expo, React Native and TypeScript.
