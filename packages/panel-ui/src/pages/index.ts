import type { ComponentType } from "react";
import LoginPage from "./LoginPage";
import Dashboard from "./Dashboard";
import Players from "./Players";
import PlayerView from "./Player";
import Console from "./Console";
import Settings from "./Settings";

type RouteConfig = {
  path: string;
  element: ComponentType;
  auth?: boolean;
  layout?: boolean;
};

export const routes: RouteConfig[] = [
  { path: "/login",             element: LoginPage,   auth: false },
  { path: "/dashboard",         element: Dashboard },
  { path: "/players",           element: Players },
  { path: "/players/:playerId", element: PlayerView },
  { path: "/console",           element: Console },
  { path: "/settings",          element: Settings },
];
