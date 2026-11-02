export default function PageHeader({ eyebrow, title, subtitle, children }) {
  return (
    <header className="page-head">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {subtitle && <p className="sub">{subtitle}</p>}
      {children}
    </header>
  )
}
