import React from 'react';

interface ExamBoardLogoProps {
  board: string;
  size?: number;
  className?: string;
  showName?: boolean;
}

export const ExamBoardLogo: React.FC<ExamBoardLogoProps> = ({
  board,
  size = 40,
  className = '',
  showName = false,
}) => {
  const norm = (board || '').toUpperCase();
  const [hasError, setHasError] = React.useState(false);

  let logoSrc = '/assets/logos/jamb.png';
  let label = 'JAMB / UTME';

  if (norm.includes('POST-UTME') || norm.includes('POST UTME')) {
    logoSrc = '/assets/logos/post-utme.png';
    label = 'POST-UTME';
  } else if (norm.includes('GCE')) {
    logoSrc = '/assets/logos/gce.png';
    label = 'GCE';
  } else if (norm.includes('WAEC') || norm.includes('WASSCE')) {
    logoSrc = '/assets/logos/waec.png';
    label = 'WAEC / SSCE';
  } else if (norm.includes('NECO')) {
    logoSrc = '/assets/logos/neco.png';
    label = 'NECO';
  } else if (norm.includes('NABTEB')) {
    logoSrc = '/assets/logos/nabteb.png';
    label = 'NABTEB';
  } else {
    logoSrc = '/assets/logos/jamb.png';
    label = 'JAMB / UTME';
  }

  return (
    <div
      className={`exam-board-logo-container ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          minWidth: `${size}px`,
          borderRadius: '8px',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.06)',
          padding: '2px',
        }}
      >
        {!hasError ? (
          <img
            src={logoSrc}
            alt={`${label} Official Examination Logo`}
            onError={() => setHasError(true)}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
            }}
            loading="lazy"
          />
        ) : (
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 800,
              fontSize: `${Math.max(10, size * 0.28)}px`,
              color: '#105B38',
              letterSpacing: '0.04em',
            }}
          >
            {label.split(' ')[0]}
          </span>
        )}
      </div>
      {showName && (
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontWeight: 700,
            fontSize: `${Math.max(12, size * 0.32)}px`,
            color: 'var(--ink)',
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
};

