import { useInView } from '../../hooks/useInView.js'

function Reveal({
  as: Tag = 'div',
  className = '',
  delay = 0,
  children,
  style,
  ...rest
}) {
  const [ref, inView] = useInView()

  return (
    <Tag
      ref={ref}
      className={`ks-reveal${inView ? ' is-in' : ''} ${className}`.trim()}
      style={{ '--ks-delay': `${delay}ms`, ...style }}
      {...rest}
    >
      {children}
    </Tag>
  )
}

export default Reveal