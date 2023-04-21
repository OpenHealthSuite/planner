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

export type ActivityApiSubmission = Omit<Activity, "dateTime"> & { dateTime: string }
