const { randomUUID } = require("node:crypto")
const { dateTimeFieldNormaliser } = require("./utilities")

const HOST = "http://localhost:3333"
const TEST_USER_ID = randomUUID()

describe('recurring activities', () => {
  test("Create, Read, Update, Query, Delete", async () => {
    let createdActivity = {
      summary: "Some activity name",
      planId: null,
      stages: [
        { order: 0, description: "desc", metrics: [{amount: 1, unit: "unt"}], repetitions: 3, completed: false }
      ],
      recurrEachDays: 7,
      dateTimeStart: new Date().toISOString(),
      timeRelevant: false,
    }
    const createdRes = await fetch(`${HOST}/api/recurring_activities`, {
      method: "POST",
      headers: {
        "x-planner-userid": TEST_USER_ID
      },
      body: JSON.stringify(createdActivity)
    })

    const createdId = await createdRes.json();
    expect(createdId.length).toBe("db8a5a5a-38b5-482a-a3f1-eda999d35a13".length)

    const readRes = await fetch(`${HOST}/api/recurring_activities/${createdId}`, {
      method: "GET",
      headers: {
        "x-planner-userid": TEST_USER_ID
      }
    })

    expect(readRes.status).toBe(200)

    const read = await readRes.json()
    let expectedRead = { 
      ...createdActivity,
      userId: TEST_USER_ID,
      id: createdId
    }
    expect(dateTimeFieldNormaliser(read)).toEqual(expectedRead)

    const queryRes = await fetch(`${HOST}/api/recurring_activities`, {
      method: "GET",
      headers: {
        "x-planner-userid": TEST_USER_ID
      }
    })

    const query = await queryRes.json()

    expect(query.map(dateTimeFieldNormaliser)).toEqual([expectedRead])

    let updatedActivity = structuredClone(expectedRead)

    updatedActivity.summary = "Updated Name"

    const updateRes = await fetch(`${HOST}/api/recurring_activities/${createdId}`, {
      method: "PUT",
      headers: {
        "x-planner-userid": TEST_USER_ID
      },
      body: JSON.stringify(updatedActivity)
    })

    expect(updateRes.status).toBe(200)

    const rereadRes = await fetch(`${HOST}/api/recurring_activities/${createdId}`, {
      method: "GET",
      headers: {
        "x-planner-userid": TEST_USER_ID
      }
    })

    expect(rereadRes.status).toBe(200)

    const reread = await rereadRes.json()

    expect(dateTimeFieldNormaliser(reread)).toEqual(updatedActivity)

    const deleteRes = await fetch(`${HOST}/api/recurring_activities/${createdId}`, {
      method: "DELETE",
      headers: {
        "x-planner-userid": TEST_USER_ID
      }
    })

    expect(deleteRes.status).toBe(200)

    const reGetAfterDeleteRes = await fetch(`${HOST}/api/recurring_activities/${createdId}`, {
      method: "GET",
      headers: {
        "x-planner-userid": TEST_USER_ID
      }
    })

    expect(reGetAfterDeleteRes.status).toBe(404)
  })
});
