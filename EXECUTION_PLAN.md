# Guardian Execution Plan

## 1. Finalization and Internal Testing

Goal: system stability and reduction of false routing decisions.

### Required tests
- [ ] tests for `GuardianTagger`
- [ ] tests for `PartitionRouter`
- [ ] reject path when confidence is below threshold
- [ ] routing coverage for all 3 partitions: `yesterday`, `today`, `tomorrow`

### Example minimal test
```ts
it("rejects low confidence", () => {
  const labels = {
    partition: "today",
    intent: "unknown",
    domain: "general",
    confidence: 0.6,
    signals: []
  };

  expect(() => router.route(labels as any)).toThrow();
});
```

## 2. APK Optimization and Signing

### Checklist
- [ ] ProGuard / R8 enabled
- [ ] debug logs removed
- [ ] environment variables cleaned from release build
- [ ] release signing completed

### Signing example
```bash
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
  -keystore your-release-key.keystore app-release.apk alias_name
```

## 3. Distribution Strategy

Use multiple channels:
- GitHub Releases for developers
- Google Play Beta for testers
- direct APK distribution for power users

### Suggested release structure
```text
v0.1-alpha
- Guardian Tagger v1
- Partition Router v1
- Basic filters
- Known issues: X, Y
```

## 4. Feedback Collection

Use feedback forms that evaluate the system, not only UX.

### Suggested questions
- What were you trying to do?
- Was the answer:
  - correct
  - partially correct
  - wrong
- Did the system understand context? (YES / NO)
- Did routing feel correct? (user perception)

## 5. Promotion

Focus on positioning, not spam.

### Suggested channels
- Reddit / r/LocalLLaMA
- Reddit / r/MachineLearning
- Reddit / r/AndroidDev
- LinkedIn
- Discord

### Suggested message hook
> I didn’t just run a large model on a small device.  
> I built a routing and control layer on top of it.

## 6. Feedback Loop

Core system loop:

```text
User → Feedback → Google Sheets → Filters → Guardian update
```

### Analyze especially
- cases where confidence was high but answer quality was poor
- cases where routing was incorrect
- repeated domain patterns

## Core Principle

The real game is not release hype.
The real game is:

**feedback → iteration → better system**

This is how Guardian becomes an evolving system instead of a dead demo.
