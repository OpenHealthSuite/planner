export type ActivityStageMetric = {
	amount: number,
	unit: string
}

export type ActivityStage = {
	order: number,
	description: string,
	metrics: ActivityStageMetric[]
	repetitions: number
}

export type Activity = {
	id: string
	userId: string
	planId?: string
	summary: string
	stages: ActivityStage[]
	dateTime: Date
	timeRelevant: boolean
	completed: boolean
	notes: string
}

export type RecurringActivity = {
	id: string
	userId: string
	planId?: string
	summary: string
	stages: ActivityStage[]
	recurrEachDays: number
	dateTimeStart: Date
	timeRelevant: boolean
}

export type Plan = {
	id: string,
	name: string,
	userId: string,
	active: boolean
}

export type ActivityApiSubmission = Omit<Activity, "dateTime"> & { dateTime: string }

export type RecurringActivityApiSubmission = Omit<Activity, "dateTime"> & { dateTime: string }
