import { Link } from "react-router-dom";
import { cn } from "../../utils/className";

const variants = {
  primary: "bg-amber-800 text-white shadow-sm hover:bg-amber-900",
  secondary: "border border-stone-300 bg-white text-stone-800 hover:bg-stone-50",
  ghost: "bg-stone-100 text-stone-700 hover:bg-stone-200",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

export default function Button({ as = "button", to, type = "button", variant = "primary", className, children, ...props }) {
  const buttonClass = cn(
    "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2 disabled:bg-stone-300 disabled:text-white",
    variants[variant],
    className,
  );

  if (as === "link") {
    return (
      <Link to={to} className={buttonClass} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={buttonClass} {...props}>
      {children}
    </button>
  );
}
