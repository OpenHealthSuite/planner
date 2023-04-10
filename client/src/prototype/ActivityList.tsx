// This should be replaced with the calendar ideal later

import { useEffect, useState } from "react"
import { plannerGetRequest } from "../utilities/apiRequest"
import { Activity } from "../types"
import { ListItem, UnorderedList } from "@chakra-ui/react"

export const ActivityList = ({ updated }: { updated?: string }) => {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  useEffect(() => {
    setLoading(true)
    plannerGetRequest<Activity[]>('/activities')
      .then(acts => {
        setError(false)
        setActivities(acts)
      })
      .catch(() => {
        setError(true)
      })
      .finally(() => setLoading(false))
  }, [updated, setActivities, setLoading, setError])

  if (loading) {
    return <div>Loading</div>
  }

  if (error) {
    return <div>Error!</div>
  }

  return <UnorderedList>
      {activities.map(x => <ListItem>{x.name}</ListItem>)}
  </UnorderedList>
}