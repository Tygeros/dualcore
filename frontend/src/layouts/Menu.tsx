import { NavLink } from "react-router-dom";

import { TbLayoutDashboardFilled } from "react-icons/tb";
import { FaProjectDiagram } from "react-icons/fa";
import { FaTasks } from "react-icons/fa";
import { IoIosSettings } from "react-icons/io";


export default function Menu() {
  
  const itemStyle = "flex flex-col items-center justify-center text-sm text-neutral-500 hover:text-neutral-300 hover:scale-105 transitions-all duration-300";
  const activeItemStyle = "flex flex-col items-center justify-center text-sm text-white hover:scale-105 transitions-all duration-300";

  return (
    <div className="fixed bottom-0 left-0 right-0 p-2 grid grid-cols-4 bg-neutral-800">
      <NavLink to="/" className={({ isActive }) => isActive ? activeItemStyle : itemStyle}>
        <TbLayoutDashboardFilled className="text-2xl"/>
        <div>Dashboard</div>
      </NavLink>

      <NavLink to="/projects" className={({ isActive }) => isActive ? activeItemStyle : itemStyle}>
        <FaProjectDiagram className="text-2xl"/>
        <div>Projects</div>
      </NavLink>

      <NavLink to="/tasks" className={({ isActive }) => isActive ? activeItemStyle : itemStyle}>
        <FaTasks className="text-2xl" />
        <div>Tasks</div>
      </NavLink>

      <NavLink to="/settings" className={({ isActive }) => isActive ? activeItemStyle : itemStyle}>
        <IoIosSettings className="text-2xl"/>
        <div>Settings</div>
      </NavLink>

    </div>
  )
}

