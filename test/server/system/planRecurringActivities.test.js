const { randomUUID } = require("node:crypto")
const { dateTimeFieldNormaliser } = require("./utilities")

const HOST = "http://localhost:3333"
describe("Plan Relations", () => {
    const TEST_USER_ID = randomUUID()

    const createActivity = async (createdActivity) => {
        const createdRes = await fetch(`${HOST}/api/recurring_activities`, {
            method: "POST",
            headers: {
                "x-planner-userid": TEST_USER_ID
            },
            body: JSON.stringify(createdActivity)
        })

        const createdId = await createdRes.json();

        const readRes = await fetch(`${HOST}/api/recurring_activities/${createdId}`, {
            method: "GET",
            headers: {
                "x-planner-userid": TEST_USER_ID
            }
        })
        const read = await readRes.json()
        return dateTimeFieldNormaliser({
            ...read,
            userId: TEST_USER_ID,
            id: createdId
        })
    }

    const createPlan = async (createdPlan) => {
        const createdRes = await fetch(`${HOST}/api/plans`, {
            method: "POST",
            headers: {
                "x-planner-userid": TEST_USER_ID
            },
            body: JSON.stringify(createdPlan)
        })

        const createdId = await createdRes.json();

        const readRes = await fetch(`${HOST}/api/plans/${createdId}`, {
            method: "GET",
            headers: {
                "x-planner-userid": TEST_USER_ID
            }
        })

        const read = await readRes.json()
        return {
            ...read,
            userId: TEST_USER_ID,
            id: createdId
        }
    }
    test("Plan Activities", async () => {
        // Create Plan
        const plan = await createPlan({
            name: "Plan for user",
            active: true
        })
        // Create Activity against Plan
        const planActivity = await createActivity({
            summary: "Plan activity",
            planId: plan.id,
            stages: [
                { order: 0, description: "desc", metrics: [{ amount: 1, unit: "unt" }], repetitions: 3 }
            ],
            dateTimeStart: new Date().toISOString(),
            timeRelevant: false,
            recurrEachDays: 7,
        });
        const planActivity2 = await createActivity({
            summary: "Plan activity 2",
            planId: plan.id,
            stages: [
                { order: 0, description: "desc", metrics: [{ amount: 1, unit: "unt" }], repetitions: 3 }
            ],
            dateTimeStart: new Date().toISOString(),
            timeRelevant: false,
            recurrEachDays: 7,
        });
        // Create Activity without Plan
        const looseActivity = await createActivity({
            summary: "Loose activity",
            planId: null,
            stages: [
                { order: 0, description: "desc", metrics: [{ amount: 1, unit: "unt" }], repetitions: 3 }
            ],
            dateTimeStart: new Date().toISOString(),
            timeRelevant: false,
            recurrEachDays: 7,
        });

        const looseActivity2 = await createActivity({
            summary: "Loose activity 2",
            planId: null,
            stages: [
                { order: 0, description: "desc", metrics: [{ amount: 1, unit: "unt" }], repetitions: 3 }
            ],
            dateTimeStart: new Date().toISOString(),
            timeRelevant: false,
            recurrEachDays: 7,
        });
        // Rejects Activity where Plan does not exist
        const badRes = await fetch(`${HOST}/api/recurring_activities`, {
            method: "POST",
            headers: {
                "x-planner-userid": TEST_USER_ID
            },
            body: JSON.stringify({
                summary: "No Plan activity",
                planId: randomUUID(),
                stages: [
                    { order: 0, description: "desc", metrics: [{ amount: 1, unit: "unt" }], repetitions: 3 }
                ],
                dateTimeStart: new Date().toISOString(),
                timeRelevant: false,
                completed: false,
                notes: ""
            })
        })
        expect(badRes.status).toBe(400);
        // Filter for Activities on Plan
        const planActivities = await fetch(`${HOST}/api/recurring_activities?planId=${plan.id}`, {
            method: "GET",
            headers: {
                "x-planner-userid": TEST_USER_ID
            }
        }).then(res => res.json())

        expect(planActivities.sort((a, b) => a.id.localeCompare(b.id)).map(dateTimeFieldNormaliser)).toEqual([planActivity, planActivity2].sort((a, b) => a.id.localeCompare(b.id)))

        const allActivities = await fetch(`${HOST}/api/recurring_activities`, {
            method: "GET",
            headers: {
                "x-planner-userid": TEST_USER_ID
            }
        }).then(res => res.json())

        expect(allActivities.sort((a, b) => a.id.localeCompare(b.id)).map(dateTimeFieldNormaliser)).toEqual([planActivity, planActivity2, looseActivity, looseActivity2].sort((a, b) => a.id.localeCompare(b.id)))

        // Deleting Plan also Deletes Child Activities
        await fetch(`${HOST}/api/plans/${plan.id}`, {
            method: "DELETE",
            headers: {
                "x-planner-userid": TEST_USER_ID
            }
        })

        const remainingActivities = await fetch(`${HOST}/api/recurring_activities`, {
            method: "GET",
            headers: {
                "x-planner-userid": TEST_USER_ID
            }
        }).then(res => res.json())

        expect(remainingActivities.sort((a, b) => a.id.localeCompare(b.id)).map(dateTimeFieldNormaliser)).toEqual([looseActivity, looseActivity2].sort((a, b) => a.id.localeCompare(b.id)))

    })
})
