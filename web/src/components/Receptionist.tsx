import { CLINIC } from '../config/clinic';

export type ReceptionistState = 'idle' | 'thinking' | 'listening' | 'speaking';

/** The receptionist's face. State drives a CSS animation; animation is disabled under reduced motion. */
export function Receptionist({ size = 56, state = 'idle', ring = true }: { size?: number; state?: ReceptionistState; ring?: boolean }) {
  return (
    <span className={`avatar avatar--${state}${ring ? ' avatar--ring' : ''}`} style={{ width: size, height: size }}>
      <img
        src={size > 72 ? CLINIC.receptionistImage : CLINIC.receptionistImageSmall}
        alt={`${CLINIC.receptionistName}, the ${CLINIC.name} virtual receptionist`}
        width={size}
        height={size}
        decoding="async"
      />
    </span>
  );
}
