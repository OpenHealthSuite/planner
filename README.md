# Planner

The idea is we should be more than just a calendar app - this should have a focus on how people actually treat their workouts. Some of the initial tracer code has some of this, however I need to take it a little further.

## Abstraction of a workout

This will all be framed roughly through the lens of running, but is broadly applicable:

- Date you're doing it: Even if you're just following a weekly pattern, those days have dates - even if we later provide a way for a user to abstract that a little
- Optional time
- Summary: In running parlance, it'd be saying something like "I did *45 minutes of intervals*" - rather than explaining every point of that interval session
- Workout stages: This is something where treating all workouts as "staged" is easier than drawing a distinction:
  - Single stage: "I did a *40 minute easy run*
  - Multi stage: "I did *15 minutes easy, 15 minutes fast, 10 minutes easy*
  - Multi stage with repetitions: "I did *10 minutes easy* then I did *6 repetitions of 4 minutes fast, 2 minutes slow*, then finished with *10 minutes easy*"
    - Should be able to cover all bases with stages having a schema of:
      - Metric (number)
      - Unit (time, distance, reps)
      - Repetitions (integer)
- Was it completed? (yes/no/substitution)
- how did you feel about it (completion notes) - also covers why and how there was a substitution