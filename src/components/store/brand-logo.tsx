import Image from "next/image";

export default function BrandLogo({
  className = "h-auto w-40 sm:w-48",
}: {
  className?: string;
}) {
  return (
    <Image
      src="/brand/glad-style-fashion-logo.png"
      alt="Glad Style Fashion"
      width={1940}
      height={701}
      priority
      className={className}
      sizes="(min-width: 640px) 192px, 160px"
    />
  );
}
