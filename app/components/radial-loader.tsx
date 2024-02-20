type RadialLoaderProps = {
  percent: number;
};

export default function RadialLoader({ percent }: RadialLoaderProps) {
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
      <circle
        className="text-amber-400 opacity-25"
        strokeWidth="4"
        stroke="currentColor"
        fill="none"
        r={radius}
        cx="12"
        cy="12"
      />
      <circle
        className="text-amber-400"
        strokeWidth="4"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="square"
        stroke="currentColor"
        fill="transparent"
        r={radius}
        cx="12"
        cy="12"
        transform="rotate(-90 12 12)"
      />
    </svg>
  );
}
