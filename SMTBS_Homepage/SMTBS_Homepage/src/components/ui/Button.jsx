import { Link } from "react-router-dom";

const VARIANTS = {
  primary: "bg-accent text-white hover:bg-accent-hover shadow-card",
  secondary:
    "bg-surface text-text-primary border border-border-strong hover:bg-surface-hover",
  ghost: "bg-transparent text-text-primary hover:bg-surface",
  outline: "bg-transparent text-white border border-white/30 hover:bg-white/10",
};

const SIZES = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-7 text-base",
};

export default function Button({
  as,
  to,
  href,
  variant = "primary",
  size = "md",
  className = "",
  icon: Icon,
  iconPosition = "left",
  children,
  ...props
}) {
  const classes = `inline-flex items-center justify-center gap-2 rounded-lg font-semibold
    transition-colors duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed
    ${VARIANTS[variant]} ${SIZES[size]} ${className}`;

  const content = (
    <>
      {Icon && iconPosition === "left" && <Icon className="h-4 w-4" aria-hidden="true" />}
      {children}
      {Icon && iconPosition === "right" && <Icon className="h-4 w-4" aria-hidden="true" />}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes} {...props}>
        {content}
      </a>
    );
  }

  const Component = as || "button";
  return (
    <Component type={as ? undefined : "button"} className={classes} {...props}>
      {content}
    </Component>
  );
}
