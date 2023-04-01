import { plannerGetRequest } from "./apiRequest"

export async function getAuthDetails(fnPlannerGetRequest = plannerGetRequest): Promise<{ userId: string }> {
  // TODO: Not do this for every request
  return fnPlannerGetRequest<{ userId: string }>('/whoami')
}