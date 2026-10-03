export default function Seal({ className }: { className?: string }) {
  return (
    // Plain <img>: the site is a static export, and basePath isn't auto-applied to raw public/ URLs.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/chi-psi-seal.png`}
      alt="Chi Psi Fraternity seal"
      width={525}
      height={525}
      className={className}
    />
  );
}
