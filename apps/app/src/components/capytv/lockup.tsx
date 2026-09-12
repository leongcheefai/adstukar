import capyLogo from "../../assets/capytv-logo.png";

/** The brand lockup file. On a dark ground, `.capy-logo` reverses it to white. */
export function CapyLockup({
  className,
  inverted = true,
}: {
  className?: string;
  inverted?: boolean;
}) {
  return (
    <img
      className={[inverted ? "capy-logo" : "block w-auto", className].filter(Boolean).join(" ")}
      src={capyLogo}
      alt="CapyTV"
    />
  );
}
