import { Outlet } from "react-router-dom";

import Header from "./Header";
import Menu from "./Menu";

export default function MainLayout() {
  return (
    <div>
      <Header />
      <Outlet />
      <Menu />
    </div>
  )
}
