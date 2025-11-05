import { Link } from 'react-router-dom'

export default function OrderSuccess(){
  return (
    <div className="text-center py-16">
      <h1 className="h1 mb-3">Order Placed Successfully!</h1>
      <p className="text-muted mb-6">Thank you for choosing Aarnya. Your elegance is on the way.</p>
      <Link to="/products" className="btn-gold">Continue Shopping</Link>
    </div>
  )
}
