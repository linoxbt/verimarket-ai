export function LogoMark({ className, size = 24 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path d="M2 4L14 26L18 18L8 4H2Z" fill="currentColor" />
      <path d="M30 4L18 26L14 18L24 4H30Z" fill="currentColor" />
    </svg>
  );
}
