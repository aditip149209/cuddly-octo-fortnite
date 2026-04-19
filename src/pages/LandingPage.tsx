import { Link } from 'react-router-dom'
import './AuthPages.css'

export default function LandingPage() {
	return (
		<section className="landing-shell">
			<div className="landing-hero">
				<h1>Welcome to our Computer Vision Project</h1>
				<p className="landing-subtitle">
					Build, test, and explore intelligent visual systems in one place.
				</p>
				<Link className="auth-btn auth-btn-primary landing-cta" to="/login">
					Register / Login
				</Link>
			</div>
		</section>
	)
}
