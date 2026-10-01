import LogoDemo from "../components/LogoDemo"

export default function Header() {
  return (
    <div className="sticky top-0 p-2 flex flex-row gap-2 bg-neutral-900">
      <LogoDemo /> 
      <div className="flex items-center text-lg font-bold"> DualCore</div>
    </div>
  )
}

