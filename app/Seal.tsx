export default function Seal({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
    >
      <circle cx="50" cy="50" r="46" strokeWidth="1" />
      <circle cx="50" cy="50" r="41" strokeWidth="0.75" />
      <circle cx="50" cy="50" r="2" fill="currentColor" stroke="none" />
      {[0, 90, 180, 270].map((deg) => (
        <line
          key={deg}
          x1="50"
          y1="4"
          x2="50"
          y2="10"
          strokeWidth="1"
          transform={`rotate(${deg} 50 50)`}
        />
      ))}
      <text
        x="50"
        y="61"
        textAnchor="middle"
        fontFamily="var(--font-garamond), Georgia, serif"
        fontSize="34"
        fill="currentColor"
        stroke="none"
        letterSpacing="1"
      >
        ΑΝΤ
      </text>
    </svg>
  );
}
