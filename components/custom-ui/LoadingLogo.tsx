import Image from 'next/image';

type Props = {
  size?: number;
}

const LoadingLogo = ({size = 100}: Props) => {
  return (
    <div className="absolute inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
      <Image 
        src="/temp-logo.svg"
        alt="Logo"
        width={size}
        height={size}
        className="animate-pulse duration-800"
      />
    </div>
  );
}

export default LoadingLogo;
