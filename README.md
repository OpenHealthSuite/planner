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
      - Description(?) (String: ie. "easy", "intervals", "hard" etc.) 
      - (Metric, Unit)[] (number, (reps, time, distance, string?))
        - NB: Making this an array of tuples, allows for reps of a pattern (ie. 6x4/2)
      - Repetitions (integer)
- Has it been completed? (yes/no)
- (optional) how did you feel about it (completion notes) - also covers why and how there was a substitution
- (optional) recurring workout id: if this workout served as a recurring workout.

### Recurring workouts

Recurring workouts would be the same as the above, except the following changes:

- No completed status - they're infinitely recurring until you turn them/the plan off
- No Notes - they aren't an "instance" they're a template
- Date is instead "first date" - it's where the recursion will be offset from
- Recurs every N days - allows most flexibility in how it recurrs

You mark them as "complete" within a particular day, by creating an activity on the given day with the id of the recurring workout associated

## TODO:

- ~~Refactor existing tracer code to match above schema for workouts~~
- ~~Add a concept/storage of distinct "plans" to the workouts - so workouts can be assigned to a plan (CRUD that casscades into workouts)~~
  - ~~Optional? The idea of people still being able to create workouts that aren't tied to a particular plan is useful~~
- ~~Build interface for creating and managing these plans (literally just a list with CRUD - we probably want an "archived" concept too)~~
- ~~Build an interface that makes it easy to create and edit the various kinds of workout singularly~~
- ~~Create a mobile-first weekly view of planned workouts~~
- ~~Create a bulk upload/download system for plans - probably CSV based~~
- Create a data purge endpoint
- ~~Implement the Cassandra storage layer with same interface as SQLite~~
- ~~Implement a way of creating and parsing recurring workouts~~

That probably comprises the MVP of the system - we can then tie it into the dashboard

# Configuration

- `PLANNER_SINGLE_USERID`: Sets the userid to a single user, no default
- `PLANNER_USERID_HEADER`: Sets the userid header, defaults to `x-planner-userid`
- `PLANNER_PORT`: Sets port serving app, defaults to `3333`
- `PLANNER_STORAGE_TYPE`: pick from `sqlite` or `cassandra`. Defaults to `sqlite`.
- `PLANNER_CASSANDRA_`...
  - All have default values to work with development script setup
  - `CONTACT_POINTS`: ; separated list of contact points.
  - `USER`: username for logging into cassandra
  - `PASSWORD`: password for logging into cassandra