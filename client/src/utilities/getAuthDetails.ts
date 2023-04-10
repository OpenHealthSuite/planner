import { plannerGetRequest } from "./apiRequest"

export async function getAuthDetails(fnPlannerGetRequest = plannerGetRequest): Promise<{ userId: string }> {
  return fnPlannerGetRequest<{ userId: string }>('/whoami')
}