import React from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider
} from "react-router-dom";
import App from "./App";
import WeeklySchedule from "./routes/WeeklySchedule";
import PlanManagement from "./routes/PlanManagement";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "",
        element: <WeeklySchedule />
      },
      {
        path: "plans",
        element: <PlanManagement />
      }
    ],
    errorElement: <div>Nothing here...</div>
  }
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
