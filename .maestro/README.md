# Maestro E2E Tests — Kaly

## Requirements
- **macOS** with Xcode + iOS Simulator (Maestro doesn't support iOS on Windows/Linux)
- Maestro CLI: `curl -Ls https://get.maestro.mobile.dev | bash`
- Kaly dev build installed on simulator

## Install & Run

```bash
# Install Maestro (macOS only)
curl -Ls https://get.maestro.mobile.dev | bash

# Run all tests
maestro test .maestro/

# Run a single test
maestro test .maestro/01_onboarding.yaml

# Run with screenshots saved to folder
maestro test .maestro/ --output screenshots/
```

## Test Files

| File | What it tests |
|------|--------------|
| `01_onboarding.yaml` | Full onboarding: goal → body → diet → diary |
| `02_diary.yaml` | Diary screen: meals, calories, macros, add food |
| `03_water.yaml` | Water tracker: + and - buttons work |
| `04_fasting.yaml` | Fasting: start/stop, timer, translated phases |
| `05_profile.yaml` | Profile: PDF export visible, language, theme |
| `06_consent.yaml` | GDPR consent modal: checkboxes, scrollable, buttons |
| `07_dark_light_contrast.yaml` | Theme switch: screenshots of all tabs in both modes |
| `08_paywall.yaml` | Paywall: prices, free button, legal links |

## What tests check
- All text is translated (no raw `i18n.key` or `\u` codes visible)
- All buttons are visible and tappable
- Dark mode: all text readable (no invisible elements)
- Light mode: same checks
- Navigation: forward, back, skip all work
- Screenshots at every step for visual review

## When to run
- Before every App Store submission
- After adding new screens or i18n keys
- After theme/color changes
