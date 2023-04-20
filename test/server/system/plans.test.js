const { randomUUID } = require("node:crypto")

const HOST = "http://localhost:3333"
const TEST_USER_ID = randomUUID()

describe('plans', () => {
  test("Create, Read, Update, Query, Delete", async () => {
    let createdPlan = {
      name: "Some plan name",
      active: true
    }
    const createdRes = await fetch(`${HOST}/api/plans`, {
      method: "POST",
      headers: {
        "x-planner-userid": TEST_USER_ID
      },
      body: JSON.stringify(createdPlan)
    })

    const createdId = await createdRes.json();
    expect(createdId.length).toBe("db8a5a5a-38b5-482a-a3f1-eda999d35a13".length)

    const readRes = await fetch(`${HOST}/api/plans/${createdId}`, {
      method: "GET",
      headers: {
        "x-planner-userid": TEST_USER_ID
      }
    })

    expect(readRes.status).toBe(200)

    const read = await readRes.json()
    let expectedRead = { 
      ...createdPlan,
      userId: TEST_USER_ID,
      id: createdId
    }
    expect(read).toEqual(expectedRead)

    const queryRes = await fetch(`${HOST}/api/plans`, {
      method: "GET",
      headers: {
        "x-planner-userid": TEST_USER_ID
      }
    })

    const query = await queryRes.json()

    expect(query).toEqual([expectedRead])

    let updatedPlan = structuredClone(expectedRead)

    updatedPlan.name = "Updated Name"

    const updateRes = await fetch(`${HOST}/api/plans/${createdId}`, {
      method: "PUT",
      headers: {
        "x-planner-userid": TEST_USER_ID
      },
      body: JSON.stringify(updatedPlan)
    })

    expect(updateRes.status).toBe(200)

    const rereadRes = await fetch(`${HOST}/api/plans/${createdId}`, {
      method: "GET",
      headers: {
        "x-planner-userid": TEST_USER_ID
      }
    })

    expect(rereadRes.status).toBe(200)

    const reread = await rereadRes.json()

    expect(reread).toEqual(updatedPlan)

    const deleteRes = await fetch(`${HOST}/api/plans/${createdId}`, {
      method: "DELETE",
      headers: {
        "x-planner-userid": TEST_USER_ID
      }
    })

    expect(deleteRes.status).toBe(200)

    const reGetAfterDeleteRes = await fetch(`${HOST}/api/plans/${createdId}`, {
      method: "GET",
      headers: {
        "x-planner-userid": TEST_USER_ID
      }
    })

    expect(reGetAfterDeleteRes.status).toBe(404)
  })
});
