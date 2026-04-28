export default function Logo({ className = '' }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 100 80" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer Wavy Shape */}
      <path
        d="M20,60 C 35,60 40,20 60,20 L 75,20 L 60,60 C 45,60 40,20 20,20 L 5,20 Z"
        fill="currentColor"
        transform="skewX(-15)"
      />
      
      {/* A refined hand-coded approximation of the N-wave logo from the reference */}
      <path 
        d="M10,80 L35,80 C50,80 50,40 65,40 L90,40 C85,60 70,80 55,80 C40,80 40,40 25,40 L10,60 Z"
        fill="currentColor"
      />
      <path 
        d="M10,40 L35,40 C50,40 50,0 65,0 L90,0 C85,20 70,40 55,40 C40,40 40,0 25,0 L10,20 Z"
        fill="currentColor"
      />
    </svg>
  );
}
