const { randomUUID } = require("node:crypto")

const HOST = "http://localhost:3333"
const TEST_USER_ID = randomUUID()

describe('activities', () => {
  test("Create, Read, Update, Query, Delete", async () => {
    let createdActivity = {
      summary: "Some activity name",
      stages: [
        { order: 0, description: "desc", metrics: [{amount: 1, unit: "unt"}], repetitions: 3}
      ],
      dateTime: new Date().toISOString(),
      timeRelevant: false,
      completed: false,
      notes: ""
    }
    const createdRes = await fetch(`${HOST}/api/activities`, {
      method: "POST",
      headers: {
        "x-planner-userid": TEST_USER_ID
      },
      body: JSON.stringify(createdActivity)
    })

    const createdId = await createdRes.json();
    expect(createdId.length).toBe("db8a5a5a-38b5-482a-a3f1-eda999d35a13".length)

    const readRes = await fetch(`${HOST}/api/activities/${createdId}`, {
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
    expect(read).toEqual(expectedRead)

    const queryRes = await fetch(`${HOST}/api/activities`, {
      method: "GET",
      headers: {
        "x-planner-userid": TEST_USER_ID
      }
    })

    const query = await queryRes.json()

    expect(query).toEqual([expectedRead])

    let updatedActivity = structuredClone(expectedRead)

    updatedActivity.summary = "Updated Name"
    updatedActivity.notes = "Some details have been added"

    const updateRes = await fetch(`${HOST}/api/activities/${createdId}`, {
      method: "PUT",
      headers: {
        "x-planner-userid": TEST_USER_ID
      },
      body: JSON.stringify(updatedActivity)
    })

    expect(updateRes.status).toBe(200)

    const rereadRes = await fetch(`${HOST}/api/activities/${createdId}`, {
      method: "GET",
      headers: {
        "x-planner-userid": TEST_USER_ID
      }
    })

    expect(rereadRes.status).toBe(200)

    const reread = await rereadRes.json()

    expect(reread).toEqual(updatedActivity)

    const deleteRes = await fetch(`${HOST}/api/activities/${createdId}`, {
      method: "DELETE",
      headers: {
        "x-planner-userid": TEST_USER_ID
      }
    })

    expect(deleteRes.status).toBe(200)

    const reGetAfterDeleteRes = await fetch(`${HOST}/api/activities/${createdId}`, {
      method: "GET",
      headers: {
        "x-planner-userid": TEST_USER_ID
      }
    })

    expect(reGetAfterDeleteRes.status).toBe(404)
  })
});
