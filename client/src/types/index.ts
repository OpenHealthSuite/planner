
// TODO: This should be driven by the API at some point
export type ActivityType = "running" | "cycling" | "other"
export const activityTypes: ActivityType[] = ["running", "cycling", "other"]

export type Activity = {
	id: string
	userId: string
	name: string
	type: ActivityType
	attributes: { [key: string]: string }
	details?: string
	dateTime: Date
	timeRelevant: boolean
	durationMinutes?: number
	completed: boolean
}