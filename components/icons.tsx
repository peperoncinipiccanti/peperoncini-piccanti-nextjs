/**
 * Icone social minimali disegnate a mano (contorno, stile "feather-like").
 * lucide-react ha rimosso le icone di brand anni fa per motivi di licenza,
 * quindi qui sotto un piccolo set di icone generiche invece di aggiungere
 * una dipendenza in piu' (es. simple-icons) solo per 4 loghi.
 */

type IconProps = { size?: number; className?: string };

export function FacebookIcon({ size = 18, className }: IconProps) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
			<path
				d="M15 8.5h2V5.5h-2c-2.2 0-4 1.8-4 4V12H9v3h2v6h3v-6h2.2l.8-3H14v-2.5c0-.55.45-1 1-1Z"
				stroke="currentColor"
				strokeWidth="1.6"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

export function InstagramIcon({ size = 18, className }: IconProps) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
			<rect x="4" y="4" width="16" height="16" rx="4" stroke="currentColor" strokeWidth="1.6" />
			<circle cx="12" cy="12" r="3.4" stroke="currentColor" strokeWidth="1.6" />
			<circle cx="16.6" cy="7.4" r="0.9" fill="currentColor" />
		</svg>
	);
}

export function PinterestIcon({ size = 18, className }: IconProps) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
			<circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
			<path
				d="M9.5 18c.6-2.4 1.4-5.6 1.9-7.6.3-1.1 1.9-1.9 3-1.2.9.6 1 2 .6 3.1-.4 1.2-1 2.5-2.2 2.5-.6 0-1-.3-1.2-.8"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
			/>
		</svg>
	);
}

export function XIcon({ size = 18, className }: IconProps) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
			<path d="M5 5l14 14M19 5 5 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
		</svg>
	);
}
