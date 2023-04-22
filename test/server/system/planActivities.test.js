const { randomUUID } = require("node:crypto")
const HOST = "http://localhost:3333"
describe("Plan Relations", () => {
    const TEST_USER_ID = randomUUID()

    const createActivity = async (createdActivity) => {
        const createdRes = await fetch(`${HOST}/api/activities`, {
            method: "POST",
            headers: {
                "x-planner-userid": TEST_USER_ID
            },
            body: JSON.stringify(createdActivity)
        })

        const createdId = await createdRes.json();

        const readRes = await fetch(`${HOST}/api/activities/${createdId}`, {
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
            dateTime: new Date().toISOString(),
            timeRelevant: false,
            completed: false,
            notes: ""
        });
        const planActivity2 = await createActivity({
            summary: "Plan activity 2",
            planId: plan.id,
            stages: [
                { order: 0, description: "desc", metrics: [{ amount: 1, unit: "unt" }], repetitions: 3 }
            ],
            dateTime: new Date().toISOString(),
            timeRelevant: false,
            completed: false,
            notes: ""
        });
        // Create Activity without Plan
        const looseActivity = await createActivity({
            summary: "Loose activity",
            planId: null,
            stages: [
                { order: 0, description: "desc", metrics: [{ amount: 1, unit: "unt" }], repetitions: 3 }
            ],
            dateTime: new Date().toISOString(),
            timeRelevant: false,
            completed: false,
            notes: ""
        });

        const looseActivity2 = await createActivity({
            summary: "Loose activity 2",
            planId: null,
            stages: [
                { order: 0, description: "desc", metrics: [{ amount: 1, unit: "unt" }], repetitions: 3 }
            ],
            dateTime: new Date().toISOString(),
            timeRelevant: false,
            completed: false,
            notes: ""
        });
        // Rejects Activity where Plan does not exist
        const badRes = await fetch(`${HOST}/api/activities`, {
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
                dateTime: new Date().toISOString(),
                timeRelevant: false,
                completed: false,
                notes: ""
            })
        })
        expect(badRes.status).toBe(400);
        // Filter for Activities on Plan
        const planActivities = await fetch(`${HOST}/api/activities?planId=${plan.id}`, {
            method: "GET",
            headers: {
                "x-planner-userid": TEST_USER_ID
            }
        }).then(res => res.json())

        expect(planActivities.sort((a, b) => a.id.localeCompare(b.id))).toEqual([planActivity, planActivity2].sort((a, b) => a.id.localeCompare(b.id)))

        const allActivities = await fetch(`${HOST}/api/activities`, {
            method: "GET",
            headers: {
                "x-planner-userid": TEST_USER_ID
            }
        }).then(res => res.json())

        expect(allActivities.sort((a, b) => a.id.localeCompare(b.id))).toEqual([planActivity, planActivity2, looseActivity, looseActivity2].sort((a, b) => a.id.localeCompare(b.id)))

        // Deleting Plan also Deletes Child Activities
        await fetch(`${HOST}/api/plans/${plan.id}`, {
            method: "DELETE",
            headers: {
                "x-planner-userid": TEST_USER_ID
            }
        })

        const remainingActivities = await fetch(`${HOST}/api/activities`, {
            method: "GET",
            headers: {
                "x-planner-userid": TEST_USER_ID
            }
        }).then(res => res.json())

        expect(remainingActivities.sort((a, b) => a.id.localeCompare(b.id))).toEqual([looseActivity, looseActivity2].sort((a, b) => a.id.localeCompare(b.id)))

    })
})

describe("Plan Relations", () => {
    const TEST_USER_ID = randomUUID()

    const createActivity = async (createdActivity) => {
        const createdRes = await fetch(`${HOST}/api/activities`, {
            method: "POST",
            headers: {
                "x-planner-userid": TEST_USER_ID
            },
            body: JSON.stringify(createdActivity)
        })

        const createdId = await createdRes.json();

        const readRes = await fetch(`${HOST}/api/activities/${createdId}`, {
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
    test("Plan Activities with Dates", async () => {
        // Create Plan
        const plan = await createPlan({
            name: "Plan for user",
            active: true
        })

        const earlyDate = new Date(1991, 4, 12);
        const midDate = new Date(1991, 8, 12);
        const lateDate = new Date(1992, 4, 12);

        // Create Activity against Plan
        const earlyPlan = await createActivity({
            summary: "Early Plan activity",
            planId: plan.id,
            stages: [
                { order: 0, description: "desc", metrics: [{ amount: 1, unit: "unt" }], repetitions: 3 }
            ],
            dateTime: earlyDate.toISOString(),
            timeRelevant: false,
            completed: false,
            notes: ""
        });
        const midPlan = await createActivity({
            summary: "Mid Plan activity",
            planId: plan.id,
            stages: [
                { order: 0, description: "desc", metrics: [{ amount: 1, unit: "unt" }], repetitions: 3 }
            ],
            dateTime: midDate.toISOString(),
            timeRelevant: false,
            completed: false,
            notes: ""
        });
        const latePlan = await createActivity({
            summary: "Late Plan activity",
            planId: plan.id,
            stages: [
                { order: 0, description: "desc", metrics: [{ amount: 1, unit: "unt" }], repetitions: 3 }
            ],
            dateTime: lateDate.toISOString(),
            timeRelevant: false,
            completed: false,
            notes: ""
        });

        const earlyPlanless = await createActivity({
            summary: "Early Plan activity",
            stages: [
                { order: 0, description: "desc", metrics: [{ amount: 1, unit: "unt" }], repetitions: 3 }
            ],
            dateTime: earlyDate.toISOString(),
            timeRelevant: false,
            completed: false,
            notes: ""
        });
        const midPlanless = await createActivity({
            summary: "Mid Plan activity",
            stages: [
                { order: 0, description: "desc", metrics: [{ amount: 1, unit: "unt" }], repetitions: 3 }
            ],
            dateTime: midDate.toISOString(),
            timeRelevant: false,
            completed: false,
            notes: ""
        });
        const latePlanless = await createActivity({
            summary: "Late Plan activity",
            stages: [
                { order: 0, description: "desc", metrics: [{ amount: 1, unit: "unt" }], repetitions: 3 }
            ],
            dateTime: lateDate.toISOString(),
            timeRelevant: false,
            completed: false,
            notes: ""
        });

        expect((await fetch(`${HOST}/api/activities`, {
            method: "GET",
            headers: {
                "x-planner-userid": TEST_USER_ID
            }
        }).then(res => res.json())).sort((a, b) => a.id.localeCompare(b.id)))
            .toEqual([earlyPlan, midPlan, latePlan, earlyPlanless, midPlanless, latePlanless].sort((a, b) => a.id.localeCompare(b.id)))
    
        earlyDate.setDate(earlyDate.getDate() + 1)
        lateDate.setDate(lateDate.getDate() - 1)
    
        expect((await fetch(`${HOST}/api/activities?timeStart=${earlyDate.toISOString()}&timeEnd=${lateDate.toISOString()}`, {
            method: "GET",
            headers: {
                "x-planner-userid": TEST_USER_ID
            }
        }).then(res => res.json())).sort((a, b) => a.id.localeCompare(b.id)))
            .toEqual([midPlan, midPlanless].sort((a, b) => a.id.localeCompare(b.id)))

        expect((await fetch(`${HOST}/api/activities?planId=${plan.id}&timeStart=${earlyDate.toISOString()}&timeEnd=${lateDate.toISOString()}`, {
            method: "GET",
            headers: {
                "x-planner-userid": TEST_USER_ID
            }
        }).then(res => res.json())).sort((a, b) => a.id.localeCompare(b.id))).toEqual([midPlan])
    })
})