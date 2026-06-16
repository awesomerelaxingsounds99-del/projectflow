import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="landing">
      <nav className="landing-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, background: '#185FA5', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.02em', color: '#0F1B2D' }}>ProjectFlow</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <a href="#features" style={{ color: '#5A6577', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Features</a>
          <a href="#pricing" style={{ color: '#5A6577', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Pricing</a>
          <Link href="/login" style={{ color: '#5A6577', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Sign in</Link>
          <Link href="/signup" style={{ background: '#185FA5', color: '#fff', padding: '8px 16px', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>Get started</Link>
        </div>
      </nav>

      <section style={{ padding: '80px 40px 60px', maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#EFF4FF', color: '#185FA5', borderRadius: 999, padding: '5px 12px', fontSize: 13, fontWeight: 600, marginBottom: 24 }}>
          For MEP engineering firms
        </div>
        <h1 style={{ fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 20, color: '#0F1B2D' }}>
          Your branded project portal —{' '}
          <span style={{ color: '#185FA5' }}>ready in minutes</span>
        </h1>
        <p style={{ fontSize: 18, color: '#5A6577', maxWidth: 600, margin: '0 auto 36px', lineHeight: 1.65 }}>
          Clients submit projects, receive estimates, and approve them with a digital signature — all under your brand and domain.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/signup" style={{ background: '#185FA5', color: '#fff', padding: '14px 28px', borderRadius: 10, textDecoration: 'none', fontSize: 16, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            Start for $45.99/mo
          </Link>
          <Link href="/portal/rge" style={{ background: '#fff', color: '#0F1B2D', padding: '14px 28px', borderRadius: 10, textDecoration: 'none', fontSize: 16, fontWeight: 600, border: '1.5px solid #E9EBF0' }}>
            View demo portal
          </Link>
        </div>
        <p style={{ marginTop: 16, fontSize: 13.5, color: '#8A93A3' }}>No credit card required · Free subdomain included · Cancel anytime</p>
      </section>

      <section id="features" style={{ background: '#F6F8FC', padding: '72px 40px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 48, color: '#0F1B2D' }}>Everything your firm needs</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {[
              { icon: '🏷️', title: 'White-Label Portal', desc: 'Your brand, your domain. Clients never see ProjectFlow.' },
              { icon: '📄', title: 'Estimates & Invoices', desc: 'Professional documents with live math, line items, and digital approval.' },
              { icon: '🏗️', title: 'Milestone Billing', desc: 'Break projects into phases. Bill each milestone with one click.' },
              { icon: '👥', title: 'Client Tracker', desc: 'Every project, estimate, and invoice in one organized dashboard.' },
              { icon: '🌐', title: 'Custom Domain', desc: 'Connect portal.yourfirm.com with a simple CNAME record.' },
              { icon: '📧', title: 'Email Notifications', desc: 'Automated emails for sends, approvals, and payment reminders.' },
            ].map(f => (
              <div key={f.title} style={{ background: '#fff', border: '1px solid #E9EBF0', borderRadius: 14, padding: '24px 22px' }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: '#0F1B2D' }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: '#5A6577', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" style={{ padding: '72px 40px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 40, alignItems: 'center' }}>
          <div style={{ background: '#fff', border: '2px solid #185FA5', borderRadius: 16, padding: 32 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#185FA5', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>All-inclusive</div>
            <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: '-0.03em', color: '#0F1B2D', marginBottom: 4 }}>$45.99<span style={{ fontSize: 20, fontWeight: 500, color: '#5A6577' }}>/mo</span></div>
            <p style={{ color: '#5A6577', fontSize: 14, marginBottom: 24 }}>Everything you need, one flat price.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
              {['White-label client portal', 'Unlimited estimates & invoices', 'Digital signature approvals', 'Milestone/phase billing', 'Custom domain support', 'Email notifications'].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#0F1B2D' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0B6E4F" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  {item}
                </div>
              ))}
            </div>
            <Link href="/signup" style={{ display: 'block', textAlign: 'center', background: '#185FA5', color: '#fff', padding: '13px 20px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 15 }}>
              Get started
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { icon: '✅', text: '30-day money-back guarantee' },
              { icon: '🔗', text: 'Free subdomain included' },
              { icon: '📵', text: 'No contracts, cancel anytime' },
            ].map(item => (
              <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', background: '#F6F8FC', borderRadius: 12 }}>
                <span style={{ fontSize: 24 }}>{item.icon}</span>
                <span style={{ fontSize: 15, fontWeight: 500, color: '#0F1B2D' }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: '#185FA5', padding: '60px 40px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 16 }}>Ready to streamline your firm?</h2>
        <p style={{ color: 'rgba(255,255,255,.8)', fontSize: 16, marginBottom: 28 }}>Join MEP firms using ProjectFlow to impress clients and close projects faster.</p>
        <Link href="/signup" style={{ background: '#fff', color: '#185FA5', padding: '14px 32px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 16, display: 'inline-block' }}>
          Start for $45.99/mo
        </Link>
      </section>

      <footer style={{ borderTop: '1px solid #E9EBF0', padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 24, height: 24, background: '#185FA5', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: 14 }}>ProjectFlow</span>
        </div>
        <p style={{ color: '#8A93A3', fontSize: 13 }}>© 2026 ProjectFlow. All rights reserved.</p>
      </footer>
    </div>
  )
}
