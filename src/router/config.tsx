
import type { RouteObject } from "react-router-dom";
import NotFound from "../pages/NotFound";
import Home from "../pages/home/page";
import Jobs from "../pages/jobs/page";
import Technicians from "../pages/technicians/page";
import Customers from "../pages/customers/page";
import Settings from "../pages/settings/page";
import Login from "../pages/login/page";
import Messages from "../pages/messages/page";
import Schedule from "../pages/schedule/page";
import Dispatching from "../pages/dispatching/page";
// import Supplies from "../pages/supplies/page";

const routes: RouteObject[] = [
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/jobs",
    element: <Jobs />,
  },
  {
    path: "/technicians",
    element: <Technicians />,
  },
  {
    path: "/customers",
    element: <Customers />,
  },
  {
    path: "/messages",
    element: <Messages />,
  },
  {
    path: "/schedule",
    element: <Schedule />,
  },
  {
    path: "/dispatching",
    element: <Dispatching />,
  },
  // {
  //   path: "/supplies",
  //   element: <Supplies />,
  // },
  {
    path: "/settings",
    element: <Settings />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;
